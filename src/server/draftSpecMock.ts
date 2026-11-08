/**
 * Mock of Teammate B's spec-drafting agent. Picks canned criteria by keyword
 * and streams them word-by-word so the co-editing UI can be built now.
 * The real agent must emit the same DraftSpecEvent sequence.
 */
import type { DraftSpecEvent, Milestone } from "@/contract/schemas";

type Template = { match: RegExp; title: string; skills: string[]; criteria: string[] };

const TEMPLATES: Template[] = [
  {
    match: /form|sign.?up|register/i,
    title: "Online sign-up form",
    skills: ["React", "Forms"],
    criteria: [
      "Form asks for the details the NGO needs and validates each field.",
      "Submissions are saved and staff can see them in one list.",
      "Staff can download all sign-ups as a spreadsheet.",
    ],
  },
  {
    match: /whatsapp|sms|message/i,
    title: "Automatic WhatsApp confirmations",
    skills: ["Twilio", "Node.js"],
    criteria: [
      "Each person gets a WhatsApp confirmation within one minute.",
      "Failed messages are logged and retried once.",
    ],
  },
  {
    match: /receipt|pdf|invoice|certificate/i,
    title: "Automatic PDF documents",
    skills: ["Python", "PDF"],
    criteria: [
      "A PDF is generated with the NGO logo and the correct details.",
      "The PDF is emailed to the recipient within five minutes.",
      "Document numbers are sequential and never repeat.",
    ],
  },
  {
    match: /slow|fast|speed|load/i,
    title: "Faster website on phones",
    skills: ["Performance", "HTML", "CSS"],
    criteria: [
      "Home page Lighthouse mobile performance score is 90 or higher.",
      "Images are compressed and lazy-loaded without visible quality loss.",
      "No existing page or link breaks.",
    ],
  },
];

const ALWAYS = ["Loads fast on a basic Android phone over 3G.", "Works in both Hindi and English."];

const FALLBACK: Template = {
  match: /.*/,
  title: "Website improvement",
  skills: ["HTML", "CSS"],
  criteria: ["The change described in the request works as the NGO expects."],
};

export function buildDraft(raw: string) {
  const hits = TEMPLATES.filter((t) => t.match.test(raw));
  const picked = hits.length ? hits : [FALLBACK];
  const criteria = [...picked.flatMap((t) => t.criteria), ...ALWAYS];
  const skills = [...new Set(picked.flatMap((t) => t.skills))];
  return { title: picked.map((t) => t.title).join(" + "), criteria, skills };
}

export function draftSpecStream(raw: string, delayMs = 18): ReadableStream<Uint8Array> {
  const { title, criteria, skills } = buildDraft(raw);
  const enc = new TextEncoder();
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  return new ReadableStream({
    async start(ctrl) {
      const send = (e: DraftSpecEvent) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
      send({ type: "title", title });
      const ids: string[] = [];
      for (const [i, text] of criteria.entries()) {
        const id = `dc${i + 1}`;
        ids.push(id);
        send({ type: "criterion_start", id });
        for (const word of text.split(/(?<=\s)/)) {
          send({ type: "criterion_delta", id, text: word });
          await sleep(delayMs);
        }
        send({ type: "criterion_end", id, testable: true });
        await sleep(delayMs * 4);
      }
      const chunk = Math.ceil(ids.length / 3);
      for (let m = 0; m < 3 && m * chunk < ids.length; m++) {
        const milestone: Milestone = {
          id: `dm${m + 1}`,
          title: `Milestone ${m + 1}`,
          estDays: m === 2 ? 1 : 2,
          criterionIds: ids.slice(m * chunk, (m + 1) * chunk),
          status: "todo",
        };
        send({ type: "milestone", milestone });
      }
      send({ type: "meta", skills, estHours: criteria.length * 3 });
      send({ type: "done" });
      ctrl.close();
    },
  });
}
