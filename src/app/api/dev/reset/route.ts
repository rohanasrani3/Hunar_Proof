import { handle } from "@/server/http";
import { resetDb } from "@/server/mockStore";

/** Mock-only: restore seed data. The real backend should not implement this. */
export async function POST() {
  if (process.env.NEXT_PUBLIC_API_MODE === "live") {
    return Response.json({ error: "Disabled in live mode" }, { status: 404 });
  }
  return handle(() => {
    resetDb();
    return { ok: true };
  });
}
