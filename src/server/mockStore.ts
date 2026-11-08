/**
 * In-memory mock backend. Implements the contract in src/contract/schemas.ts
 * so the frontend can be built before the real backend exists.
 *
 * NOT persistent: state resets on every server restart / serverless cold
 * start. The real pilot MUST run on Teammate A's backend.
 */
import type {
  AcceptInput,
  CreateReviewInput,
  CreateSubmissionInput,
  CreateTaskInput,
  ImpactStats,
  Match,
  Portfolio,
  Review,
  Submission,
  TalentCard,
  Task,
  UpdateTaskInput,
  WorkSample,
} from "@/contract/schemas";
import { createSeed, type DB } from "./seed";

const g = globalThis as unknown as { __firstshipDb?: DB };
const db = (): DB => (g.__firstshipDb ??= createSeed());

export function resetDb() {
  g.__firstshipDb = createSeed();
}

export class NotFound extends Error {}
export class BadState extends Error {}

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

/* ---------- Tasks ---------- */

export function listTasks(filter: { orgId?: string; learnerId?: string; mentorId?: string; status?: string } = {}): Task[] {
  return db().tasks.filter(
    (t) =>
      (!filter.orgId || t.orgId === filter.orgId) &&
      (!filter.learnerId || t.learnerId === filter.learnerId) &&
      (!filter.mentorId || t.mentorId === filter.mentorId) &&
      (!filter.status || t.status === filter.status),
  );
}

export function getTask(id: string): Task {
  const t = db().tasks.find((x) => x.id === id);
  if (!t) throw new NotFound(`Task ${id} not found`);
  return t;
}

export function createTask(input: CreateTaskInput): Task {
  if (!db().orgs.some((o) => o.id === input.orgId)) throw new NotFound(`Org ${input.orgId} not found`);
  const task: Task = {
    id: uid("t"),
    orgId: input.orgId,
    title: input.title ?? input.rawRequest.slice(0, 60),
    rawRequest: input.rawRequest,
    status: "draft",
    skills: [],
    estHours: 1,
    criteria: [],
    milestones: [],
    createdAt: now(),
  };
  db().tasks.push(task);
  return task;
}

export function updateTask(id: string, patch: UpdateTaskInput): Task {
  const t = getTask(id);
  Object.assign(t, patch);
  return t;
}

/* ---------- Matching ---------- */

export function listMatches(taskId?: string): Match[] {
  return db().matches.filter((m) => !taskId || m.taskId === taskId).sort((a, b) => b.score - a.score);
}

export function confirmMatch(matchId: string): Match {
  const m = db().matches.find((x) => x.id === matchId);
  if (!m) throw new NotFound(`Match ${matchId} not found`);
  const task = getTask(m.taskId);
  if (task.status !== "open") throw new BadState(`Task is ${task.status}, expected open`);
  for (const other of db().matches) if (other.taskId === m.taskId && other.id !== m.id) other.status = "rejected";
  m.status = "confirmed";
  Object.assign(task, { status: "matched", learnerId: m.learnerId, mentorId: m.mentorId });
  return m;
}

/* ---------- Submissions & reviews ---------- */

export function listSubmissions(taskId: string): Submission[] {
  return db().submissions.filter((s) => s.taskId === taskId);
}

export function getSubmission(id: string): Submission {
  const s = db().submissions.find((x) => x.id === id);
  if (!s) throw new NotFound(`Submission ${id} not found`);
  return s;
}

export function createSubmission(input: CreateSubmissionInput): Submission {
  const task = getTask(input.taskId);
  const sub: Submission = {
    id: uid("s"),
    ...input,
    // Teammate B's GitHub integration fills these from the real PR + preview deploy.
    previewUrl: undefined,
    ciStatus: "pending",
    commits: 0,
    additions: 0,
    deletions: 0,
    merged: false,
    submittedAt: now(),
  };
  db().submissions.push(sub);
  const ms = task.milestones.find((m) => m.id === input.milestoneId);
  if (ms) ms.status = "submitted";
  task.status = "in_review";
  return sub;
}

export function listReviews(taskId: string): Review[] {
  return db().reviews.filter((r) => r.taskId === taskId);
}

export function createReview(input: CreateReviewInput): Review {
  const sub = getSubmission(input.submissionId);
  const task = getTask(sub.taskId);
  const review: Review = { id: uid("r"), taskId: task.id, reviewedAt: now(), ...input };
  db().reviews.push(review);
  const allPass = review.results.every((r) => r.verdict === "pass");
  const ms = task.milestones.find((m) => m.id === sub.milestoneId);
  if (ms) ms.status = allPass ? "done" : "doing";
  task.status = allPass ? "in_review" : "in_progress"; // stays in_review until org accepts
  return review;
}

export function acceptTask(taskId: string, input: AcceptInput) {
  const task = getTask(taskId);
  if (!input.previewOpened) throw new BadState("Org must open the preview before accepting");
  const latest = listReviews(taskId).at(-1);
  if (!latest) throw new BadState("Task has no mentor review yet");
  const acceptance = { taskId, acceptedAt: now(), ...input };
  db().acceptances = db().acceptances.filter((a) => a.taskId !== taskId).concat(acceptance);
  const verified = latest.results.every((r) => r.verdict === "pass");
  task.status = verified ? "verified" : "accepted";
  if (verified && !db().slugs[taskId]) {
    db().slugs[taskId] = `fs-${String(Object.keys(db().slugs).length + 1).padStart(4, "0")}`;
  }
  return { acceptance, slug: db().slugs[taskId] ?? null };
}

/* ---------- Read models ---------- */

export function getWorkSample(slug: string): WorkSample {
  const taskId = Object.entries(db().slugs).find(([, s]) => s === slug)?.[0];
  if (!taskId) throw new NotFound(`Work sample ${slug} not found`);
  const task = getTask(taskId);
  const person = (id?: string) => {
    const p = db().people.find((x) => x.id === id);
    if (!p) throw new NotFound(`Person ${id} not found`);
    return p;
  };
  const org = db().orgs.find((o) => o.id === task.orgId)!;
  const submissions = listSubmissions(taskId);
  const review = listReviews(taskId).at(-1)!;
  const acceptance = db().acceptances.find((a) => a.taskId === taskId)!;
  return {
    slug,
    task,
    org,
    learner: person(task.learnerId),
    mentor: person(task.mentorId),
    submissions,
    review,
    acceptance,
    liveUrl: submissions.at(-1)?.previewUrl,
  };
}

const avg = (r: Review) => (r.rubric.codeQuality + r.rubric.communication + r.rubric.timeliness) / 3;

export function getPortfolio(login: string): Portfolio {
  const person = db().people.find((p) => p.githubLogin === login);
  if (!person) throw new NotFound(`Person ${login} not found`);
  const samples = Object.entries(db().slugs)
    .map(([taskId, slug]) => ({ task: getTask(taskId), slug }))
    .filter(({ task }) => task.learnerId === person.id)
    .map(({ task, slug }) => {
      const review = listReviews(task.id).at(-1)!;
      const acc = db().acceptances.find((a) => a.taskId === task.id)!;
      return {
        slug,
        title: task.title,
        orgName: db().orgs.find((o) => o.id === task.orgId)!.name,
        shippedAt: acc.acceptedAt,
        skills: task.skills,
        avgScore: Math.round(avg(review) * 10) / 10,
      };
    });
  return { person, samples };
}

export function getImpact(): ImpactStats {
  const { tasks, orgs, acceptances, submissions, reviews } = db();
  const verified = tasks.filter((t) => t.status === "verified");
  const events: ImpactStats["events"] = [
    ...tasks.map((t) => ({ at: t.createdAt, kind: "task_posted" as const, label: `Task posted: ${t.title}` })),
    ...submissions.map((s) => ({ at: s.submittedAt, kind: "submitted" as const, label: `Work submitted for ${getTask(s.taskId).title}` })),
    ...reviews.map((r) => ({ at: r.reviewedAt, kind: "reviewed" as const, label: `Mentor reviewed ${getTask(r.taskId).title}` })),
    ...acceptances.map((a) => ({ at: a.acceptedAt, kind: "accepted" as const, label: `NGO accepted ${getTask(a.taskId).title}` })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return {
    orgsServed: new Set(tasks.map((t) => t.orgId)).size || orgs.length,
    tasksPosted: tasks.length,
    tasksShipped: verified.length,
    learnersVerified: new Set(verified.map((t) => t.learnerId)).size,
    orgHoursSaved: verified.reduce((n, t) => n + t.estHours, 0),
    events: events.slice(0, 20),
  };
}

export function getTalent(skill?: string): TalentCard[] {
  return db()
    .people.filter((p) => p.role === "learner")
    .map((person) => ({ person, portfolio: getPortfolio(person.githubLogin!) }))
    .filter(({ portfolio }) => portfolio.samples.length > 0)
    .filter(({ person }) => !skill || person.skills.some((s) => s.toLowerCase() === skill.toLowerCase()))
    .map(({ person, portfolio }) => ({
      person,
      verifiedCount: portfolio.samples.length,
      avgScore: portfolio.samples.reduce((n, s) => n + s.avgScore, 0) / portfolio.samples.length,
      topSampleSlug: portfolio.samples[0].slug,
    }));
}

export function listPeople(role?: string) {
  return db().people.filter((p) => !role || p.role === role);
}
