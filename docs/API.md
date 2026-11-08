# FirstShip API contract

The frontend talks to the backend **only** through these endpoints. Request
and response shapes are defined in Zod in
[`src/contract/schemas.ts`](../src/contract/schemas.ts). That file is the
source of truth. If this page and that file disagree, the file is correct.

A working reference implementation is in this repo:
`src/app/api/**/route.ts` together with `src/server/mockStore.ts`. To see
the expected responses, run `npm run dev` and send requests with curl.

## Rules for the real backend
- Use the same paths, under `/api`. Send JSON bodies with `Content-Type: application/json`.
- On errors, return the body `{ "error": string, "details"?: any }`, with status 400 (bad input), 401/403 (auth), 404, or 409 (wrong state).
- Format every date as ISO-8601 with an offset (for example, `2026-11-12T16:00:00+05:30`).
- Auth uses cookies (`credentials: include`). Allow CORS from the frontend origin, with credentials.
- The client validates every response against the schema. **Any extra or missing field breaks the UI immediately**, so the mismatch shows up early instead of failing silently.

## Endpoints

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/api/tasks?orgId&learnerId&mentorId&status` | – | `Task[]` | All filters are optional |
| POST | `/api/tasks` | `CreateTaskInput` | `Task` (201) | Status starts at `draft` |
| GET | `/api/tasks/:id` | – | `{ task, submissions[], reviews[] }` | |
| PATCH | `/api/tasks/:id` | `UpdateTaskInput` | `Task` | The org saves the edited criteria and milestones, then sets `status: "open"` |
| POST | `/api/tasks/draft-spec` | `{ rawRequest }` | **`text/event-stream`** | Each `data:` line is one `DraftSpecEvent` (see below) |
| POST | `/api/tasks/:id/accept` | `AcceptInput` | `{ acceptance, slug \| null }` | 409 if `previewOpened` is false or there is no review. Sets `verified` when every criterion passed, and a slug is created then |
| GET | `/api/matches?taskId` | – | `Match[]` | Sorted by score, highest first |
| POST | `/api/matches/:id/confirm` | – | `Match` | Task must be `open`. Rejects the other suggestions and sets the task to `matched` |
| POST | `/api/submissions` | `CreateSubmissionInput` | `Submission` (201) | The GitHub integration fills in CI/preview/diff stats later. Sets the task to `in_review` |
| POST | `/api/reviews` | `CreateReviewInput` | `Review` (201) | If every criterion passes, the milestone is `done`. Otherwise the task goes back to `in_progress` |
| GET | `/api/work/:slug` | – | `WorkSample` | Read model for the public proof page |
| GET | `/api/people?role` | – | `Person[]` | |
| GET | `/api/people/:login` | – | `Portfolio` | Public portfolio |
| GET | `/api/impact` | – | `ImpactStats` | **Must come from real data only.** Judges score "proven impact" from this |
| GET | `/api/talent?skill` | – | `TalentCard[]` | Learners with at least one verified sample |

## Task lifecycle
```
draft → spec_review → open → matched → in_progress → in_review ─┬→ verified  (every criterion passed + org accepted)
                                          ↑                      └→ accepted  (org accepted, review not all-pass)
                                          └── review with needs_work
```

## Streaming: `DraftSpecEvent` order
```
title → (criterion_start → criterion_delta* → criterion_end)+ → milestone+ → meta → done
```
`error` can arrive at any point and ends the stream. The mock is in
`src/server/draftSpecMock.ts`. The real agent (Teammate B) must emit the same
sequence. Test it with:
```bash
curl -N -X POST localhost:3000/api/tasks/draft-spec -H 'content-type: application/json' \
  -d '{"rawRequest":"We need a volunteer sign-up form with WhatsApp confirmations"}'
```
