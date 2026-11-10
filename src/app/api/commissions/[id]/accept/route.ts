import { AcceptInput } from "@/contract/schemas";
import { body, handle } from "@/server/http";
import { acceptCommission } from "@/server/mockStore";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => acceptCommission(id, await body(req, AcceptInput)));
}
