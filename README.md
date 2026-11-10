# Hunar Proof

**Skill you can see. Work employers can trust.**

India's folk painters, musicians, dancers and craftspeople are judged by
certificates they never had a chance to earn. With Hunar Proof:

1. **An employer** (a café, hotel, event organiser or brand) describes, in
   their own words, what they want made or performed. An AI agent turns it
   into a clear brief with milestones and a suggested fair fee, and the
   employer approves it.
2. **An artist** is matched with a **guru**: a master of the same art form.
   The artist shares photos, recordings and videos from their phone as the
   work takes shape. Voice notes replace typing.
3. **The guru** checks each point of the brief, **the employer** accepts the
   finished work, and the artist gets a public, **verified work record** that
   the next employer can trust.

Art forms: folk painting (Warli, Madhubani, Gond…), folk and classical music,
dance and performance, and crafts and textiles. The full list is in
[`src/contract/artForms.ts`](src/contract/artForms.ts).

Code for a Billion hackathon 2026, Track 9: Livelihood for the Uneducated.

> Handloom and handicraft workers earn about ₹7,000 a month on average, and
> 61 lakh people work in the sector in just five surveyed states
> (Crafts Council of India & IHD, *Economics of Indian Craft*, 2026).

## Run locally
```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_MODE=mock uses the built-in seed data
npm run dev                  # http://localhost:3000
```
- `/`: landing page
- `/w/hp-0001`: a verified work page (seed data)
- `/employer/commissions/new`: the employer's AI brief flow (Hindi/English)
- `POST /api/dev/reset`: restores the seed data (mock mode only)

The seed people are fictional, and the seed artworks and recordings in
`public/seed/` are generated placeholders, not real artists' work.

## Docs
- [docs/API.md](docs/API.md): the API contract the backend implements
- [docs/TEAM.md](docs/TEAM.md): who builds what, and the hand-off dates
- [src/contract/schemas.ts](src/contract/schemas.ts): Zod schemas (source of truth)

## Licence
MIT
