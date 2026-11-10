import { ImageResponse } from "next/og";
import { artFormName } from "@/contract/artForms";
import { getServerApi } from "@/lib/server-api";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Hunar Proof verified work";

/** Link-preview card for WhatsApp / LinkedIn when an artist shares their proof page. */
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await (await getServerApi()).work.get(slug);
  const passed = w.review.results.filter((r) => r.verdict === "pass").length;
  const forms = w.commission.artFormIds.map((id) => artFormName(id)).join(", ");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F6F3EC", color: "#1D1B17", padding: 72 }}>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, color: "#6B6458", fontWeight: 600 }}>
          HUNAR PROOF · VERIFIED {forms.toUpperCase()}
        </div>
        <div style={{ display: "flex", fontSize: 64, lineHeight: 1.08, fontWeight: 700, maxWidth: 1000 }}>{w.commission.title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 700 }}>{w.artist.name}</span>
            <span style={{ color: "#6B6458" }}>
              for {w.employer.name} · reviewed by {w.guru.name}
            </span>
          </div>
          <div style={{ display: "flex", background: "#2E3A8C", color: "#fff", borderRadius: 999, padding: "16px 28px", fontWeight: 600 }}>
            Verified · {passed}/{w.commission.criteria.length} criteria met
          </div>
        </div>
      </div>
    ),
    size,
  );
}
