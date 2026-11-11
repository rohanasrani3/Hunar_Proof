import { viewer } from "@/server/auth";
import { query } from "@/server/db";
import { mediaResponse } from "@/server/media";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|mp3|mp4|wav)$/.test(key))
    return new Response(null, { status: 404 });
  const user = await viewer();
  const readable = await query(
    "SELECT id FROM account_state WHERE photo=$1 AND suspended=0 UNION ALL SELECT id FROM commission_state WHERE output=$1 AND ((paused=0 AND status='done' AND published=1) OR customer=$2 OR artist=$2)",
    [key, user?.id ?? ""],
  );
  return readable.length
    ? mediaResponse(key)
    : new Response(null, { status: 404 });
}
