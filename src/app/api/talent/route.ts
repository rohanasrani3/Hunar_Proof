import { artists } from "@/server/market";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return Response.json(
    await artists({
      form: params.get("form") ?? params.get("artFormId") ?? "",
      category: params.get("category") ?? "",
    }),
  );
}
