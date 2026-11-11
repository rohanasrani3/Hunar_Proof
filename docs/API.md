# KareGhar application interfaces

Public JSON reads use GET. Discovery pages and API handlers call the same market queries. Authenticated forms use Next.js Server Actions and Auth.js cookies.

| Endpoint | Response |
| --- | --- |
| /api/forms | Current forms with id, category, name and Hindi label hi. |
| /api/talent?category=&form= | Artist directory ordered by eligible completed commission count in the selected scope. artFormId is also accepted. |
| /api/commissions?category=&form=&status= | Commission cards. Status values are finding, progress and done. |
| /api/commissions/{id} | Commission detail with authorized output key or empty string. Unknown ID returns 404. |
| /api/people/{handle} | Public profile fields or 404. |
| /api/media/{key} | Authorized file bytes or 404. Responses use private, no-store caching. |
| /api/auth/* | Auth.js Credentials signin, session, CSRF and signout endpoints. |

## Mutation schemas

All action arguments are validated or resolved on the server. An invalid request returns localized UI feedback. Identity and state checks are repeated in guarded database writes. Form actions are in src/server/actions.ts.

| Action | Form fields | Result |
| --- | --- | --- |
| register | username, name, email, password, role (artist or customer) | Account and login redirect. |
| updateProfile | name, email, company, social_linkedin, social_instagram, social_facebook, social_x, social_youtube, linksExtra (preserved legacy URL array), optional photo | Updates authenticated account. Each social URL must match its platform. Legacy links textarea submissions remain accepted. Photo supports JPEG, PNG or WebP. |
| changePassword | current, password | Rotates password hash and session revision. |
| addWork | title, url, category, formName | Adds portfolio work and registers a form in its category when needed. |
| postCommission | title, brief, category, form, optional otherForm, fee (whole INR) | New Finding commission and detail redirect. form=__other__ registers otherForm in the selected category. |
| commissionAction / propose | id, message | One private proposal per artist per real Finding commission. |
| commissionAction / select | id, proposal | Owner selects a proposer; state becomes In-progress. |
| commissionAction / submit | id, file | Assigned artist submits a finished image, WAV, MP3 or MP4 up to 5 MiB. |
| commissionAction / accept | id | Owner accepts a submitted output; state becomes Done, initially private. |
| commissionAction / visibility | id, public (on or omitted) | Owner publishes or hides the completed output. |
| switchLanguage | lang (en or hi) | Stores the site-wide language cookie. |

The lifecycle mutations never accept a caller-supplied account identity, role or sample flag. Sample data is assigned by backend fixtures. The rank counts Done commissions once each, regardless of output visibility.

## Moderation

/admin and /admin/{account-id} require an active admin session. Dashboard views expose public profile and commission metadata. Only actual commission participants can read proposals or unpublished files.

/admin/{account-id} submits moderateAccount with target, version, action (suspend or restore), reason (1–4000 trimmed characters) and confirm=on. The server records actor, target, reason, time and transition. Suspension invalidates sessions, blocks login, removes public listings and pauses related actions. Restoration preserves historical records and requires a new login. There is no account deletion endpoint.
Usernames are case-sensitive and allow 3–40 ASCII letters, digits or underscores. Registration and password changes accept 6–128 characters.
