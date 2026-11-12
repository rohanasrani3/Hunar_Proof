/**
 * Placeholder cover art for SAMPLE commissions only. Real briefs show only
 * published media or the form label (AGENTS.md), so never call this for a
 * record with sample=0. Files come from scripts/generate-sample-media.mjs.
 */
const OVERRIDES: Record<string, string> = {
  warli: "/seed/warli-final.svg",
  "block-print": "/seed/blockprint-sample.svg",
};

const GENERATED = new Set([
  "madhubani",
  "gond",
  "pattachitra",
  "kalamkari",
  "marathi-folk",
  "baul",
  "hindustani",
  "carnatic",
  "lavani",
  "kathak",
  "bharatanatyam",
  "kathputli",
  "terracotta",
  "handloom",
  "chikankari",
]);

export function sampleCover(form: string): string | undefined {
  return OVERRIDES[form] ?? (GENERATED.has(form) ? `/seed/forms/${form}.svg` : undefined);
}
