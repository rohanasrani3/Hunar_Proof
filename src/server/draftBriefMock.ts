/**
 * Mock of Teammate B's brief-drafting agent. Picks a canned brief by keyword
 * and streams it word-by-word so the co-editing UI can be built now.
 * The real agent must emit the same DraftBriefEvent sequence.
 */
import { ART_FORMS } from "@/contract/artForms";
import type { DraftBriefEvent, Milestone } from "@/contract/schemas";

type Template = {
  match: RegExp;
  title: string;
  artFormIds: string[];
  onSite: boolean;
  estDays: number;
  feeInr: number; // starting point for a fair fee; employer edits it
  criteria: string[];
  milestones: { title: string; estDays: number; criteria: number[] }[];
};

const TEMPLATES: Template[] = [
  {
    match: /mural|wall|paint|warli|madhubani|gond|pattachitra|kalamkari|art ?work|illustrat/i,
    title: "Hand-painted folk-art mural",
    artFormIds: ["warli"],
    onSite: true,
    estDays: 5,
    feeInr: 18000,
    criteria: [
      "A pencil sketch of the full layout is approved before painting starts.",
      "Uses traditional motifs of the chosen art form, drawn the traditional way.",
      "Covers the agreed wall area, with exact size confirmed on the first visit.",
      "Finished with a clear sealant so it can be wiped clean.",
      "Completed on site within the agreed days, outside opening hours.",
    ],
    milestones: [
      { title: "Layout sketch", estDays: 1, criteria: [0] },
      { title: "Painting", estDays: 3, criteria: [1, 2] },
      { title: "Sealing and handover", estDays: 1, criteria: [3, 4] },
    ],
  },
  {
    match: /song|music|jingle|sing|tune|instrument|folk|baul|carnatic|hindustani|band|performance music/i,
    title: "Original folk song recording",
    artFormIds: ["marathi-folk"],
    onSite: false,
    estDays: 4,
    feeInr: 9000,
    criteria: [
      "The agreed length, with the business name sung clearly at least once.",
      "Played on traditional instruments of the chosen style — no electronic beats.",
      "Lyrics are shared and approved before the final recording.",
      "Delivered as a clean recording without background noise, plus an instrumental-only version.",
    ],
    milestones: [
      { title: "Lyrics and tune draft", estDays: 2, criteria: [0, 1, 2] },
      { title: "Final recording", estDays: 2, criteria: [3] },
    ],
  },
  {
    match: /danc|lavani|kathak|bharatanatyam|puppet|kathputli|wedding|event|stage|show/i,
    title: "Live folk performance at the event",
    artFormIds: ["lavani"],
    onSite: true,
    estDays: 3,
    feeInr: 15000,
    criteria: [
      "A short rehearsal video of the planned piece is shared and approved a week before the event.",
      "Costumes and music are true to the tradition of the chosen form.",
      "Performance runs for the agreed length at the agreed time.",
      "Artists arrive at least one hour early for a sound and space check.",
    ],
    milestones: [
      { title: "Rehearsal video", estDays: 2, criteria: [0, 1] },
      { title: "Performance day", estDays: 1, criteria: [2, 3] },
    ],
  },
  {
    match: /print|block|textile|fabric|cloth|runner|cushion|weav|handloom|embroider|chikan|pott|terracotta|clay|craft/i,
    title: "Handmade craft order",
    artFormIds: ["block-print"],
    onSite: false,
    estDays: 10,
    feeInr: 14000,
    criteria: [
      "A single sample piece is approved before the full order is made.",
      "Made by hand using the traditional technique and materials of the craft.",
      "The full quantity is delivered in the agreed sizes.",
      "Pieces pass a simple durability check (for fabric: colour does not run after a cold wash).",
    ],
    milestones: [
      { title: "Sample piece", estDays: 4, criteria: [0, 1] },
      { title: "Full order and checks", estDays: 6, criteria: [2, 3] },
    ],
  },
];

const FALLBACK: Template = {
  match: /.*/,
  title: "Regional art commission",
  artFormIds: [],
  onSite: false,
  estDays: 5,
  feeInr: 8000,
  criteria: [
    "A first draft or sample is shared and approved before the final piece.",
    "The work follows the traditional style of the chosen art form.",
    "Final work is delivered by the agreed date.",
  ],
  milestones: [
    { title: "Draft or sample", estDays: 2, criteria: [0, 1] },
    { title: "Final delivery", estDays: 3, criteria: [2] },
  ],
};

/** If the employer named a specific form (e.g. "Madhubani"), use it instead of the template default. */
function namedForms(raw: string, category?: string) {
  const lower = raw.toLowerCase();
  return ART_FORMS.filter((f) => (!category || f.category === category) && lower.includes(f.name.toLowerCase().split(" ")[0])).map((f) => f.id);
}

export function buildDraft(raw: string) {
  const t = TEMPLATES.find((x) => x.match.test(raw)) ?? FALLBACK;
  const cat = ART_FORMS.find((f) => f.id === t.artFormIds[0])?.category;
  const named = namedForms(raw, cat);
  return { ...t, artFormIds: named.length ? named : t.artFormIds };
}

export function draftBriefStream(raw: string, delayMs = 18): ReadableStream<Uint8Array> {
  const t = buildDraft(raw);
  const enc = new TextEncoder();
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  return new ReadableStream({
    async start(ctrl) {
      const send = (e: DraftBriefEvent) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
      send({ type: "title", title: t.title });
      const ids: string[] = [];
      for (const [i, text] of t.criteria.entries()) {
        const id = `dc${i + 1}`;
        ids.push(id);
        send({ type: "criterion_start", id });
        for (const word of text.split(/(?<=\s)/)) {
          send({ type: "criterion_delta", id, text: word });
          await sleep(delayMs);
        }
        send({ type: "criterion_end", id });
        await sleep(delayMs * 4);
      }
      t.milestones.forEach((m, i) => {
        const milestone: Milestone = {
          id: `dm${i + 1}`,
          title: m.title,
          estDays: m.estDays,
          criterionIds: m.criteria.map((c) => ids[c]),
          status: "todo",
        };
        send({ type: "milestone", milestone });
      });
      send({ type: "meta", artFormIds: t.artFormIds, estDays: t.estDays, suggestedFeeInr: t.feeInr, onSite: t.onSite });
      send({ type: "done" });
      ctrl.close();
    },
  });
}
