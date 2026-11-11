# KareGhar repository guidelines

KareGhar connects customers commissioning work with artists. The tagline is “Empowering artisans. Enabling businesses”. Keep the existing warm paper, indigo and saffron palette. Use the server-side function index below before introducing new abstractions or queries. Update this file and docs/API.md in the same change as the corresponding contracts.

## Product rules

- Public signup creates exactly one customer or artist role per username. Email is private. Profiles expose name, optional company, external links and optional photo.
- Customers post briefs. Artists send one private proposal per brief. Only the customer may select a proposer, accept submitted work and publish or hide the finished output. Finding → In-progress → Done. Finishing a job and publishing its output are independent decisions.
- Count accepted Done commissions for overall, category and per-form rankings, including private completions. Exclude sample accounts and sample commissions from ranks and impact. Tied artists share a rank. Zero completions have no displayed rank.
- Only trusted backend code designates sample records. Mark sample artists and briefs on public pages. Generated briefs are read-only.
- Existing categories are stable. Artists add new forms by adding portfolio work. Both discovery pages use the same catalogue and dependent filters.
- English/Hindi is a site-wide cookie preference. Localize interface text, including form feedback. Preserve authored text. Impact shows the pipeline and accepted commission value.

## Runtime and verification

Next.js 15 App Router, React 19, TypeScript, Tailwind 4 and Zod. Use Node 24 for local SQLite. Run npm ci, npm run lint and npm run build inside firstship. See README.md for deployment settings. Never commit credentials or local accounts/uploads. Keep cloud data in Supabase PostgreSQL and a private Supabase Storage bucket. Render is the planned pilot host. Target zero recurring cost within provider quotas.

Smoke-test signup for both roles, private proposals, owner-only selection, media before and after publication, and rankings after acceptance. Verify category/form filters, both languages, photo updates, session invalidation, and sample exclusions. Use separate browser sessions for a customer, an artist and a visitor.

## Contract and function index

Signatures below describe the callable application boundaries. UI page components in src/app compose these functions. Keep authorization in the server actions and read projections.

| Module and function | Inputs → output | Purpose |
| --- | --- | --- |
| contract/schemas | signupSchema, profileSchema, commissionSchema; Role, Account, Form, Work, Commission | Validate mutations and type the stored/read projections. Commission validation includes category and optional Other form name. Only server code sets IDs, role after registration, session revision, sample and workflow state. |
| contract/artForms | CATEGORIES, ART_FORMS | Bilingual category labels and initial form records. Read the live catalogue via market.forms. |
| server/db.query | SQL, bound scalar values → rows | Shared PostgreSQL/local SQLite access. Connect once per process. Initialize local schema and seed backend fixtures. PostgreSQL migrations run separately. |
| server/auth.authOptions | Credentials provider, JWT and session callbacks | Verify Argon2id, limit attempts per username, carry immutable account ID and password revision. |
| server/auth.viewer | () → current Account or null | Check session identity and revision against the stored account on every protected operation. |
| server/market.forms | () → Form[] | Read ordered live forms for both directories, posts and portfolio entry. |
| server/market.artists | optional category/form → Artist[] | Rank by eligible accepted commissions; include portfolio and completed-form matches. |
| server/market.commissions | filters?, id?, viewerId? → Commission[] | Public discovery and scoped detail with explicit output visibility. Only pass a server-authenticated viewer ID. |
| server/market.publicProfile | username → public account fields or undefined | Public profile without email, credentials or session state. |
| server/market.works, publishedWorks | artist ID → portfolio works or published commissioned works | Public profile galleries. |
| server/market.proposals | commission ID, authenticated account ID → proposal rows | Customer sees all proposals on their own brief; an artist sees their own. |
| server/actions.register | previous state, FormData(username,email,name,role,password) → feedback or login redirect | Create account with database-enforced uniqueness. |
| server/actions.updateProfile | state, FormData(name,email,company,social_* fields,linksExtra,photo?) → feedback | Update the current account; validate platform URLs, preserved legacy links and image content. Legacy links textarea submissions remain accepted. |
| server/actions.changePassword | state, FormData(current,password) → feedback or login redirect | Verify current password, replace hash and invalidate existing sessions. |
| server/actions.addWork | state, FormData(title,url,category,formName) → feedback | Resolve or add a form, attach portfolio work to the signed-in artist. |
| server/actions.postCommission | state, FormData(title,brief,category,form,otherForm?,fee) → feedback or detail redirect | Resolve the selected form or register an Other form in the selected category, then publish a customer brief in Finding. |
| server/actions.commissionAction | state, FormData(id,action,action-specific fields) → feedback | Apply a role-, owner- and state-guarded proposal, selection, submission, acceptance or visibility update. See docs/API.md. |
| server/media.saveMedia | File, photo boolean → private key or null | Verify file signature and size; store in private Supabase bucket or local demo folder. |
| server/media.removeMedia, mediaResponse | key → cleanup or Response | Remove unreferenced media or return authorized bytes with private cache headers. |
| i18n/language.language | () → {lang,t(en,hi)} | Read shared cookie and choose translated UI text on the server. |
| server/actions.switchLanguage | FormData(lang) → void | Persist language and refresh the layout. |
| components/ActionForm | action, lang, label, children → form | Shared pending state and translated validation/status feedback. |
| components/Filters, FilterFields | catalogue, selected category/form, optional status → GET filter form | Shared category-dependent form options. |
| components/Sample, stateName | no inputs / status and language → marker / label | Shared sample and lifecycle presentation. |
| components/CommissionFormFields | catalogue, language → category/form fields | Show dependent art forms and an Other name field on the post form. |
| components/PortfolioGallery | portfolio items, language → media viewer | Show image, audio, video or link work in-page with thumbnails and previous/next controls. |
| components/SocialLinks, socialKey | saved URLs → icons and platform key | Render recognizable transparent social icons and validate matching platform URLs. |

Profile and impact pages also use narrow read queries for the signed-in user's commissions and aggregate pipeline counts respectively. Authenticated mutations never trust a role, owner ID, sample flag or private media key supplied by a browser.

## Admin access and reversible suspension

Public signup always validates customer/artist. A backend-only admin grant supplies the effective admin role. Admins can view the customer/artist dashboard summary, including public profile fields, portfolio links and commission metadata. Never add an admin override to proposal or unpublished-media authorization. Public reads hide suspended accounts and affected listings. Active participants retain their history and see a pause notice. Completed commission history is preserved. Restoration requires fresh login.

| Module and function | Inputs → output | Purpose |
| --- | --- | --- |
| scripts/create-admin.mjs | username, optional email → generated password on stdout | Atomically creates a new account and admin grant. Never promotes a pre-existing username. |
| scripts/init-local-db.initializeLocalDb | SQLite database → void | Apply baseline and moderation migrations for both local startup and provisioning. |
| server/moderation.requireAdmin | () → active server-verified admin or 404 | Protect every moderation read and mutation. |
| moderationAccounts / moderationHistory | () → account summaries / audit events | List public identifiers, status, open commissions and moderation history. |
| moderationDashboard | target ID → public profile fields and commission summaries | Read-only dashboard, including suspended accounts. |
| server/moderation-action.moderateAccount | state, FormData(target, version, action, reason, confirm) → feedback | Append a suspension or restoration atomically. Reject stale sessions, stale decisions, self-targets and sample accounts. |

The account_state view derives the effective role, suspension and session version. Each audit event changes the target's session version. commission_state derives paused from both participants. The unique global moderation sequence serializes conflicting decisions. A valid active admin other than the target must exist at the time of a suspension, preserving the last active admin.

Both discovery directories use DirectoryTile(href, title, cover?, formLabel, children, footer, action) for artwork-first tiles. Real briefs show only published media or the form label. The specific-form filter is disabled until a category is selected. Impact retains its four totals, pipeline, average fee, completion rate, counting methodology and artist-directory link. Calculate all metrics from non-sample commissions.
Usernames preserve case at signup, admin provisioning and login. Passwords for signup and password changes must contain 6–128 characters.
A successful credentials login sends every role to the homepage (/). The header provides access to profile and moderation.
Production build and start use .next-production; development uses .next so a dev process cannot overwrite assets served by the production server.
