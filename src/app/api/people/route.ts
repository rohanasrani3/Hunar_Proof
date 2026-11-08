import { handle } from "@/server/http";
import { listPeople } from "@/server/mockStore";

/** Used by the demo role switcher and the matching view. */
export async function GET(req: Request) {
  const role = new URL(req.url).searchParams.get("role") ?? undefined;
  return handle(() => listPeople(role));
}
