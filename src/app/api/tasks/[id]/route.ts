import { UpdateTaskInput } from "@/contract/schemas";
import { body, handle } from "@/server/http";
import { getTask, listReviews, listSubmissions, updateTask } from "@/server/mockStore";

type Ctx = { params: Promise<{ id: string }> };

/** Returns the task plus its submissions and reviews (TaskDetail). */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(() => ({ task: getTask(id), submissions: listSubmissions(id), reviews: listReviews(id) }));
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => updateTask(id, await body(req, UpdateTaskInput)));
}
