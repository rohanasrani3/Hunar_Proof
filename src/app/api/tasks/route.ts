import { CreateTaskInput } from "@/contract/schemas";
import { body, handle } from "@/server/http";
import { createTask, listTasks } from "@/server/mockStore";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  return handle(() =>
    listTasks({
      orgId: q.get("orgId") ?? undefined,
      learnerId: q.get("learnerId") ?? undefined,
      mentorId: q.get("mentorId") ?? undefined,
      status: q.get("status") ?? undefined,
    }),
  );
}

export async function POST(req: Request) {
  return handle(async () => createTask(await body(req, CreateTaskInput)), 201);
}
