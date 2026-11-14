import "server-only";
import { query } from "./db";
import type { Account, Commission, Form, Proposal, Work } from "@/contract/schemas";
type Filters = { category?: string; form?: string; status?: string };
export const forms = () => query<Form>("SELECT * FROM forms ORDER BY category,name");

/** Reused only by server-owned queries. The output itself always needs an access projection. */
export const commissionColumns = `c.paused,c.id,c.title,c.brief,c.form,c.fee,c.original_fee,c.status,c.customer,c.artist,c.sample,c.published,
 c.output_type,c.reference,c.deadline,c.created,c.updated,c.selected_at,c.submitted_at,c.accepted_at,
 a.name AS customer_name,a.username AS customer_username,a.contact AS customer_contact,
 b.name AS artist_name,b.username AS artist_username,b.contact AS artist_contact`;

export function commissions(filters: Filters = {}, id = "", viewerId = "") {
  return query<Commission>(
    `SELECT ${commissionColumns},
    CASE WHEN (c.paused=0 AND c.status='done' AND c.published=1) OR c.customer=$5 OR c.artist=$5 THEN c.output ELSE '' END AS output
    FROM commission_state c JOIN accounts a ON a.id=c.customer LEFT JOIN accounts b ON b.id=c.artist JOIN forms f ON f.id=c.form
    WHERE (c.paused=0 OR ($4<>'' AND (c.customer=$5 OR c.artist=$5)))
      AND (c.status<>'progress' OR ($4<>'' AND (c.customer=$5 OR c.artist=$5)))
      AND ($4<>'' OR $5='' OR (c.customer<>$5 AND COALESCE(c.artist,'')<>$5))
      AND ($1='' OR f.category=$1) AND ($2='' OR c.form=$2) AND ($3='' OR c.status=$3) AND ($4='' OR c.id=$4)
    ORDER BY c.created DESC,c.id`,
    [filters.category ?? "", filters.form ?? "", filters.status ?? "", id, viewerId],
  );
}

export type Artist = Pick<Account, "id" | "username" | "name" | "photo" | "company" | "sample" | "contact" | "bio"> & {
  completed: number; cover_url: string | null; form_ids: string | null;
};
export function artists(filters: Filters = {}) {
  return query<Artist>(
    `SELECT a.id,a.username,a.name,a.company,a.photo,a.sample,a.contact,a.bio,
    (SELECT w.url FROM works w WHERE w.artist=a.id AND ($2='' OR w.form=$2) AND (lower(w.url) LIKE '%.png' OR lower(w.url) LIKE '%.jpg' OR lower(w.url) LIKE '%.jpeg' OR lower(w.url) LIKE '%.webp' OR w.url LIKE '/seed/%.svg') ORDER BY w.title,w.id LIMIT 1) AS cover_url,
    (SELECT string_agg(f.id,',') FROM forms f WHERE EXISTS(SELECT 1 FROM works w WHERE w.artist=a.id AND w.form=f.id)
     OR EXISTS(SELECT 1 FROM commissions c WHERE c.artist=a.id AND c.form=f.id AND c.status='done' AND c.output<>'')) AS form_ids,
    (SELECT CAST(COUNT(*) AS INTEGER) FROM commissions c JOIN forms f ON f.id=c.form WHERE c.artist=a.id AND c.status='done' AND c.output<>''
     AND ($1='' OR f.category=$1) AND ($2='' OR f.id=$2)) AS completed
    FROM account_state a WHERE a.effective_role='artist' AND a.suspended=0 AND (($1='' AND $2='') OR EXISTS(
     SELECT 1 FROM forms f WHERE ($1='' OR f.category=$1) AND ($2='' OR f.id=$2) AND
     (EXISTS(SELECT 1 FROM works w WHERE w.form=f.id AND w.artist=a.id) OR EXISTS(SELECT 1 FROM commissions c WHERE c.form=f.id AND c.artist=a.id AND c.status='done' AND c.output<>''))))
    ORDER BY completed DESC,a.name,a.id`,
    [filters.category ?? "", filters.form ?? ""],
  );
}
export const works = (artist: string) => query<Work>(
  "SELECT w.id,w.title,w.url,w.form FROM works w JOIN account_state a ON a.id=w.artist WHERE w.artist=$1 AND a.suspended=0 ORDER BY w.title,w.id", [artist],
);
export const publicProfile = async (username: string) => (
  await query<Pick<Account, "id" | "role" | "name" | "username" | "sample" | "links" | "company" | "photo" | "bio" | "contact">>(
    "SELECT id,role,name,username,sample,links,company,photo,bio,contact FROM account_state WHERE username=$1 AND effective_role<>'admin' AND suspended=0", [username],
  )
)[0];
export const proposals = (id: string, user: string) => query<Proposal>(
  `SELECT p.id,p.artist,p.message,p.quote,p.initial_quote,p.pricing,p.created,p.updated,p.status,a.name,a.username,a.contact
   FROM proposals p JOIN accounts a ON a.id=p.artist JOIN commissions c ON c.id=p.commission
   WHERE c.id=$1 AND (c.customer=$2 OR p.artist=$2) ORDER BY p.created,p.id`, [id, user],
);
export const publishedWorks = (artist: string) => query<{ id: string; title: string; output: string; form: string }>(
  "SELECT id,title,output,form FROM commission_state WHERE paused=0 AND artist=$1 AND status='done' AND published=1 AND output<>'' ORDER BY accepted_at DESC,created DESC", [artist],
);
