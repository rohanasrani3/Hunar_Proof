import { CreateCommissionInput } from "@/contract/schemas";
import { body, handle } from "@/server/http";
import { createCommission, listCommissions } from "@/server/mockStore";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  return handle(() =>
    listCommissions({
      employerId: q.get("employerId") ?? undefined,
      artistId: q.get("artistId") ?? undefined,
      guruId: q.get("guruId") ?? undefined,
      status: q.get("status") ?? undefined,
    }),
  );
}

export async function POST(req: Request) {
  return handle(async () => createCommission(await body(req, CreateCommissionInput)), 201);
}
