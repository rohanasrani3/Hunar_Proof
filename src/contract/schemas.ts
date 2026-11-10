/**
 * Hunar Proof API contract — the single source of truth shared by frontend,
 * backend and AI services. Every API response is parsed with these schemas
 * on the client (see src/lib/api.ts), so any drift fails loudly.
 *
 * Domain: an employer (café, hotel, event organiser, brand…) commissions a
 * piece of regional art, music, dance or craft. An artist makes it, a guru
 * (master practitioner of the same form) reviews it, the employer accepts it,
 * and the result is a public, verified work sample other employers can trust.
 *
 * Changing a schema? Tell the whole team — it is a breaking change.
 */
import { z } from "zod";

export const Id = z.string().min(1);
export const IsoDate = z.string().datetime({ offset: true });
/** Absolute URL or a same-site path such as /seed/x.svg or /api/media/abc. */
export const MediaUrl = z.string().min(1);
export const ArtFormId = z.string().min(1); // see src/contract/artForms.ts

/* ---------- People & employers ---------- */

export const Role = z.enum(["artist", "guru", "employer", "admin"]);
export type Role = z.infer<typeof Role>;

export const Employer = z.object({
  id: Id,
  name: z.string(),
  kind: z.string(), // e.g. "Café", "Hotel", "Event organiser", "Brand", "NGO"
  city: z.string(),
  contactName: z.string(),
});
export type Employer = z.infer<typeof Employer>;

export const Person = z.object({
  id: Id,
  role: Role,
  name: z.string(),
  /** Public portfolio slug: /u/:handle */
  handle: z.string().optional(),
  avatarUrl: MediaUrl.optional(),
  artFormIds: z.array(ArtFormId),
  region: z.string().optional(), // state
  city: z.string().optional(),
  languages: z.array(z.string()),
  yearsPracticing: z.number().int().nonnegative().optional(),
  employerId: Id.optional(), // set for role === "employer"
});
export type Person = z.infer<typeof Person>;

/* ---------- Media: photos, recordings and videos are the evidence ---------- */

export const MediaKind = z.enum(["photo", "audio", "video"]);
export const MediaStage = z.enum(["process", "final"]);
export const Media = z.object({
  id: Id,
  kind: MediaKind,
  stage: MediaStage, // process = work-in-progress proof; final = the delivered piece
  url: MediaUrl,
  caption: z.string().optional(),
  durationSec: z.number().positive().optional(), // audio/video
  createdAt: IsoDate,
});
export type Media = z.infer<typeof Media>;

/* ---------- Commissions ---------- */

export const CommissionStatus = z.enum([
  "draft", // employer is still writing
  "brief_review", // AI draft exists, employer reviewing criteria
  "open", // published, waiting for a match
  "matched", // artist + guru confirmed
  "in_progress",
  "in_review", // submission waiting on guru
  "accepted", // employer accepted, guru review not all-pass
  "verified", // guru passed + employer accepted → public work sample exists
]);
export type CommissionStatus = z.infer<typeof CommissionStatus>;

export const Criterion = z.object({
  id: Id,
  text: z.string().min(1),
  aiGenerated: z.boolean(),
  approved: z.boolean(), // employer ticked it during brief review
});
export type Criterion = z.infer<typeof Criterion>;

export const MilestoneStatus = z.enum(["todo", "doing", "submitted", "done"]);
export const Milestone = z.object({
  id: Id,
  title: z.string(),
  estDays: z.number().positive(),
  criterionIds: z.array(Id),
  status: MilestoneStatus,
});
export type Milestone = z.infer<typeof Milestone>;

export const Commission = z.object({
  id: Id,
  employerId: Id,
  title: z.string(),
  rawRequest: z.string(), // the employer's own words, verbatim
  status: CommissionStatus,
  artFormIds: z.array(ArtFormId),
  estDays: z.number().positive(),
  feeInr: z.number().int().nonnegative(), // agreed fee; payment itself happens outside the app
  onSite: z.boolean(), // artist must travel (murals, performances)
  city: z.string().optional(),
  criteria: z.array(Criterion),
  milestones: z.array(Milestone),
  artistId: Id.optional(),
  guruId: Id.optional(),
  createdAt: IsoDate,
});
export type Commission = z.infer<typeof Commission>;

export const CreateCommissionInput = z.object({
  employerId: Id,
  rawRequest: z.string().min(10),
  title: z.string().optional(),
});
export type CreateCommissionInput = z.infer<typeof CreateCommissionInput>;

export const UpdateCommissionInput = Commission.pick({
  title: true,
  status: true,
  artFormIds: true,
  estDays: true,
  feeInr: true,
  onSite: true,
  city: true,
  criteria: true,
  milestones: true,
}).partial();
export type UpdateCommissionInput = z.infer<typeof UpdateCommissionInput>;

/* ---------- AI brief drafting (streamed) ---------- */

export const DraftBriefInput = z.object({ rawRequest: z.string().min(10) });

/**
 * POST /api/commissions/draft-brief responds with text/event-stream.
 * Each `data:` line is one JSON-encoded DraftBriefEvent.
 */
export const DraftBriefEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("title"), title: z.string() }),
  z.object({ type: z.literal("criterion_start"), id: Id }),
  z.object({ type: z.literal("criterion_delta"), id: Id, text: z.string() }),
  z.object({ type: z.literal("criterion_end"), id: Id }),
  z.object({ type: z.literal("milestone"), milestone: Milestone }),
  z.object({
    type: z.literal("meta"),
    artFormIds: z.array(ArtFormId),
    estDays: z.number().positive(),
    suggestedFeeInr: z.number().int().nonnegative(), // a fair-pay suggestion the employer can change
    onSite: z.boolean(),
  }),
  z.object({ type: z.literal("done") }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export type DraftBriefEvent = z.infer<typeof DraftBriefEvent>;

/* ---------- Matching ---------- */

export const Match = z.object({
  id: Id,
  commissionId: Id,
  artistId: Id,
  guruId: Id,
  score: z.number().min(0).max(1),
  reasons: z.array(z.string()),
  status: z.enum(["suggested", "confirmed", "rejected"]),
});
export type Match = z.infer<typeof Match>;

/* ---------- Submissions & review ---------- */

export const Submission = z.object({
  id: Id,
  commissionId: Id,
  milestoneId: Id,
  media: z.array(Media).min(1),
  note: z.string().optional(),
  voiceNoteUrl: MediaUrl.optional(), // artists can explain by voice instead of typing
  submittedAt: IsoDate,
});
export type Submission = z.infer<typeof Submission>;

/** Upload files first (POST /api/media), then submit their ids. */
export const CreateSubmissionInput = z.object({
  commissionId: Id,
  milestoneId: Id,
  mediaIds: z.array(Id).min(1),
  note: z.string().optional(),
  voiceNoteId: Id.optional(),
});
export type CreateSubmissionInput = z.infer<typeof CreateSubmissionInput>;

export const Score = z.number().int().min(1).max(5);
export const CriterionResult = z.object({
  criterionId: Id,
  verdict: z.enum(["pass", "needs_work"]),
  comment: z.string(),
});
export const Review = z.object({
  id: Id,
  submissionId: Id,
  commissionId: Id,
  guruId: Id,
  results: z.array(CriterionResult),
  rubric: z.object({
    craft: Score, // skill and finish
    tradition: Score, // true to the art form
    timeliness: Score,
  }),
  summary: z.string(),
  voiceNoteUrl: MediaUrl.optional(),
  reviewedAt: IsoDate,
});
export type Review = z.infer<typeof Review>;

export const CreateReviewInput = Review.omit({ id: true, reviewedAt: true, commissionId: true });
export type CreateReviewInput = z.infer<typeof CreateReviewInput>;

export const Acceptance = z.object({
  commissionId: Id,
  signatoryName: z.string(),
  acceptedAt: IsoDate,
  workViewed: z.boolean(), // UI requires the employer to open the final media first
  quote: z.string().optional(),
});
export type Acceptance = z.infer<typeof Acceptance>;

export const AcceptInput = Acceptance.omit({ commissionId: true, acceptedAt: true });
export type AcceptInput = z.infer<typeof AcceptInput>;

/* ---------- Read models ---------- */

/** GET /api/work/:slug — everything the public proof page needs. */
export const WorkSample = z.object({
  slug: z.string(),
  commission: Commission,
  employer: Employer,
  artist: Person,
  guru: Person,
  submissions: z.array(Submission),
  review: Review,
  acceptance: Acceptance,
});
export type WorkSample = z.infer<typeof WorkSample>;

export const PortfolioItem = z.object({
  slug: z.string(),
  title: z.string(),
  employerName: z.string(),
  completedAt: IsoDate,
  artFormIds: z.array(ArtFormId),
  avgScore: z.number(),
  coverUrl: MediaUrl.optional(),
  coverKind: MediaKind.optional(),
});
export type PortfolioItem = z.infer<typeof PortfolioItem>;

/** GET /api/people/:handle — public portfolio. */
export const Portfolio = z.object({ person: Person, samples: z.array(PortfolioItem) });
export type Portfolio = z.infer<typeof Portfolio>;

export const ImpactEvent = z.object({
  at: IsoDate,
  kind: z.enum(["commission_posted", "matched", "submitted", "reviewed", "accepted", "verified"]),
  label: z.string(),
});
export const ImpactStats = z.object({
  employersServed: z.number().int(),
  commissionsPosted: z.number().int(),
  commissionsCompleted: z.number().int(),
  artistsVerified: z.number().int(),
  artistEarningsInr: z.number().int(), // sum of fees for accepted/verified commissions
  events: z.array(ImpactEvent),
});
export type ImpactStats = z.infer<typeof ImpactStats>;

/** GET /api/talent?artForm= — employer browse. */
export const TalentCard = z.object({
  person: Person,
  verifiedCount: z.number().int(),
  avgScore: z.number(),
  topSampleSlug: z.string(),
  coverUrl: MediaUrl.optional(),
});
export type TalentCard = z.infer<typeof TalentCard>;

/** Standard error body for every non-2xx response. */
export const ApiError = z.object({ error: z.string(), details: z.unknown().optional() });
