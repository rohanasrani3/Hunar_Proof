export const OUTPUT_LABELS: Record<string, [string, string]> = {
  audio: ["Audio recording", "ऑडियो रिकॉर्डिंग"],
  video: ["Video", "वीडियो"],
  live: ["Live performance", "लाइव प्रस्तुति"],
  physical: ["Physical artwork", "भौतिक कलाकृति"],
  image: ["Digital image", "डिजिटल चित्र"],
  other: ["Something else", "कुछ और"],
};

export const rupees = (value: number) => "₹" + Number(value).toLocaleString("en-IN");
export const mediaUrl = (key: string) => key.startsWith("/seed/") ? key : "/api/media/" + encodeURIComponent(key);
export function deadlineDate(value: string, hi: boolean) {
  if (!value) return hi ? "निर्धारित नहीं" : "Not specified";
  return new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value + "T00:00:00Z"));
}
export function activityDate(value: number, hi: boolean) {
  if (!Number(value)) return hi ? "नमूना रिकॉर्ड" : "Sample record";
  return new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(Number(value));
}
