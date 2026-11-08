import { ImageResponse } from "next/og";
import { getServerApi } from "@/lib/server-api";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "FirstShip verified work sample";

/** Link-preview card for LinkedIn / WhatsApp when a learner shares their proof page. */
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await (await getServerApi()).work.get(slug);
  const passed = w.review.results.filter((r) => r.verdict === "pass").length;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F6F3EC", color: "#1D1B17", padding: 72 }}>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, color: "#6B6458", fontWeight: 600 }}>
          FIRSTSHIP · VERIFIED WORK SAMPLE
        </div>
        <div style={{ display: "flex", fontSize: 64, lineHeight: 1.08, fontWeight: 700, maxWidth: 1000 }}>{w.task.title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 700 }}>{w.learner.name}</span>
            <span style={{ color: "#6B6458" }}>for {w.org.name} · mentored by {w.mentor.name}</span>
          </div>
          <div style={{ display: "flex", background: "#2E3A8C", color: "#fff", borderRadius: 999, padding: "16px 28px", fontWeight: 600 }}>
            ✓ {passed}/{w.task.criteria.length} criteria passed
          </div>
        </div>
      </div>
    ),
    size,
  );
}
