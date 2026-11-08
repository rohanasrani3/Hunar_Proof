/**
 * FirstShip API contract — the single source of truth shared by frontend,
 * backend and AI services. Every API response is parsed with these schemas
 * on the client (see src/lib/api.ts), so any drift fails loudly.
 *
 * Changing a schema? Tell the whole team — it is a breaking change.
 */
import { z } from "zod";

export const Id = z.string().min(1);
export const IsoDate = z.string().datetime({ offset: true });

/* ---------- People & orgs ---------- */

export const Role = z.enum(["learner", "mentor", "org", "admin", "employer"]);
export type Role = z.infer<typeof Role>;

export const Org = z.object({
  id: Id,
  name: z.string(),
  kind: z.string(), // e.g. "NGO", "School", "Community group"
  contactName: z.string(),
  city: z.string().optional(),
  logoUrl: z.string().url().optional(),
});
export type Org = z.infer<typeof Org>;

export const Person = z.object({
  id: Id,
  role: Role,
  name: z.string(),
  githubLogin: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  skills: z.array(z.string()),
  hoursPerWeek: z.number().int().positive().optional(),
  college: z.string().optional(),
  orgId: Id.optional(), // set for role === "org"
});
export type Person = z.infer<typeof Person>;

/* ---------- Tasks ---------- */

export const TaskStatus = z.enum([
  "draft", // org is still writing
  "spec_review", // AI draft exists, org reviewing criteria
  "open", // published, waiting for a match
  "matched", // learner + mentor confirmed
  "in_progress",
  "in_review", // submission waiting on mentor
  "accepted", // org accepted the work
  "verified", // mentor passed + org accepted → public work sample exists
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const Criterion = z.object({
  id: Id,
  text: z.string().min(1),
  testable: z.boolean(),
  aiGenerated: z.boolean(),
  approved: z.boolean(), // org ticked it during spec review
});
export type Criterion = z.infer<typeof Criterion>;

export const MilestoneStatus = z.enum(["todo", "doing", "submitted", "done"]);
export const Milestone = z.object({
  id: Id,
  title: z.string(),
  estDays: z.number().positive(),
  dueDate: IsoDate.optional(),
  criterionIds: z.array(Id),
  status: MilestoneStatus,
});
export type Milestone = z.infer<typeof Milestone>;

export const Task = z.object({
  id: Id,
  orgId: Id,
  title: z.string(),
  rawRequest: z.string(), // the org's own words, verbatim
  status: TaskStatus,
  skills: z.array(z.string()),
  estHours: z.number().positive(),
  repoUrl: z.string().url().optional(),
  criteria: z.array(Criterion),
  milestones: z.array(Milestone),
  learnerId: Id.optional(),
  mentorId: Id.optional(),
  createdAt: IsoDate,
});
export type Task = z.infer<typeof Task>;

export const CreateTaskInput = z.object({
  orgId: Id,
  rawRequest: z.string().min(10),
  title: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;

export const UpdateTaskInput = Task.pick({
  title: true,
  status: true,
  skills: true,
  estHours: true,
  repoUrl: true,
  criteria: true,
  milestones: true,
}).partial();
export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;

/* ---------- AI spec drafting (streamed) ---------- */

export const DraftSpecInput = z.object({ rawRequest: z.string().min(10) });

/**
 * POST /api/tasks/draft-spec responds with text/event-stream.
 * Each `data:` line is one JSON-encoded DraftSpecEvent.
 */
export const DraftSpecEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("title"), title: z.string() }),
  z.object({ type: z.literal("criterion_start"), id: Id }),
  z.object({ type: z.literal("criterion_delta"), id: Id, text: z.string() }),
  z.object({ type: z.literal("criterion_end"), id: Id, testable: z.boolean() }),
  z.object({ type: z.literal("milestone"), milestone: Milestone }),
  z.object({ type: z.literal("meta"), skills: z.array(z.string()), estHours: z.number() }),
  z.object({ type: z.literal("done") }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export type DraftSpecEvent = z.infer<typeof DraftSpecEvent>;

/* ---------- Matching ---------- */

export const Match = z.object({
  id: Id,
  taskId: Id,
  learnerId: Id,
  mentorId: Id,
  score: z.number().min(0).max(1),
  reasons: z.array(z.string()),
  status: z.enum(["suggested", "confirmed", "rejected"]),
});
export type Match = z.infer<typeof Match>;

/* ---------- Submissions & review ---------- */

export const CiStatus = z.enum(["pending", "pass", "fail"]);
export const Submission = z.object({
  id: Id,
  taskId: Id,
  milestoneId: Id,
  prUrl: z.string().url(),
  previewUrl: z.string().url().optional(),
  ciStatus: CiStatus,
  testsPassed: z.number().int().nonnegative().optional(),
  testsTotal: z.number().int().nonnegative().optional(),
  commits: z.number().int().nonnegative(),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  merged: z.boolean(),
  submittedAt: IsoDate,
});
export type Submission = z.infer<typeof Submission>;

export const CreateSubmissionInput = Submission.pick({
  taskId: true,
  milestoneId: true,
  prUrl: true,
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
  taskId: Id,
  mentorId: Id,
  results: z.array(CriterionResult),
  rubric: z.object({ codeQuality: Score, communication: Score, timeliness: Score }),
  summary: z.string(),
  reviewedAt: IsoDate,
});
export type Review = z.infer<typeof Review>;

export const CreateReviewInput = Review.omit({ id: true, reviewedAt: true, taskId: true });
export type CreateReviewInput = z.infer<typeof CreateReviewInput>;

export const Acceptance = z.object({
  taskId: Id,
  signatoryName: z.string(),
  acceptedAt: IsoDate,
  previewOpened: z.boolean(), // UI requires the org to open the preview first
  quote: z.string().optional(),
});
export type Acceptance = z.infer<typeof Acceptance>;

export const AcceptInput = Acceptance.omit({ taskId: true, acceptedAt: true });
export type AcceptInput = z.infer<typeof AcceptInput>;

/* ---------- Read models ---------- */

/** GET /api/work/:slug — everything the public proof page needs. */
export const WorkSample = z.object({
  slug: z.string(),
  task: Task,
  org: Org,
  learner: Person,
  mentor: Person,
  submissions: z.array(Submission),
  review: Review,
  acceptance: Acceptance,
  liveUrl: z.string().url().optional(),
});
export type WorkSample = z.infer<typeof WorkSample>;

/** GET /api/people/:login — public portfolio. */
export const Portfolio = z.object({
  person: Person,
  samples: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      orgName: z.string(),
      shippedAt: IsoDate,
      skills: z.array(z.string()),
      avgScore: z.number(),
    }),
  ),
});
export type Portfolio = z.infer<typeof Portfolio>;

export const ImpactEvent = z.object({
  at: IsoDate,
  kind: z.enum(["task_posted", "matched", "submitted", "reviewed", "accepted", "verified"]),
  label: z.string(),
});
export const ImpactStats = z.object({
  orgsServed: z.number().int(),
  tasksPosted: z.number().int(),
  tasksShipped: z.number().int(),
  learnersVerified: z.number().int(),
  orgHoursSaved: z.number(),
  events: z.array(ImpactEvent),
});
export type ImpactStats = z.infer<typeof ImpactStats>;

/** GET /api/talent?skill= — employer browse. */
export const TalentCard = z.object({
  person: Person,
  verifiedCount: z.number().int(),
  avgScore: z.number(),
  topSampleSlug: z.string(),
});
export type TalentCard = z.infer<typeof TalentCard>;

/** Standard error body for every non-2xx response. */
export const ApiError = z.object({ error: z.string(), details: z.unknown().optional() });
