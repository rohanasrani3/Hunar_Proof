import { UpdateCommissionInput } from "@/contract/schemas";
import { body, handle } from "@/server/http";
import { getCommission, listReviews, listSubmissions, updateCommission } from "@/server/mockStore";

type Ctx = { params: Promise<{ id: string }> };

/** Returns the commission plus its submissions and reviews (CommissionDetail). */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(() => ({ commission: getCommission(id), submissions: listSubmissions(id), reviews: listReviews(id) }));
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => updateCommission(id, await body(req, UpdateCommissionInput)));
}
