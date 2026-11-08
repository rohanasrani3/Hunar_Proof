# FirstShip: who does what (deadline Sun 15 Nov 2026)

Code for a Billion hackathon, Track 10 (Tech Employment for Youth).
Scoring is 4 × 25 points: size of problem, severity, quality of solution, and
**proven impact**. Proven impact is also tie-breaker #1, and it means *real
deployment data*. Real pilot data is how we win.

## Hard eligibility (any one missing = not judged)
- [ ] Built in **AgentFoundry.me** (the official IDE). Check on day 1 how it wants repos imported or committed.
- [ ] Deployed to a cloud by 15 Nov
- [ ] Public GitHub repo, MIT licence, README with setup steps
- [ ] 2–3 min demo video or live link
- [ ] Submission issue filed at github.com/karlmehta/code-for-a-billion

## Split

### Frontend (Rohan)
Every screen, the design system, Hindi/English, OG images, motion and
accessibility. Owns the **contract** (`src/contract/schemas.ts`) and the
mock API. Deploys the web app to Vercel.

### Teammate A: Backend / Platform
1. Database + schema matching `src/contract/schemas.ts`. Recommended: Postgres (Supabase or Neon).
2. Auth: GitHub OAuth for learners and mentors, email magic link for org staff. Roles: learner, mentor, org, admin, employer.
3. Implement every endpoint in [`docs/API.md`](API.md). The mock in `src/server/mockStore.ts` is the reference behaviour, so match its state transitions.
4. Permissions: an org only sees its own tasks, only the mentor can review, only the org can accept.
5. Deploy. **Live endpoints by Wed 11 Nov**, because the pilot can't record real data on the in-memory mock.

### Teammate B: AI + Integrations + Impact
1. **Spec-drafting agent**: raw request → acceptance criteria + milestones, streamed as `DraftSpecEvent`s. Build it with AgentFoundry agents (this targets the sponsor prize "Best Use of AgentFoundry Agents").
2. **Matching agent**: scores learner ↔ task ↔ mentor and returns `Match` with plain-language `reasons[]`.
3. **GitHub integration**: a webhook or GitHub App that fills in `Submission.ciStatus`, tests, diff stats, `merged`, and the preview-deploy URL.
4. **Pilot** (critical path, **start today**): find 1 organisation with 3 small tasks and 2–3 learners. Fallbacks, in order: a local NGO, a college society or club, an open-source civic project, a family business. Organisation confirmed by **Tue 10 Nov**, 3 tasks shipped by **Sat 14 Nov**.
5. Impact evidence: screenshots, the NGO's quote, before/after numbers. Then the README, the demo video and the submission issue.

## Hand-offs
| When | What | From → To |
|---|---|---|
| Sun 8 | Contract + mock API (this repo) | Frontend → A, B |
| Tue 10 | Pilot organisation confirmed + its 3 raw task requests | B → all |
| Wed 11 | Live endpoints deployed | A → Frontend |
| Thu 12 | Live draft-spec stream + matching | B → A/Frontend |
| Fri 13 | Frontend switched to `NEXT_PUBLIC_API_MODE=live` | Frontend |
| Sat 14 | Demo recorded with real pilot data | B (+ Frontend) |
| Sun 15 (before noon IST) | Submission issue filed | B |
