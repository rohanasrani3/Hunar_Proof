# KareGhar application interfaces

Public JSON reads use GET. Discovery pages and API handlers share the server market queries. Authenticated forms use Next.js Server Actions and Auth.js cookies. Caller identity always comes from `viewer()`; URL/form fields cannot choose another account's privileges.

## Discovery and media

| Endpoint | Response |
| --- | --- |
| `/api/forms` | Current forms with `id`, `category`, English `name` and Hindi `hi`. |
| `/api/talent?category=&form=` | Artists ordered by accepted commissions with a finished submission in the requested overall/category/form scope. `artFormId` is also accepted. Sample artists participate in pilot rankings and retain their sample marker. The current artist's own card is omitted after ranking, preserving ranks for other viewers. |
| `/api/commissions?category=&form=&status=` | Public commission cards; only `finding` and `done` are discoverable. `progress` produces no public directory results. A signed-in customer's own briefs and an assigned artist's own jobs are omitted; they live in history. |
| `/api/commissions/{id}` | Commission detail with authorized `output` or an empty string. In-progress jobs are available only to their customer/assigned artist. Unknown or inaccessible IDs return 404. |
| `/api/people/{handle}` | Public identity, company, social links, optional photo, bio and explicitly provided contact text. Login email, password/session state and deleted/suspended profiles are never exposed. |
| `/api/media/{key}` | Authorized bytes or 404. Profile photos and uploaded portfolio media are public while their account is active. Reference images are public with visible briefs; participants retain reference access through history. Finished submissions require participation or explicit customer publication after acceptance. Archived submissions stay private to their original artist and customer. Every read rechecks access and returns `private, no-store`. |
| `/api/auth/*` | Auth.js Credentials sign-in, session, CSRF and sign-out endpoints. |

`Commission` includes `original_fee`, current `fee`, `output_type`, `reference`, `deadline` (ISO calendar date, or empty for legacy records), creation/update/selection/submission/acceptance timestamps, customer public contact, and assigned artist identity/contact. Output values are private storage keys, or trusted static `/seed/…` paths for backend-defined samples. UI code must not invent public media access from an arbitrary client-supplied path.

## Account and portfolio actions

All actions below are exported by `src/server/actions.ts`. The shared signature is `(previousState: string, data: FormData) => Promise<string>`, except redirecting success paths and `switchLanguage(data)`.

| Action | Form fields | Result |
| --- | --- | --- |
| `register` | `username`, `name`, `email`, `password`, `role=artist|customer` | Creates one role and redirects to login. Artist signup carries `onboarding=artist`, leading to portfolio setup after sign-in. |
| `updateProfile` | `name`, private `email`, `company`, optional `bio` (up to 2,000 characters), public `contact` (up to 240), `social_linkedin`, `social_instagram`, `social_facebook`, `social_x`, `social_youtube`, `linksExtra` JSON array, optional `photo`, `removePhoto=on` | Updates the current account. Social URLs must match their platform. Legacy `links` textarea input is also accepted. Photo uploads override removal; removal clears the photo. JPEG/PNG/WebP only, at most 5 MiB. |
| `changePassword` | `current`, `password` | Verifies the existing password, rotates the hash and session revision, then redirects to login. Every existing session becomes invalid. |
| `deleteAccount` | `current`, `confirm=DELETE` | Verifies the password and rejects active in-progress commissions (`active` feedback). Anonymizes the account and invalidates sessions, removes its public portfolio/profile and uploaded portfolio/photo files, and redirects to login. Shared commission/proposal/message history remains for the other participant. Admin self-deletion is unavailable. |
| `addWork` | `title`, `category`, `formName`, `url` or uploaded `file` | Creates an owned portfolio item, resolving or registering the form within its category. Files support image/audio/MP4 up to 5 MiB. A supplied upload takes precedence over a URL. |
| `updateWork` | `id`, same fields as `addWork` | Edits only the current artist's item. An existing owned upload URL can be retained; arbitrary new internal media keys are not accepted. Replacing an uploaded file removes the superseded file. |
| `deleteWork` | `id` | Removes only the current artist's item and its directly owned uploaded media. It does not alter commission completion history or rankings. |
| `switchLanguage` | `lang=en|hi` | Stores the site-wide cookie and refreshes the layout. |

Usernames remain case-sensitive and allow 3–40 ASCII letters, digits or underscores. Registration and password changes require 6–128 characters. Normal successful login goes to `/`; artist onboarding goes to `/profile?tab=portfolio&onboarding=1`.

## Commission workflow

`postCommission` accepts `title`, `brief`, `category`, `form`, optional `otherForm`, `fee` (whole INR, 0–100,000,000), required `output_type`, required `deadline` (ISO calendar date, today or later in India Standard Time), and optional `reference` image. `form=__other__` registers `otherForm` in the selected category. Output types are `audio`, `video`, `live`, `physical`, `image`, and `other`. A new commission starts in Finding, preserves its original budget, records a creation event and redirects to `/profile/history/{id}`. The customer accepts a proposal in private Work history using `select`; this commissions the artist and locks the quote.

`commissionAction` always takes `id` and `action` plus the fields below:

| Action | Additional fields | Authorized transition |
| --- | --- | --- |
| `propose` | `message`, `pricing=offered|quote`, custom `quote` when applicable, `acknowledged=on` | One private proposal per artist per real Finding commission. Offered pricing copies the original budget; custom pricing requires an explicit valid number. Contact/scam acknowledgment is enforced server-side. |
| `editProposal` | Same fields as `propose` | Only the author, only while the brief is Finding, only for an active proposal, and only within 15 minutes of its original server timestamp. Keeps `initial_quote` and the original creation time, records each update; an expired edit returns `expired`. |
| `select` | `proposal`, `acknowledged=on` | Only the customer selects an active proposer. The agreed fee becomes the proposal's latest quotation; the original brief budget remains unchanged. State becomes In-progress and the brief leaves public discovery. |
| `cancel` | `reason` (1–4,000 characters) | Only the customer, while In-progress and before acceptance. Cancels the selected proposal and reopens Finding at the original budget. Preserves quotations, messages and any previous submitted output in private history. A cancelled proposal cannot be reselected or edited. |
| `submit` | `file` | Only the assigned artist, only In-progress, with no existing submission. Accepts JPEG/PNG/WebP/WAV/MP3/MP4 up to 5 MiB. Physical work/live performance can be evidenced with a photograph or recording. Submission remains private. |
| `accept` | None | Only the customer, only after a submission. Records acceptance, changes state to Done and makes the finished submission count toward ranking. Acceptance does not publish the file. |
| `visibility` | `public=on` or omitted | Only the customer, only after acceptance. Publishes or hides the finished output without changing ranking eligibility. |

Transitions and their events are committed together. Commission row locks serialize conflicting selections, cancellations, edits and deliveries. Account/session state is checked again inside mutations. Failed uploads/transitions clean up newly uploaded unreferenced files. Samples cannot sign in or take part in mutations.

## Private history, conversation and notifications

Server reads in `src/server/history.ts` accept only a server-authenticated account ID:

- `history(viewerId)` returns the account's posted, assigned or proposed commissions, including cancelled selections, original/current fees, timestamps, own proposal summary and unread count.
- `historyDetail(id, viewerId)` returns `{ commission, proposals, events, messages }`, or `undefined` for a nonparticipant. Customers see proposals and separate conversations with each artist; artists see only their own proposal, conversation and targeted events. Other applicants never receive a different artist's private submission or quote events.
- `unreadCount(viewerId)` counts unseen events/messages from other participants across the account's history.

`src/server/history-actions.ts` exports:

| Action | Fields | Behavior |
| --- | --- | --- |
| `sendMessage` | `id`, thread `artist`, `body` (1–4,000 characters) | Sends only within an existing customer–proposer thread, including its cancelled selection history, or to a legacy selected artist. Checks both sender/session and artist availability. No admin override. |
| `markHistoryRead` | `id`, `seenAt` epoch milliseconds | Explicit participant-only mutation. The cutoff is capped at server time and never moves backward. GET/render does not mark history as read. |

The history UI captures a cutoff before fetching history and offers an explicit mark-read button so newer concurrent arrivals remain unread. Work history is under `/profile/history` and `/profile/history/{id}`; it opens to active briefs and projects by default, with completed and all activity available as filters. The public commission board opens to Finding briefs by default. Times in UI are formatted separately from epoch-millisecond storage.

## Pilot data, rankings and storage

Rankings count one accepted Done commission with a nonempty finished submission, including private accepted work. Adding unrelated portfolio pieces alone does not inflate ranks. Ties share a rank, and zero completed submissions have no displayed rank. The pilot includes clearly marked fictional samples in discovery, rankings and impact; sample completed jobs have generated outputs. Sample account passwords remain empty and login requires `sample=0`.

Apply `migrations/004_experience.sql` and then `migrations/005_deadline.sql` once to PostgreSQL after the existing migrations. They add account/profile fields, commission specifications/timestamps and deadline, quotation history fields, events, private messages and read markers, then recreate the account/commission state views with deletion handling. Existing commissions retain an empty deadline because no date was recorded. New private tables have row-level security enabled and public/browser roles revoked. The local SQLite initializer applies each upgrade once inside a transaction and is safe to rerun. Local data defaults to `.kareghar`; `KAREGHAR_DATA_DIR` can isolate development or QA database/media storage.

Run `node scripts/test-experience.mjs` for migration, authorization and lifecycle integration checks against SQLite. The harness executes the real action/read modules with isolated session/framework/storage boundaries. It does not substitute for a PostgreSQL deployment migration rehearsal or browser smoke testing.

## Moderation

`/admin` and `/admin/{account-id}` require an active admin session. Dashboards expose public profile fields and commission metadata. Moderation grants no access to private proposals, messages or unpublished media.

`moderateAccount` takes `target`, `version`, `action=suspend|restore`, `reason` (1–4,000 trimmed characters), and `confirm=on`. It records actor, target, reason, time and transition atomically. Suspension invalidates sessions, blocks login, hides public listings and pauses related actions. Restoration retains historical records and requires a new login; a deleted account remains unavailable even if an older moderation suspension is restored.
