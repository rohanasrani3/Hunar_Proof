import { DraftBriefInput } from "@/contract/schemas";
import { draftBriefStream } from "@/server/draftBriefMock";

export async function POST(req: Request) {
  const parsed = DraftBriefInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }
  return new Response(draftBriefStream(parsed.data.rawRequest), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
