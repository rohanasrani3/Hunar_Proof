import { handle } from "@/server/http";
import { getTalent } from "@/server/mockStore";

export async function GET(req: Request) {
  const skill = new URL(req.url).searchParams.get("skill") ?? undefined;
  return handle(() => getTalent(skill));
}
