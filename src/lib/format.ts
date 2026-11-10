const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const inrFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** "12 Nov 2026" */
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));

/** "₹18,000" — Indian digit grouping (₹1,80,000 for lakhs). */
export const formatInr = (n: number) => inrFmt.format(n);

export const initials = (name: string) =>
  name
    .replace(/^(Guru|Ustad|Shahir|Pandit)\s+/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
