import { DraftSpecInput } from "@/contract/schemas";
import { draftSpecStream } from "@/server/draftSpecMock";

export async function POST(req: Request) {
  const parsed = DraftSpecInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }
  return new Response(draftSpecStream(parsed.data.rawRequest), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
