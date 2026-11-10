/**
 * The ONLY way the UI talks to the backend. Every response is parsed with the
 * contract schemas, so if the real backend drifts from the contract the UI
 * fails loudly instead of rendering garbage.
 *
 * NEXT_PUBLIC_API_MODE=mock → same-origin /api (Next route handlers + mockStore)
 * NEXT_PUBLIC_API_MODE=live → NEXT_PUBLIC_API_BASE_URL (the real backend)
 */
import { z, type ZodType } from "zod";
import {
  AcceptInput,
  Acceptance,
  Commission,
  CreateCommissionInput,
  CreateReviewInput,
  CreateSubmissionInput,
  DraftBriefEvent,
  ImpactStats,
  Match,
  Media,
  Person,
  Portfolio,
  Review,
  Submission,
  TalentCard,
  UpdateCommissionInput,
  WorkSample,
} from "@/contract/schemas";

export const MODE = process.env.NEXT_PUBLIC_API_MODE ?? "mock";
export const LIVE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Browser base: same origin in mock mode, the real backend in live mode. */
const clientBase = () => (MODE === "live" ? LIVE_BASE : "");
const credentials: RequestCredentials = MODE === "live" ? "include" : "same-origin";

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
    credentials,
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

const CommissionDetail = z.object({ commission: Commission, submissions: z.array(Submission), reviews: z.array(Review) });
export type CommissionDetail = z.infer<typeof CommissionDetail>;
const AcceptResult = z.object({ acceptance: Acceptance, slug: z.string().nullable() });

const qs = (q: Record<string, string | undefined>) => {
  const p = new URLSearchParams(Object.entries(q).filter((e): e is [string, string] => !!e[1]));
  return p.size ? `?${p}` : "";
};

/**
 * Builds a typed client against `base`. Client components use `api` below;
 * server components use `getServerApi()` from src/lib/server-api.ts, which
 * derives the absolute base URL from the incoming request.
 */
export function createApi(base: string) {
  const request = <T,>(path: string, schema: ZodType<T>, init?: Init) => send(base, path, schema, init);
  return {
    commissions: {
      list: (q: { employerId?: string; artistId?: string; guruId?: string; status?: string } = {}) =>
        request(`/commissions${qs(q)}`, z.array(Commission)),
      get: (id: string) => request(`/commissions/${id}`, CommissionDetail),
      create: (input: CreateCommissionInput) =>
        request("/commissions", Commission, { method: "POST", json: CreateCommissionInput.parse(input) }),
      update: (id: string, patch: UpdateCommissionInput) =>
        request(`/commissions/${id}`, Commission, { method: "PATCH", json: UpdateCommissionInput.parse(patch) }),
      accept: (id: string, input: AcceptInput) =>
        request(`/commissions/${id}/accept`, AcceptResult, { method: "POST", json: AcceptInput.parse(input) }),
    },
    matches: {
      list: (commissionId?: string) => request(`/matches${qs({ commissionId })}`, z.array(Match)),
      confirm: (id: string) => request(`/matches/${id}/confirm`, Match, { method: "POST" }),
    },
    media: {
      /** Upload one photo/audio/video from a camera or mic capture. */
      upload: (file: Blob, opts: { stage: "process" | "final"; caption?: string; filename?: string }) => {
        const form = new FormData();
        form.set("file", file, opts.filename ?? "upload");
        form.set("stage", opts.stage);
        if (opts.caption) form.set("caption", opts.caption);
        return request("/media", Media, { method: "POST", body: form });
      },
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
      list: (role?: string) => request(`/people${qs({ role })}`, z.array(Person)),
      portfolio: (handle: string) => request(`/people/${handle}`, Portfolio),
    },
    impact: { get: () => request("/impact", ImpactStats) },
    talent: { list: (artForm?: string) => request(`/talent${qs({ artForm })}`, z.array(TalentCard)) },
  };
}

export type Api = ReturnType<typeof createApi>;

/** For client components. */
export const api = createApi(clientBase());

/**
 * Streams the AI brief draft. Calls onEvent for every parsed DraftBriefEvent.
 * Pass an AbortSignal to cancel (e.g. when the employer edits the request).
 */
export async function streamDraftBrief(
  rawRequest: string,
  onEvent: (e: DraftBriefEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${clientBase()}/api/commissions/draft-brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ rawRequest }),
    credentials,
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
        const parsed = DraftBriefEvent.safeParse(JSON.parse(line.slice(5).trim()));
        if (parsed.success) onEvent(parsed.data);
        else console.error("[api] bad draft-brief event", parsed.error.issues);
      }
    }
  }
}
