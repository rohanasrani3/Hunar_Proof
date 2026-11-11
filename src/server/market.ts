import { query } from "./db";
import type { Account, Commission, Form, Work } from "@/contract/schemas";
type Filters = { category?: string; form?: string; status?: string };
export const forms = () =>
  query<Form>("SELECT * FROM forms ORDER BY category,name");
export function commissions(filters: Filters = {}, id = "", viewerId = "") {
  return query<Commission>(
    `SELECT c.paused,c.id,c.title,c.brief,c.form,c.fee,c.status,c.customer,c.artist,c.sample,c.published,a.name AS customer_name,a.username AS customer_username,
    CASE WHEN (c.paused=0 AND c.status='done' AND c.published=1) OR c.customer=$5 OR c.artist=$5 THEN c.output ELSE '' END AS output
    FROM commission_state c JOIN accounts a ON a.id=c.customer JOIN forms f ON f.id=c.form
    WHERE (c.paused=0 OR ($4<>'' AND (c.customer=$5 OR c.artist=$5 OR EXISTS(SELECT 1 FROM account_state v WHERE v.id=$5 AND v.effective_role='admin' AND v.suspended=0)))) AND ($1='' OR f.category=$1) AND ($2='' OR c.form=$2) AND ($3='' OR c.status=$3) AND ($4='' OR c.id=$4) ORDER BY c.created DESC,c.id`,
    [
      filters.category ?? "",
      filters.form ?? "",
      filters.status ?? "",
      id,
      viewerId,
    ],
  );
}
export type Artist = Pick<
  Account,
  "id" | "username" | "name" | "photo" | "company" | "sample"
> & { completed: number; cover_url: string | null; form_ids: string | null };
export function artists(filters: Filters = {}) {
  return query<Artist>(
    `SELECT a.id,a.username,a.name,a.company,a.photo,a.sample,
    (SELECT w.url FROM works w WHERE w.artist=a.id AND ($2='' OR w.form=$2) AND (lower(w.url) LIKE '%.png' OR lower(w.url) LIKE '%.jpg' OR lower(w.url) LIKE '%.jpeg' OR lower(w.url) LIKE '%.webp' OR w.url LIKE '/seed/%.svg') ORDER BY w.title,w.id LIMIT 1) AS cover_url,
    (SELECT string_agg(f.id,',') FROM forms f WHERE EXISTS(SELECT 1 FROM works w WHERE w.artist=a.id AND w.form=f.id)
     OR EXISTS(SELECT 1 FROM commissions c WHERE c.artist=a.id AND c.form=f.id AND c.status='done' AND c.sample=0)) AS form_ids,
    (SELECT CAST(COUNT(*) AS INTEGER) FROM commissions c JOIN forms f ON f.id=c.form WHERE c.artist=a.id AND c.status='done' AND c.sample=0
     AND ($1='' OR f.category=$1) AND ($2='' OR f.id=$2)) AS completed
    FROM account_state a WHERE a.effective_role='artist' AND a.suspended=0 AND (($1='' AND $2='') OR EXISTS(
     SELECT 1 FROM forms f WHERE ($1='' OR f.category=$1) AND ($2='' OR f.id=$2) AND
     (EXISTS(SELECT 1 FROM works w WHERE w.form=f.id AND w.artist=a.id) OR EXISTS(SELECT 1 FROM commissions c WHERE c.form=f.id AND c.artist=a.id AND c.status='done'))))
    ORDER BY a.sample,completed DESC,a.name,a.id`,
    [filters.category ?? "", filters.form ?? ""],
  );
}
export const works = (artist: string) =>
  query<Work>(
    "SELECT id,title,url,form FROM works WHERE artist=$1 ORDER BY title",
    [artist],
  );
export const publicProfile = async (username: string) =>
  (
    await query<
      Pick<
        Account,
        | "id"
        | "role"
        | "name"
        | "username"
        | "sample"
        | "links"
        | "company"
        | "photo"
      >
    >(
      "SELECT id,role,name,username,sample,links,company,photo FROM account_state WHERE username=$1 AND effective_role<>'admin' AND suspended=0",
      [username],
    )
  )[0];
export const proposals = (id: string, user: string) =>
  query<{ id: string; message: string; name: string; username: string }>(
    `SELECT p.id,p.message,a.name,a.username FROM proposals p JOIN accounts a ON a.id=p.artist AND a.id IN (SELECT id FROM account_state WHERE suspended=0) JOIN commissions c ON c.id=p.commission WHERE c.id=$1 AND (c.customer=$2 OR p.artist=$2) ORDER BY p.id`,
    [id, user],
  );
export const publishedWorks = (artist: string) =>
  query<{ id: string; title: string; output: string }>(
    "SELECT id,title,output FROM commission_state WHERE paused=0 AND artist=$1 AND status='done' AND published=1 ORDER BY created DESC",
    [artist],
  );
