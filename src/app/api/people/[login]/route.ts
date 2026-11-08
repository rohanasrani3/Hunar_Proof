import { handle } from "@/server/http";
import { getPortfolio } from "@/server/mockStore";

export async function GET(_req: Request, { params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  return handle(() => getPortfolio(login));
}
