import { handle } from "@/server/http";
import { getTalent } from "@/server/mockStore";

export async function GET(req: Request) {
  const artForm = new URL(req.url).searchParams.get("artForm") ?? undefined;
  return handle(() => getTalent(artForm));
}
