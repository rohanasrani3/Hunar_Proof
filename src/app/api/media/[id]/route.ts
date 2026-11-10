import { getBlob, NotFound } from "@/server/mockStore";

/** Mock-only file server. The real backend should hand out storage/CDN URLs instead. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const b = getBlob(id);
    return new Response(new Blob([b.bytes as BlobPart], { type: b.type }), {
      headers: { "Content-Type": b.type, "Cache-Control": "private, max-age=3600" },
    });
  } catch (e) {
    if (e instanceof NotFound) return Response.json({ error: e.message }, { status: 404 });
    throw e;
  }
}
