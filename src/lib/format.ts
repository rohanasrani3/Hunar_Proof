const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** "12 Nov 2026" */
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Placeholders like "[Pilot NGO]" are seed data — flag them in the UI. */
export const isPlaceholder = (s?: string) => !!s && /^\[.*\]$/.test(s.trim());
