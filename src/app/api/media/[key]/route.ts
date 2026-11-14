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
    `SELECT id FROM account_state WHERE photo=$1 AND suspended=0
     UNION ALL SELECT w.id FROM works w JOIN account_state a ON a.id=w.artist WHERE w.url='/api/media/' || $1 AND a.suspended=0
     UNION ALL SELECT id FROM commission_state WHERE output=$1 AND ((paused=0 AND status='done' AND published=1) OR customer=$2 OR artist=$2)
     UNION ALL SELECT c.id FROM commission_state c WHERE c.reference=$1 AND
       ((c.paused=0 AND c.status<>'progress') OR c.customer=$2 OR c.artist=$2 OR EXISTS(SELECT 1 FROM proposals p WHERE p.commission=c.id AND p.artist=$2))
     UNION ALL SELECT e.id FROM commission_events e JOIN commissions c ON c.id=e.commission WHERE e.output=$1 AND $2<>'' AND (c.customer=$2 OR e.artist=$2)`,
    [key, user?.id ?? ""],
  );
  return readable.length
    ? mediaResponse(key)
    : new Response(null, { status: 404 });
}
