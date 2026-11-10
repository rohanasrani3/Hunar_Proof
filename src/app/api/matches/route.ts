import { handle } from "@/server/http";
import { listMatches } from "@/server/mockStore";

export async function GET(req: Request) {
  const commissionId = new URL(req.url).searchParams.get("commissionId") ?? undefined;
  return handle(() => listMatches(commissionId));
}
