import "server-only";
import { query } from "./db";
import { commissionColumns, proposals } from "./market";
import type { Commission } from "@/contract/schemas";
export interface HistoryItem extends Commission {
  unread: number;
  proposal_quote: number | null;
  proposal_created: number | null;
  proposal_status: string | null;
}
export interface HistoryEvent {
  id: string; kind: string; detail: string; created: number; actor_name: string;
  artist: string; quote: number | null; output: string;
}
export interface Message {
  id: string; sender: string; artist: string; body: string; created: number; sender_name: string;
}
const participant = `(c.customer=$1 OR c.artist=$1 OR EXISTS(SELECT 1 FROM proposals p WHERE p.commission=c.id AND p.artist=$1))`;
const unread = `(SELECT COUNT(*) FROM commission_events e WHERE e.commission=c.id AND e.actor<>$1
  AND (e.artist='' OR e.artist=$1 OR c.customer=$1)
  AND e.created>COALESCE((SELECT last_seen FROM history_reads WHERE account=$1 AND commission=c.id),0))
  + (SELECT COUNT(*) FROM messages m WHERE m.commission=c.id AND m.sender<>$1 AND (m.artist=$1 OR c.customer=$1)
  AND m.created>COALESCE((SELECT last_seen FROM history_reads WHERE account=$1 AND commission=c.id),0))`;

/** Pass only the ID returned by viewer(), never an ID from a request. */
export function history(viewerId: string) {
  return query<HistoryItem>(`SELECT ${commissionColumns},
    CASE WHEN c.customer=$1 OR c.artist=$1 OR (c.paused=0 AND c.status='done' AND c.published=1) THEN c.output ELSE '' END AS output,
    (${unread}) AS unread,
    (SELECT p.quote FROM proposals p WHERE p.commission=c.id AND p.artist=$1) AS proposal_quote,
    (SELECT p.created FROM proposals p WHERE p.commission=c.id AND p.artist=$1) AS proposal_created,
    (SELECT p.status FROM proposals p WHERE p.commission=c.id AND p.artist=$1) AS proposal_status
    FROM commission_state c JOIN accounts a ON a.id=c.customer LEFT JOIN accounts b ON b.id=c.artist
    WHERE ${participant} ORDER BY c.updated DESC,c.created DESC,c.id`, [viewerId]);
}
export async function unreadCount(viewerId: string) {
  const [row] = await query<{ total: number }>(`SELECT COALESCE(SUM(${unread}),0) AS total FROM commissions c WHERE ${participant}`, [viewerId]);
  return Number(row?.total ?? 0);
}
export async function historyDetail(id: string, viewerId: string) {
  const [commission] = await query<Commission>(`SELECT ${commissionColumns},
    CASE WHEN c.customer=$1 OR c.artist=$1 OR (c.paused=0 AND c.status='done' AND c.published=1) THEN c.output ELSE '' END AS output
    FROM commission_state c JOIN accounts a ON a.id=c.customer LEFT JOIN accounts b ON b.id=c.artist
    WHERE c.id=$2 AND ${participant}`, [viewerId, id]);
  if (!commission) return undefined;
  const [offers, events, messages] = await Promise.all([
    proposals(id, viewerId),
    query<HistoryEvent>(`SELECT e.id,e.kind,e.detail,e.created,e.artist,e.quote,e.output,a.name AS actor_name
      FROM commission_events e JOIN accounts a ON a.id=e.actor WHERE e.commission=$1
      AND (e.artist='' OR e.artist=$2 OR $3=$2) ORDER BY e.created,e.id`, [id, viewerId, commission.customer]),
    query<Message>(`SELECT m.id,m.sender,m.artist,m.body,m.created,a.name AS sender_name
      FROM messages m JOIN accounts a ON a.id=m.sender WHERE m.commission=$1 AND (m.artist=$2 OR $3=$2)
      ORDER BY m.created,m.id`, [id, viewerId, commission.customer]),
  ]);
  return { commission, proposals: offers, events, messages };
}
