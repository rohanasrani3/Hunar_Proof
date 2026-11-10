/**
 * In-memory mock backend. Implements the contract in src/contract/schemas.ts
 * so the frontend can be built before the real backend exists.
 *
 * NOT persistent: state (including uploaded media) resets on every server
 * restart / serverless cold start. The real pilot MUST run on the real backend.
 */
import type {
  AcceptInput,
  Commission,
  CreateCommissionInput,
  CreateReviewInput,
  CreateSubmissionInput,
  ImpactStats,
  Match,
  Media,
  Portfolio,
  PortfolioItem,
  Review,
  Submission,
  TalentCard,
  UpdateCommissionInput,
  WorkSample,
} from "@/contract/schemas";
import { createSeed, type DB } from "./seed";

const g = globalThis as unknown as { __hunarDb?: DB; __hunarBlobs?: Map<string, { type: string; bytes: Uint8Array }> };
const db = (): DB => (g.__hunarDb ??= createSeed());
const blobs = () => (g.__hunarBlobs ??= new Map());

export function resetDb() {
  g.__hunarDb = createSeed();
  g.__hunarBlobs = new Map();
}

export class NotFound extends Error {}
/** Request is valid JSON but not allowed in the current state → 409. */
export class BadState extends Error {}
/** Request itself is unacceptable (e.g. wrong file type) → 400. */
export class BadRequest extends Error {}

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

/* ---------- Commissions ---------- */

export function listCommissions(
  filter: { employerId?: string; artistId?: string; guruId?: string; status?: string } = {},
): Commission[] {
  return db().commissions.filter(
    (c) =>
      (!filter.employerId || c.employerId === filter.employerId) &&
      (!filter.artistId || c.artistId === filter.artistId) &&
      (!filter.guruId || c.guruId === filter.guruId) &&
      (!filter.status || c.status === filter.status),
  );
}

export function getCommission(id: string): Commission {
  const c = db().commissions.find((x) => x.id === id);
  if (!c) throw new NotFound(`Commission ${id} not found`);
  return c;
}

export function createCommission(input: CreateCommissionInput): Commission {
  const employer = db().employers.find((e) => e.id === input.employerId);
  if (!employer) throw new NotFound(`Employer ${input.employerId} not found`);
  const c: Commission = {
    id: uid("c"),
    employerId: input.employerId,
    title: input.title ?? input.rawRequest.slice(0, 60),
    rawRequest: input.rawRequest,
    status: "draft",
    artFormIds: [],
    estDays: 1,
    feeInr: 0,
    onSite: false,
    city: employer.city,
    criteria: [],
    milestones: [],
    createdAt: now(),
  };
  db().commissions.push(c);
  return c;
}

export function updateCommission(id: string, patch: UpdateCommissionInput): Commission {
  const c = getCommission(id);
  Object.assign(c, patch);
  return c;
}

/* ---------- Matching ---------- */

export function listMatches(commissionId?: string): Match[] {
  return db()
    .matches.filter((m) => !commissionId || m.commissionId === commissionId)
    .sort((a, b) => b.score - a.score);
}

export function confirmMatch(matchId: string): Match {
  const m = db().matches.find((x) => x.id === matchId);
  if (!m) throw new NotFound(`Match ${matchId} not found`);
  const c = getCommission(m.commissionId);
  if (c.status !== "open") throw new BadState(`Commission is ${c.status}, expected open`);
  for (const other of db().matches) if (other.commissionId === m.commissionId && other.id !== m.id) other.status = "rejected";
  m.status = "confirmed";
  Object.assign(c, { status: "matched", artistId: m.artistId, guruId: m.guruId });
  return m;
}

/* ---------- Media ---------- */

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function saveUpload(file: { type: string; bytes: Uint8Array }, meta: { stage: Media["stage"]; caption?: string }): Media {
  const kind: Media["kind"] = file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : "photo";
  const id = uid("md");
  blobs().set(id, file);
  const media: Media = { id, kind, stage: meta.stage, url: `/api/media/${id}`, caption: meta.caption, createdAt: now() };
  db().media.push(media);
  return media;
}

export function getBlob(id: string) {
  const b = blobs().get(id);
  if (!b) throw new NotFound(`Media ${id} not found`);
  return b;
}

/* ---------- Submissions & reviews ---------- */

export function listSubmissions(commissionId: string): Submission[] {
  return db().submissions.filter((s) => s.commissionId === commissionId);
}

export function getSubmission(id: string): Submission {
  const s = db().submissions.find((x) => x.id === id);
  if (!s) throw new NotFound(`Submission ${id} not found`);
  return s;
}

export function createSubmission(input: CreateSubmissionInput): Submission {
  const c = getCommission(input.commissionId);
  const media = input.mediaIds.map((id) => {
    const m = db().media.find((x) => x.id === id);
    if (!m) throw new NotFound(`Media ${id} not found`);
    return m;
  });
  const voice = input.voiceNoteId ? db().media.find((x) => x.id === input.voiceNoteId) : undefined;
  const sub: Submission = {
    id: uid("s"),
    commissionId: c.id,
    milestoneId: input.milestoneId,
    media,
    note: input.note,
    voiceNoteUrl: voice?.url,
    submittedAt: now(),
  };
  db().submissions.push(sub);
  const ms = c.milestones.find((m) => m.id === input.milestoneId);
  if (ms) ms.status = "submitted";
  c.status = "in_review";
  return sub;
}

export function listReviews(commissionId: string): Review[] {
  return db().reviews.filter((r) => r.commissionId === commissionId);
}

export function createReview(input: CreateReviewInput): Review {
  const sub = getSubmission(input.submissionId);
  const c = getCommission(sub.commissionId);
  const review: Review = { id: uid("r"), commissionId: c.id, reviewedAt: now(), ...input };
  db().reviews.push(review);
  const allPass = review.results.every((r) => r.verdict === "pass");
  const ms = c.milestones.find((m) => m.id === sub.milestoneId);
  if (ms) ms.status = allPass ? "done" : "doing";
  c.status = allPass ? "in_review" : "in_progress"; // stays in_review until the employer accepts
  return review;
}

export function acceptCommission(commissionId: string, input: AcceptInput) {
  const c = getCommission(commissionId);
  if (!input.workViewed) throw new BadState("Employer must view the final work before accepting");
  const latest = listReviews(commissionId).at(-1);
  if (!latest) throw new BadState("Commission has no guru review yet");
  const acceptance = { commissionId, acceptedAt: now(), ...input };
  db().acceptances = db().acceptances.filter((a) => a.commissionId !== commissionId).concat(acceptance);
  const verified = latest.results.every((r) => r.verdict === "pass");
  c.status = verified ? "verified" : "accepted";
  if (verified && !db().slugs[commissionId]) {
    db().slugs[commissionId] = `hp-${String(Object.keys(db().slugs).length + 1).padStart(4, "0")}`;
  }
  return { acceptance, slug: db().slugs[commissionId] ?? null };
}

/* ---------- Read models ---------- */

const person = (id?: string) => {
  const p = db().people.find((x) => x.id === id);
  if (!p) throw new NotFound(`Person ${id} not found`);
  return p;
};

/** The piece to show first: final photo/video/audio, else the latest process media. */
function cover(commissionId: string): Media | undefined {
  const all = listSubmissions(commissionId).flatMap((s) => s.media);
  return all.filter((m) => m.stage === "final").at(-1) ?? all.at(-1);
}

export function getWorkSample(slug: string): WorkSample {
  const commissionId = Object.entries(db().slugs).find(([, s]) => s === slug)?.[0];
  if (!commissionId) throw new NotFound(`Work sample ${slug} not found`);
  const commission = getCommission(commissionId);
  return {
    slug,
    commission,
    employer: db().employers.find((e) => e.id === commission.employerId)!,
    artist: person(commission.artistId),
    guru: person(commission.guruId),
    submissions: listSubmissions(commissionId),
    review: listReviews(commissionId).at(-1)!,
    acceptance: db().acceptances.find((a) => a.commissionId === commissionId)!,
  };
}

const avg = (r: Review) => (r.rubric.craft + r.rubric.tradition + r.rubric.timeliness) / 3;

export function getPortfolio(handle: string): Portfolio {
  const p = db().people.find((x) => x.handle === handle);
  if (!p) throw new NotFound(`Person ${handle} not found`);
  const samples: PortfolioItem[] = Object.entries(db().slugs)
    .map(([commissionId, slug]) => ({ c: getCommission(commissionId), slug }))
    .filter(({ c }) => c.artistId === p.id)
    .map(({ c, slug }) => {
      const review = listReviews(c.id).at(-1)!;
      const acc = db().acceptances.find((a) => a.commissionId === c.id)!;
      const cv = cover(c.id);
      return {
        slug,
        title: c.title,
        employerName: db().employers.find((e) => e.id === c.employerId)!.name,
        completedAt: acc.acceptedAt,
        artFormIds: c.artFormIds,
        avgScore: Math.round(avg(review) * 10) / 10,
        coverUrl: cv?.url,
        coverKind: cv?.kind,
      };
    });
  return { person: p, samples };
}

export function getImpact(): ImpactStats {
  const { commissions, acceptances, submissions, reviews } = db();
  const done = commissions.filter((c) => c.status === "verified" || c.status === "accepted");
  const title = (id: string) => getCommission(id).title;
  const events: ImpactStats["events"] = [
    ...commissions.map((c) => ({ at: c.createdAt, kind: "commission_posted" as const, label: `Commission posted: ${c.title}` })),
    ...submissions.map((s) => ({ at: s.submittedAt, kind: "submitted" as const, label: `Work shared for ${title(s.commissionId)}` })),
    ...reviews.map((r) => ({ at: r.reviewedAt, kind: "reviewed" as const, label: `Guru reviewed ${title(r.commissionId)}` })),
    ...acceptances.map((a) => ({ at: a.acceptedAt, kind: "accepted" as const, label: `Employer accepted ${title(a.commissionId)}` })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return {
    employersServed: new Set(commissions.map((c) => c.employerId)).size,
    commissionsPosted: commissions.length,
    commissionsCompleted: done.length,
    artistsVerified: new Set(commissions.filter((c) => c.status === "verified").map((c) => c.artistId)).size,
    artistEarningsInr: done.reduce((n, c) => n + c.feeInr, 0),
    events: events.slice(0, 20),
  };
}

export function getTalent(artFormId?: string): TalentCard[] {
  return db()
    .people.filter((p) => p.role === "artist" && p.handle)
    .filter((p) => !artFormId || p.artFormIds.includes(artFormId))
    .map((p) => ({ p, portfolio: getPortfolio(p.handle!) }))
    .filter(({ portfolio }) => portfolio.samples.length > 0)
    .map(({ p, portfolio }) => ({
      person: p,
      verifiedCount: portfolio.samples.length,
      avgScore: portfolio.samples.reduce((n, s) => n + s.avgScore, 0) / portfolio.samples.length,
      topSampleSlug: portfolio.samples[0].slug,
      coverUrl: portfolio.samples[0].coverKind === "photo" ? portfolio.samples[0].coverUrl : undefined,
    }));
}

export function listPeople(role?: string) {
  return db().people.filter((p) => !role || p.role === role);
}
