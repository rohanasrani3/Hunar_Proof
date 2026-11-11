import "server-only";
import { notFound } from "next/navigation";
import { viewer } from "./auth";
import { query } from "./db";

export async function requireAdmin() {
  const user = await viewer();
  if (user?.role !== "admin") notFound();
  return user;
}
export async function moderationAccounts() {
  await requireAdmin();
  return query<{
    id: string;
    name: string;
    username: string;
    role: string;
    suspended: number;
    active: number;
  }>(
    `SELECT a.id,a.name,a.username,a.effective_role AS role,a.suspended,
    (SELECT CAST(COUNT(*) AS INTEGER) FROM commissions c WHERE (c.customer=a.id OR c.artist=a.id) AND c.status<>'done') AS active
    FROM account_state a WHERE a.sample=0 ORDER BY a.name,a.username`,
  );
}
export async function moderationHistory() {
  await requireAdmin();
  return query<{
    sequence: number;
    actor: string;
    target: string;
    reason: string;
    created: number;
    suspended: number;
  }>(
    `SELECT e.sequence,a.username AS actor,t.username AS target,e.reason,e.created,e.suspended
    FROM moderation_events e JOIN accounts a ON a.id=e.actor JOIN accounts t ON t.id=e.target ORDER BY e.sequence DESC`,
  );
}
export async function moderationDashboard(id: string) {
  await requireAdmin();
  const [person] = await query<{
    name: string;
    username: string;
    role: string;
    company: string;
    links: string;
    suspended: number;
    sample: number;
    session_version: number;
  }>(
    "SELECT name,username,effective_role AS role,company,links,suspended,sample,session_version FROM account_state WHERE id=$1",
    [id],
  );
  if (!person) notFound();
  const jobs = await query<{
    id: string;
    title: string;
    status: string;
    paused: number;
  }>(
    "SELECT id,title,status,paused FROM commission_state WHERE customer=$1 OR artist=$1 ORDER BY created DESC",
    [id],
  );
  return { person, jobs };
}
