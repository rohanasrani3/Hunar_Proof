import { handle } from "@/server/http";
import { confirmMatch } from "@/server/mockStore";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(() => confirmMatch(id));
}
