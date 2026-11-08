import { handle } from "@/server/http";
import { getImpact } from "@/server/mockStore";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(() => getImpact());
}
