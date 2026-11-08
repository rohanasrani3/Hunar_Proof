import { handle } from "@/server/http";
import { getWorkSample } from "@/server/mockStore";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return handle(() => getWorkSample(slug));
}
