# Hunar Proof API contract

The frontend talks to the backend **only** through these endpoints. Request
and response shapes are defined in Zod in
[`src/contract/schemas.ts`](../src/contract/schemas.ts), and art-form ids come
from [`src/contract/artForms.ts`](../src/contract/artForms.ts). Those files are
the source of truth. If this page and those files disagree, the files are
correct.

A working reference implementation is in this repo:
`src/app/api/**/route.ts` together with `src/server/mockStore.ts`. To see the
expected responses, run `npm run dev` and send requests with curl.

## Rules for the real backend
- Use the same paths, under `/api`. Send JSON bodies with `Content-Type: application/json`. The one exception is `POST /api/media`, which takes multipart form data.
- On errors, return the body `{ "error": string, "details"?: any }`, with status 400 (bad input), 401/403 (auth), 404, or 409 (wrong state).
- Format every date as ISO-8601 with an offset (for example, `2026-11-08T16:00:00+05:30`).
- Auth uses cookies (`credentials: include`). Allow CORS from the frontend origin, with credentials.
- The client validates every response against the schema. **Any extra or missing field breaks the UI immediately**, so the mismatch shows up early instead of failing silently.
- Money: `feeInr` is a whole number of rupees. **The app records the agreed fee, but it never moves money.** The employer pays the artist directly.

## Endpoints

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/api/commissions?employerId&artistId&guruId&status` | – | `Commission[]` | All filters are optional |
| POST | `/api/commissions` | `CreateCommissionInput` | `Commission` (201) | Status starts at `draft` |
| GET | `/api/commissions/:id` | – | `{ commission, submissions[], reviews[] }` | |
| PATCH | `/api/commissions/:id` | `UpdateCommissionInput` | `Commission` | The employer saves the edited brief, fee and milestones, then sets `status: "open"` |
| POST | `/api/commissions/draft-brief` | `{ rawRequest }` | **`text/event-stream`** | Each `data:` line is one `DraftBriefEvent` (see below) |
| POST | `/api/commissions/:id/accept` | `AcceptInput` | `{ acceptance, slug \| null }` | 409 if `workViewed` is false or there is no review. Sets `verified` when every point passed, and a slug is created then |
| GET | `/api/matches?commissionId` | – | `Match[]` | Sorted by score, highest first. The guru must practise the same art form |
| POST | `/api/matches/:id/confirm` | – | `Match` | Commission must be `open`. Rejects the other suggestions and sets the commission to `matched` |
| POST | `/api/media` | multipart: `file`, `stage` (`process`\|`final`), `caption?` | `Media` (201) | Photo (jpeg/png/webp/heic), audio (mp3/m4a/aac/ogg/webm/wav) or video (mp4/webm/mov), up to 25 MB. **Real backend: compress images and transcode video for 3G** |
| GET | `/api/media/:id` | – | the file | Mock only. The real backend returns storage/CDN URLs in `Media.url` |
| POST | `/api/submissions` | `CreateSubmissionInput` | `Submission` (201) | Upload the media first, then send `mediaIds` (and an optional `voiceNoteId`). Sets the commission to `in_review` |
| POST | `/api/reviews` | `CreateReviewInput` | `Review` (201) | If every point passes, the milestone is `done`. Otherwise the commission goes back to `in_progress` |
| GET | `/api/work/:slug` | – | `WorkSample` | Read model for the public proof page |
| GET | `/api/people?role` | – | `Person[]` | |
| GET | `/api/people/:handle` | – | `Portfolio` | Public portfolio |
| GET | `/api/impact` | – | `ImpactStats` | **Must come from real data only.** Judges score "proven impact" from this. `artistEarningsInr` is the sum of fees for accepted commissions |
| GET | `/api/talent?artForm` | – | `TalentCard[]` | Artists with at least one verified work |

## Commission lifecycle
```
draft → brief_review → open → matched → in_progress → in_review ─┬→ verified  (every point passed + employer accepted)
                                            ↑                     └→ accepted  (employer accepted, review not all-pass)
                                            └── review with needs_work
```

## Streaming: `DraftBriefEvent` order
```
title → (criterion_start → criterion_delta* → criterion_end)+ → milestone+ → meta → done
```
`meta` carries `artFormIds`, `estDays`, `suggestedFeeInr` and `onSite`.
`error` can arrive at any point and ends the stream. The mock is in
`src/server/draftBriefMock.ts`. The real agent must emit the same sequence.
Test it with:
```bash
curl -N -X POST localhost:3000/api/commissions/draft-brief -H 'content-type: application/json' \
  -d '{"rawRequest":"We want a Madhubani painting on our hotel lobby wall"}'
```
