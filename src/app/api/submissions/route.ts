import { CreateSubmissionInput } from "@/contract/schemas";
import { body, handle } from "@/server/http";
import { createSubmission } from "@/server/mockStore";

export async function POST(req: Request) {
  return handle(async () => createSubmission(await body(req, CreateSubmissionInput)), 201);
}
