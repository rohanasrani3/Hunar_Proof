import { CreateReviewInput } from "@/contract/schemas";
import { body, handle } from "@/server/http";
import { createReview } from "@/server/mockStore";

export async function POST(req: Request) {
  return handle(async () => createReview(await body(req, CreateReviewInput)), 201);
}
