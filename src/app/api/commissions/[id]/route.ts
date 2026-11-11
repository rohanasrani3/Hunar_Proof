import { commissions } from "@/server/market";
import { viewer } from "@/server/auth";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const [user, { id }] = await Promise.all([viewer(), params]);
  const [item] = await commissions({}, id, user?.id);
  return item
    ? Response.json(item, { headers: { "Cache-Control": "private, no-store" } })
    : new Response(null, { status: 404 });
}
