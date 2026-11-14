# Marketplace experience validation

Validated locally on 15 November 2026 with Node 24 and an isolated SQLite database under `.kareghar/qa-experience`. Test accounts and uploads stay in this ignored directory; hosted accounts were not used.

## Automated checks

- `npm ci`: completed.
- `npm run lint`: passed.
- `npm run build`: passed, including TypeScript and route generation.
- `npm run test:experience`: passed using the application actions and read modules with an isolated SQLite database and test session/storage adapters.
- `git diff --check`: passed; Git reports normal Windows line-ending conversion notices.

The regression harness covers migration upgrades and repeated initialization, idempotent pilot seeding, offered/custom quotes and blank-quote rejection, immutable initial quotations, the 15-minute editing window, participant/owner authorization, cancellation and archived history, private messages and media, finished-submission ranking eligibility, portfolio ownership/cleanup, profile/photo changes, and account deletion/session invalidation.

## Browser walkthrough

- Artist and customer signup/login; artist onboarding opens the portfolio tab.
- Add portfolio work through a modal; editing and Cancel preserve the saved entry.
- Profile Cancel discards draft changes; saving bio and explicitly public contact updates the read view.
- Create an audio brief; format-specific guidance updates; posting opens private History.
- Artist sends a custom quotation, edits it within the allowed window, and retains the initial quotation in History.
- Customer and artist exchange private messages; unread badges appear; marking updates as read clears the badge.
- Customer selects the artist with the contact-before-work acknowledgment; the agreed fee matches the edited quote.
- Artist uploads a WAV submission; an inline audio player appears; customer acceptance advances the tracking timeline to Completed.
- Discovery excludes the customer's own commission; public status choices include open and completed work only.
- Category filtering and Clear filters reset both category and dependent form controls.
- Public portfolio slideshow advances and switches to a grid.
- Hindi/English switching, mobile profile/portfolio dialogs, 320px and 390px narrow layouts, 768px discovery, and 1280px history/gallery layouts checked. Fixed narrow Hindi header overflow, impact-number wrapping, secondary-button styling and shared unread-badge styling during this pass.

## Deployment boundary

No production release or remote database mutation was performed. Apply `migrations/004_experience.sql` once to an existing hosted database after migrations 001–003, before deploying this application version. The PostgreSQL migration and private Supabase Storage path require a hosted-environment smoke test; local checks exercise SQLite and local media. External portfolio URLs depend on the remote host permitting embedding.
