/**
 * Shared art-form taxonomy. Commissions, people and filters refer to forms
 * by `id`. Add forms here (never rename an id once data uses it).
 */
export const CATEGORIES = {
  painting: { en: "Folk painting", hi: "लोक चित्रकला" },
  music: { en: "Folk & classical music", hi: "लोक और शास्त्रीय संगीत" },
  dance: { en: "Dance & performance", hi: "नृत्य और प्रदर्शन" },
  craft: { en: "Crafts & textiles", hi: "शिल्प और वस्त्र" },
} as const;

export type Category = keyof typeof CATEGORIES;

export type ArtForm = { id: string; name: string; hi: string; category: Category; region: string };

export const ART_FORMS: ArtForm[] = [
  // Folk painting
  { id: "warli", name: "Warli", hi: "वारली", category: "painting", region: "Maharashtra" },
  { id: "madhubani", name: "Madhubani", hi: "मधुबनी", category: "painting", region: "Bihar" },
  { id: "gond", name: "Gond", hi: "गोंड", category: "painting", region: "Madhya Pradesh" },
  { id: "pattachitra", name: "Pattachitra", hi: "पट्टचित्र", category: "painting", region: "Odisha" },
  { id: "kalamkari", name: "Kalamkari", hi: "कलमकारी", category: "painting", region: "Andhra Pradesh" },
  // Music
  { id: "marathi-folk", name: "Marathi folk song", hi: "मराठी लोकगीत", category: "music", region: "Maharashtra" },
  { id: "baul", name: "Baul", hi: "बाउल", category: "music", region: "West Bengal" },
  { id: "hindustani", name: "Hindustani classical", hi: "हिंदुस्तानी शास्त्रीय", category: "music", region: "North India" },
  { id: "carnatic", name: "Carnatic", hi: "कर्नाटक संगीत", category: "music", region: "South India" },
  // Dance & performance
  { id: "lavani", name: "Lavani", hi: "लावणी", category: "dance", region: "Maharashtra" },
  { id: "kathak", name: "Kathak", hi: "कथक", category: "dance", region: "North India" },
  { id: "bharatanatyam", name: "Bharatanatyam", hi: "भरतनाट्यम", category: "dance", region: "Tamil Nadu" },
  { id: "kathputli", name: "Kathputli puppetry", hi: "कठपुतली", category: "dance", region: "Rajasthan" },
  // Crafts & textiles
  { id: "block-print", name: "Bagru block print", hi: "बगरू ब्लॉक प्रिंट", category: "craft", region: "Rajasthan" },
  { id: "terracotta", name: "Terracotta pottery", hi: "टेराकोटा मिट्टी के बर्तन", category: "craft", region: "West Bengal" },
  { id: "handloom", name: "Handloom weaving", hi: "हथकरघा बुनाई", category: "craft", region: "Pan-India" },
  { id: "chikankari", name: "Chikankari embroidery", hi: "चिकनकारी कढ़ाई", category: "craft", region: "Uttar Pradesh" },
];

const byId = new Map(ART_FORMS.map((f) => [f.id, f]));

export const artForm = (id: string): ArtForm | undefined => byId.get(id);
export const artFormName = (id: string, lang: "en" | "hi" = "en") => {
  const f = byId.get(id);
  return f ? (lang === "hi" ? f.hi : f.name) : id;
};
