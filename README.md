# KareGhar

Empowering artisans. Enabling businesses

Customers post commission briefs. Artists send private proposals, the customer selects an artist, and the artist submits a finished file. The customer accepts it and decides whether to display it. Find artists by art category, form and completed commissions. Switch between English and Hindi in the header.

## Run locally

Use Node.js 24. Run `npm ci` then `npm run dev`. Open http://localhost:3000. Local development automatically creates a persistent SQLite database and media directory under the ignored `.kareghar/` folder. Generated examples are labeled Sample data. Sign up separately as a customer and an artist to try the full workflow.

- `/commissions` — browse and post work
- `/talent` — filter and rank artists
- `/profile` — manage details, portfolio work, commissions and password
- `/impact` — live pipeline and accepted fees

## Supabase and hosting

1. Apply migrations/001_marketplace.sql followed by migrations/002_supabase.sql and migrations/003_moderation.sql in the Supabase SQL editor. The second migration enables row-level security, revokes public API access and creates the private kareghar bucket.
2. Set server-only DATABASE_URL (Supabase PostgreSQL connection string with TLS), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXTAUTH_SECRET (random secret), and NEXTAUTH_URL (canonical HTTPS origin). Auth.js manages sessions. Keep privileged credentials off the client.
3. Build with `npm run build` and serve with `npm start` on a Node host such as Render. Set the host runtime to Node 24. For an explicitly local production-build smoke test, use KAREGHAR_LOCAL=1, a local NEXTAUTH_URL and a temporary NEXTAUTH_SECRET.
4. Set KAREGHAR_SEED_SAMPLES=1 only if sample records should be inserted into a connected database. Accounts created by signup are always real, single-role accounts.

Uploads are limited to 5 MiB and pass through the authenticated server before storage. Profile photos are public. Finished files are private to participants until the customer publishes them. The media route checks access on every read, including after a customer hides an output.

Run `npm run lint` and `npm run build` before submitting. AGENTS.md records function contracts and product decisions. docs/API.md lists the HTTP and Server Action interfaces.

## Admin provisioning

Run npm run admin:create -- Admin from the project directory to create a fresh administrator. The command generates a password and prints it once to your terminal. An optional email is the second argument. The database permits one account with a blank email. Public signup cannot grant admin access. Set DATABASE_URL when targeting the hosted database and apply migration 003 first. Local setup applies the migration automatically.

Sign in at /login and open Moderation. The account page shows current commissions before suspension. Both suspension and restoration require a reason and confirmation. Admins cannot access another user's private proposals, email or unpublished media.
