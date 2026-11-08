import { handle } from "@/server/http";
import { listMatches } from "@/server/mockStore";

export async function GET(req: Request) {
  const taskId = new URL(req.url).searchParams.get("taskId") ?? undefined;
  return handle(() => listMatches(taskId));
}
