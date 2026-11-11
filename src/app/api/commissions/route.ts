import { commissions } from "@/server/market";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return Response.json(
    await commissions({
      form: params.get("form") ?? "",
      category: params.get("category") ?? "",
      status: params.get("status") ?? "",
    }),
  );
}
