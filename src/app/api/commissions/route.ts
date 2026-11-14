import { commissions } from "@/server/market";
import { viewer } from "@/server/auth";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const user = await viewer();
  return Response.json(
    await commissions({
      form: params.get("form") ?? "",
      category: params.get("category") ?? "",
      status: params.get("status") ?? "",
    }, "", user?.id),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
