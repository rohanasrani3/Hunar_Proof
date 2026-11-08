# FirstShip

**A supervised first project for a real organisation.** An NGO describes a small
technical task in its own words. An AI agent turns it into acceptance criteria
and milestones. A beginner coder and a mentor are matched to it. The learner
ships against a preview environment, the mentor reviews each criterion, and the
NGO accepts the work. The result is a **verified work sample** that employers
can inspect.

Code for a Billion hackathon 2026, Track 10: Tech Employment for Youth.

> ~83% of India's unemployed are young people, and graduates are unemployed at
> 29.1%, against 3.4% for people who cannot read or write
> (ILO & IHD, *India Employment Report 2024*).

## Run locally
```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_MODE=mock uses the built-in seed data
npm run dev                  # http://localhost:3000
```
`POST /api/dev/reset` restores the seed data (mock mode only).

## Docs
- [docs/API.md](docs/API.md): the API contract the backend implements
- [docs/TEAM.md](docs/TEAM.md): who builds what, and the hand-off dates
- [src/contract/schemas.ts](src/contract/schemas.ts): Zod schemas (source of truth)

## Licence
MIT
