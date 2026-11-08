/**
 * The ONLY way the UI talks to the backend. Every response is parsed with the
 * contract schemas, so if the real backend drifts from the contract the UI
 * fails loudly instead of rendering garbage.
 *
 * NEXT_PUBLIC_API_MODE=mock → same-origin /api (Next route handlers + mockStore)
 * NEXT_PUBLIC_API_MODE=live → NEXT_PUBLIC_API_BASE_URL (Teammate A's backend)
 */
import { z, type ZodType } from "zod";
import {
  AcceptInput,
  Acceptance,
  CreateReviewInput,
  CreateSubmissionInput,
  CreateTaskInput,
  DraftSpecEvent,
  ImpactStats,
  Match,
  Person,
  Portfolio,
  Review,
  Submission,
  TalentCard,
  Task,
  UpdateTaskInput,
  WorkSample,
} from "@/contract/schemas";

export const MODE = process.env.NEXT_PUBLIC_API_MODE ?? "mock";
export const LIVE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Browser base: same origin in mock mode, the real backend in live mode. */
const clientBase = () => (MODE === "live" ? LIVE_BASE : "");

export class ApiRequestError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

type Init = RequestInit & { json?: unknown };

async function send<T>(base: string, path: string, schema: ZodType<T>, init?: Init): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(`${base}/api${path}`, {
    cache: "no-store",
    credentials: MODE === "live" ? "include" : "same-origin",
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiRequestError(res.status, data?.error ?? res.statusText, data?.details);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error(`[api] contract mismatch on ${path}`, parsed.error.issues);
    throw new ApiRequestError(500, `Contract mismatch on ${path}`, parsed.error.issues);
  }
  return parsed.data;
}

const TaskDetail = z.object({ task: Task, submissions: z.array(Submission), reviews: z.array(Review) });
export type TaskDetail = z.infer<typeof TaskDetail>;
const AcceptResult = z.object({ acceptance: Acceptance, slug: z.string().nullable() });

/**
 * Builds a typed client against `base`. Client components use `api` below;
 * server components use `getServerApi()` from src/lib/server-api.ts, which
 * derives the absolute base URL from the incoming request.
 */
export function createApi(base: string) {
  const request = <T,>(path: string, schema: ZodType<T>, init?: Init) => send(base, path, schema, init);
  return {
  tasks: {
    list: (q: { orgId?: string; learnerId?: string; mentorId?: string; status?: string } = {}) =>
      request(`/tasks?${new URLSearchParams(q as Record<string, string>)}`, z.array(Task)),
    get: (id: string) => request(`/tasks/${id}`, TaskDetail),
    create: (input: CreateTaskInput) => request("/tasks", Task, { method: "POST", json: CreateTaskInput.parse(input) }),
    update: (id: string, patch: UpdateTaskInput) =>
      request(`/tasks/${id}`, Task, { method: "PATCH", json: UpdateTaskInput.parse(patch) }),
    accept: (id: string, input: AcceptInput) =>
      request(`/tasks/${id}/accept`, AcceptResult, { method: "POST", json: AcceptInput.parse(input) }),
  },
  matches: {
    list: (taskId?: string) => request(`/matches${taskId ? `?taskId=${taskId}` : ""}`, z.array(Match)),
    confirm: (id: string) => request(`/matches/${id}/confirm`, Match, { method: "POST" }),
  },
  submissions: {
    create: (input: CreateSubmissionInput) =>
      request("/submissions", Submission, { method: "POST", json: CreateSubmissionInput.parse(input) }),
  },
  reviews: {
    create: (input: CreateReviewInput) =>
      request("/reviews", Review, { method: "POST", json: CreateReviewInput.parse(input) }),
  },
  work: { get: (slug: string) => request(`/work/${slug}`, WorkSample) },
  people: {
    list: (role?: string) => request(`/people${role ? `?role=${role}` : ""}`, z.array(Person)),
    portfolio: (login: string) => request(`/people/${login}`, Portfolio),
  },
  impact: { get: () => request("/impact", ImpactStats) },
  talent: { list: (skill?: string) => request(`/talent${skill ? `?skill=${encodeURIComponent(skill)}` : ""}`, z.array(TalentCard)) },
  };
}

export type Api = ReturnType<typeof createApi>;

/** For client components. */
export const api = createApi(clientBase());

/**
 * Streams the AI spec draft. Calls onEvent for every parsed DraftSpecEvent.
 * Pass an AbortSignal to cancel (e.g. when the org edits the request).
 */
export async function streamDraftSpec(
  rawRequest: string,
  onEvent: (e: DraftSpecEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${clientBase()}/api/tasks/draft-spec`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ rawRequest }),
    credentials: MODE === "live" ? "include" : "same-origin",
    signal,
  });
  if (!res.ok || !res.body) throw new ApiRequestError(res.status, "Could not start the AI draft");
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const parsed = DraftSpecEvent.safeParse(JSON.parse(line.slice(5).trim()));
        if (parsed.success) onEvent(parsed.data);
        else console.error("[api] bad draft-spec event", parsed.error.issues);
      }
    }
  }
}
