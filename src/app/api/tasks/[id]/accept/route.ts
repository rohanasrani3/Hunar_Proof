import { AcceptInput } from "@/contract/schemas";
import { body, handle } from "@/server/http";
import { acceptTask } from "@/server/mockStore";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => acceptTask(id, await body(req, AcceptInput)));
}
