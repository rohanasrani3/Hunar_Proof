# Hunar Proof: who does what (deadline Sun 15 Nov 2026)

Code for a Billion hackathon, **Track 9: Livelihood for the Uneducated**.
Scoring is 4 × 25 points: size of problem, severity, quality of solution, and
**proven impact**. Proven impact is also tie-breaker #1, and it means *real
deployment data*. Real pilot data is how we win.

**The pivot (10 Nov):** we changed from tech projects for youth to regional
art, music, dance and craft. Employers commission work directly, a guru
reviews it, and the artist earns a verified work record. GitHub, PRs and CI
are gone. Photos, recordings and videos are the evidence now.

## Hard eligibility (any one missing = not judged)
- [ ] Built in **AgentFoundry.me** (the official IDE). Check how it wants repos imported or committed.
- [ ] Deployed to a cloud by 15 Nov
- [ ] Public GitHub repo for *our code*, MIT licence, README with setup steps
- [ ] 2–3 min demo video or live link
- [ ] Submission issue filed at github.com/karlmehta/code-for-a-billion, **with the track set to 9**

## Split

### Frontend (Rohan)
Every screen, the design system, Hindi/English, OG images, motion and
accessibility. **The artist side is phone-first:** Hindi by default, big
buttons, camera and mic upload, voice notes instead of typing, and the brief
read aloud. Owns the **contract** (`src/contract/*`) and the mock API.
Deploys the web app.

### Teammate A: Backend / Platform
1. Database + schema matching `src/contract/schemas.ts`. Recommended: Postgres (Supabase or Neon).
2. **Media storage**: `POST /api/media` to object storage (Supabase Storage, S3 or R2) and CDN URLs in `Media.url`. 25 MB limit.
3. Auth: **phone OTP** for artists and gurus (many won't use email), email or phone for employers. Roles: artist, guru, employer, admin.
4. Implement every endpoint in [`docs/API.md`](API.md). The mock in `src/server/mockStore.ts` is the reference behaviour, so match its state transitions.
5. Permissions: an employer only sees its own commissions, only the matched guru can review, only the employer can accept.
6. Deploy. **Live endpoints by Wed 11 Nov.** The pilot can't record real data on the in-memory mock.

### Teammate B: AI + Media + Pilot
1. **Brief-drafting agent**: the employer's request → criteria + milestones + art form + **suggested fair fee**, streamed as `DraftBriefEvent`s. Build it with AgentFoundry agents (this targets the sponsor prize "Best Use of AgentFoundry Agents").
2. **Matching agent**: artist ↔ commission ↔ guru (the guru must practise the same art form), returning `Match` with plain-language `reasons[]`.
3. **Media pipeline**: image compression, video transcode for 3G, and Hindi speech-to-text for artists' voice notes (optional: text-to-speech to read the brief aloud).
4. **Pilot** (critical path, **start today**): 1 employer, 3 commissions, 2–3 artists, 1–3 gurus. Leads, in order: a local café or restaurant, a hotel, a wedding or event planner, a college fest, a family business. Get a verbal okay from each artist to show their work publicly. Employer confirmed by **Wed 11 Nov**, 3 commissions accepted by **Sat 14 Nov**.
5. Impact evidence: photos, the employer's quote, the fees paid to artists. Then the README, the demo video and the submission issue.

## Hand-offs
| When | What | From → To |
|---|---|---|
| Tue 10 | New contract + mock API (this repo) | Frontend → A, B |
| Wed 11 | Pilot employer confirmed + their 3 requests, in their own words | B → all |
| Wed 11 | Live endpoints + media upload deployed | A → Frontend |
| Thu 12 | Live draft-brief stream + matching | B → A/Frontend |
| Fri 13 | Frontend switched to `NEXT_PUBLIC_API_MODE=live` | Frontend |
| Sat 14 | Demo recorded with real pilot data | B (+ Frontend) |
| Sun 15 (before noon IST) | Submission issue filed | B |
