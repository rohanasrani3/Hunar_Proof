import { handle } from "@/server/http";
import { getPortfolio } from "@/server/mockStore";

export async function GET(_req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle: h } = await params;
  return handle(() => getPortfolio(h));
}
