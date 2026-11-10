/**
 * Seed data for the mock backend: 1 employer, 3 commissions at different
 * stages (painting verified, music in review, craft open), 3 artists, 3 gurus.
 * All people are fictional. Names in [brackets] are placeholders for the real
 * pilot employer — never present seed data as real pilot impact.
 * Seed media in /public/seed are original placeholders, not real artworks.
 */
import type {
  Acceptance,
  Commission,
  Employer,
  Match,
  Media,
  Person,
  Review,
  Submission,
} from "@/contract/schemas";

export interface DB {
  employers: Employer[];
  people: Person[];
  commissions: Commission[];
  matches: Match[];
  media: Media[];
  submissions: Submission[];
  reviews: Review[];
  acceptances: Acceptance[];
  /** commissionId → public work-sample slug (only for verified commissions) */
  slugs: Record<string, string>;
}

const d = (s: string) => new Date(s).toISOString();

export function createSeed(): DB {
  const employers: Employer[] = [
    { id: "e1", name: "[Pilot café]", kind: "Café", city: "Pune", contactName: "[Owner]" },
  ];

  const people: Person[] = [
    { id: "a1", role: "artist", name: "Sunita W.", handle: "sunita-w", artFormIds: ["warli"], region: "Maharashtra", city: "Palghar", languages: ["Marathi", "Hindi"], yearsPracticing: 6 },
    { id: "a2", role: "artist", name: "Ravi P.", handle: "ravi-p", artFormIds: ["marathi-folk", "lavani"], region: "Maharashtra", city: "Satara", languages: ["Marathi", "Hindi"], yearsPracticing: 4 },
    { id: "a3", role: "artist", name: "Meena K.", handle: "meena-k", artFormIds: ["block-print"], region: "Rajasthan", city: "Bagru", languages: ["Hindi", "Rajasthani"], yearsPracticing: 8 },
    { id: "g1", role: "guru", name: "Guru Lakshman T.", artFormIds: ["warli"], region: "Maharashtra", city: "Dahanu", languages: ["Marathi", "Hindi"], yearsPracticing: 32 },
    { id: "g2", role: "guru", name: "Shahir Dattatray M.", artFormIds: ["marathi-folk", "lavani"], region: "Maharashtra", city: "Pune", languages: ["Marathi", "Hindi"], yearsPracticing: 28 },
    { id: "g3", role: "guru", name: "Kamla D.", artFormIds: ["block-print", "handloom"], region: "Rajasthan", city: "Jaipur", languages: ["Hindi", "Rajasthani"], yearsPracticing: 35 },
    { id: "u-emp", role: "employer", name: "[Owner]", artFormIds: [], languages: ["Hindi", "English"], employerId: "e1" },
    { id: "admin", role: "admin", name: "Hunar Proof Admin", artFormIds: [], languages: ["English", "Hindi"] },
  ];

  const commissions: Commission[] = [
    {
      id: "c1",
      employerId: "e1",
      title: "Warli mural for the café counter wall",
      rawRequest:
        "We are opening a café in Pune and want a Warli painting on the wall behind the counter. Something with village life and dancing, not too busy.",
      status: "verified",
      artFormIds: ["warli"],
      estDays: 5,
      feeInr: 18000,
      onSite: true,
      city: "Pune",
      artistId: "a1",
      guruId: "g1",
      createdAt: d("2026-11-02T10:00:00+05:30"),
      criteria: [
        { id: "k1", text: "A pencil sketch of the full layout is approved by the café before painting starts.", aiGenerated: true, approved: true },
        { id: "k2", text: "Uses traditional Warli motifs — the tarpa circle dance, trees and huts — in white on a red-ochre ground.", aiGenerated: true, approved: true },
        { id: "k3", text: "Covers the full 8 × 5 ft wall behind the counter, leaving the menu board area clear.", aiGenerated: true, approved: true },
        { id: "k4", text: "Finished with a clear matte sealant so it can be wiped clean.", aiGenerated: true, approved: true },
        { id: "k5", text: "Completed on site within 5 working days, outside café opening hours.", aiGenerated: false, approved: true },
      ],
      milestones: [
        { id: "m1", title: "Layout sketch", estDays: 1, criterionIds: ["k1"], status: "done" },
        { id: "m2", title: "Painting", estDays: 3, criterionIds: ["k2", "k3"], status: "done" },
        { id: "m3", title: "Sealing and handover", estDays: 1, criterionIds: ["k4", "k5"], status: "done" },
      ],
    },
    {
      id: "c2",
      employerId: "e1",
      title: "30-second Marathi folk jingle for Instagram reels",
      rawRequest:
        "Can someone make a short folk-style song about our café for our Instagram videos? Marathi, happy, with traditional instruments.",
      status: "in_review",
      artFormIds: ["marathi-folk"],
      estDays: 4,
      feeInr: 9000,
      onSite: false,
      artistId: "a2",
      guruId: "g2",
      createdAt: d("2026-11-04T11:30:00+05:30"),
      criteria: [
        { id: "k6", text: "Between 25 and 30 seconds long, with the café's name sung clearly at least once.", aiGenerated: true, approved: true },
        { id: "k7", text: "Played on traditional instruments such as dholki and tuntuni — no electronic beats.", aiGenerated: true, approved: true },
        { id: "k8", text: "Delivered as a clean recording without background noise, plus an instrumental-only version.", aiGenerated: true, approved: true },
      ],
      milestones: [
        { id: "m4", title: "Lyrics and tune draft", estDays: 2, criterionIds: ["k6", "k7"], status: "submitted" },
        { id: "m5", title: "Final recording", estDays: 2, criterionIds: ["k8"], status: "todo" },
      ],
    },
    {
      id: "c3",
      employerId: "e1",
      title: "Block-printed table runners for 12 tables",
      rawRequest:
        "We want hand block-printed table runners for our 12 tables, in indigo, maybe with a small coffee-bean pattern mixed with a traditional design.",
      status: "open",
      artFormIds: ["block-print"],
      estDays: 10,
      feeInr: 14400,
      onSite: false,
      createdAt: d("2026-11-06T09:00:00+05:30"),
      criteria: [
        { id: "k9", text: "12 runners, each 6 ft × 14 in, on cotton fabric.", aiGenerated: true, approved: true },
        { id: "k10", text: "Printed by hand with wooden blocks using natural indigo dye.", aiGenerated: true, approved: true },
        { id: "k11", text: "A sample runner with the coffee-bean motif is approved before the full run.", aiGenerated: true, approved: true },
        { id: "k12", text: "Colour does not run after a cold machine wash.", aiGenerated: true, approved: true },
      ],
      milestones: [
        { id: "m6", title: "Block carving and sample runner", estDays: 4, criterionIds: ["k10", "k11"], status: "todo" },
        { id: "m7", title: "Full print run and wash test", estDays: 6, criterionIds: ["k9", "k12"], status: "todo" },
      ],
    },
  ];

  const matches: Match[] = [
    { id: "mt1", commissionId: "c1", artistId: "a1", guruId: "g1", score: 0.93, reasons: ["Paints Warli for 6 years", "Available for 5 days on site in Pune"], status: "confirmed" },
    { id: "mt2", commissionId: "c2", artistId: "a2", guruId: "g2", score: 0.87, reasons: ["Sings Marathi folk songs and plays dholki"], status: "confirmed" },
    { id: "mt3", commissionId: "c3", artistId: "a3", guruId: "g3", score: 0.9, reasons: ["Practises Bagru block print for 8 years", "Works with natural indigo", "Guru Kamla D. teaches block print in Jaipur"], status: "suggested" },
  ];

  const media: Media[] = [
    { id: "md1", kind: "photo", stage: "process", url: "/seed/warli-sketch.svg", caption: "Layout sketch approved by the café", createdAt: d("2026-11-03T18:00:00+05:30") },
    { id: "md2", kind: "photo", stage: "process", url: "/seed/warli-half.svg", caption: "Day 2: dancers and musician painted", createdAt: d("2026-11-05T22:30:00+05:30") },
    { id: "md3", kind: "photo", stage: "final", url: "/seed/warli-final.svg", caption: "Finished mural, sealed", createdAt: d("2026-11-08T07:00:00+05:30") },
    { id: "md4", kind: "audio", stage: "process", url: "/seed/jingle-draft.wav", caption: "Tune draft (placeholder audio)", durationSec: 8, createdAt: d("2026-11-07T20:00:00+05:30") },
  ];
  const m = (id: string) => media.find((x) => x.id === id)!;

  const submissions: Submission[] = [
    { id: "s1", commissionId: "c1", milestoneId: "m1", media: [m("md1")], note: "Sketch for the wall, approved by the owner on site.", submittedAt: d("2026-11-03T18:10:00+05:30") },
    { id: "s2", commissionId: "c1", milestoneId: "m3", media: [m("md2"), m("md3")], note: "Mural finished and sealed.", submittedAt: d("2026-11-08T07:15:00+05:30") },
    { id: "s3", commissionId: "c2", milestoneId: "m4", media: [m("md4")], submittedAt: d("2026-11-07T20:05:00+05:30") },
  ];

  const reviews: Review[] = [
    {
      id: "r1",
      submissionId: "s2",
      commissionId: "c1",
      guruId: "g1",
      results: [
        { criterionId: "k1", verdict: "pass", comment: "Sketch was checked with the owner before any paint went on." },
        { criterionId: "k2", verdict: "pass", comment: "The tarpa circle and the figures are drawn the traditional way." },
        { criterionId: "k3", verdict: "pass", comment: "Full wall covered; menu board area kept clear." },
        { criterionId: "k4", verdict: "pass", comment: "Matte sealant applied evenly." },
        { criterionId: "k5", verdict: "pass", comment: "Finished in 5 days, all after closing time." },
      ],
      rubric: { craft: 4, tradition: 5, timeliness: 5 },
      summary: "Steady hand and true to the tradition. The dancers' rhythm is very good.",
      reviewedAt: d("2026-11-08T12:00:00+05:30"),
    },
  ];

  const acceptances: Acceptance[] = [
    { commissionId: "c1", signatoryName: "[Owner]", acceptedAt: d("2026-11-08T16:00:00+05:30"), workViewed: true, quote: "[One line from the café on what changed]" },
  ];

  return { employers, people, commissions, matches, media, submissions, reviews, acceptances, slugs: { c1: "hp-0001" } };
}
