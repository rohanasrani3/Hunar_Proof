"use server";
import { createHash, randomUUID } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signupSchema, profileSchema, commissionSchema, short, paragraph, web, category, password } from "@/contract/schemas";
import type { Account } from "@/contract/schemas";
import { z } from "zod";
import { query, transaction, type Query } from "./db";
import { viewer } from "./auth";
import { saveMedia, removeMedia } from "./media";
import { SOCIALS, socialKey } from "@/components/social-links";

const money = z.coerce.number().int().min(0).max(100000000);
const refresh = () => revalidatePath("/", "layout");
const currentSession = async (q: Query, user: Account) => (await q(
  "UPDATE accounts SET revision=revision WHERE id=$1 AND deleted=0 AND revision=$2 AND id IN (SELECT id FROM account_state WHERE suspended=0 AND sample=0 AND session_version=$3) RETURNING id", [user.id, user.revision, user.session_version],
)).length > 0;
async function event(q: Query, commission: string, actor: string, kind: string, now: number, artist = "", detail = "", quote: number | null = null, output = "") {
  await q("INSERT INTO commission_events(id,commission,actor,artist,kind,detail,created,quote,output) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [randomUUID(), commission, actor, artist, kind, detail, now, quote, output]);
}
async function resolveForm(q: Query, cat: string, name: string) {
  const label = name.normalize("NFKC").replace(/\s+/g, " ").trim();
  const id = cat + "-" + createHash("sha256").update(label.toLowerCase()).digest("hex");
  await q("INSERT INTO forms(id,category,name,hi) SELECT $1,$2,$3,$3 WHERE NOT EXISTS(SELECT 1 FROM forms WHERE category=$2 AND lower(name)=lower($3)) ON CONFLICT DO NOTHING", [id, cat, label]);
  const [form] = await q<{ id: string }>("SELECT id FROM forms WHERE category=$1 AND (lower(name)=lower($2) OR id=$3)", [cat, label, id]);
  return form?.id;
}
async function cleanup(key: string | null) {
  if (key) await removeMedia(key).catch(() => undefined);
}
function ownedMedia(url: string) {
  return /^\/api\/media\/([0-9a-f-]{36}\.(jpg|png|webp|mp3|wav|mp4))$/.exec(url)?.[1] ?? null;
}

export async function switchLanguage(data: FormData) {
  (await cookies()).set("kareghar-language", data.get("lang") === "hi" ? "hi" : "en", { sameSite: "lax", path: "/", maxAge: 31536000 });
  refresh();
}
export async function register(_: string, data: FormData) {
  const parsed = signupSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return "invalid";
  const { username, email, name, role, password } = parsed.data;
  const inserted = await query("INSERT INTO accounts(id,username,email,name,role,password_hash) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id", [randomUUID(), username, email, name, role, await hash(password)]);
  if (!inserted.length) return "taken";
  redirect(role === "artist" ? "/login?created=1&onboarding=artist" : "/login?created=1");
}
export async function updateProfile(_: string, data: FormData) {
  const user = await viewer();
  if (!user) return "denied";
  let extraLinks: string[];
  try {
    const parsed = JSON.parse(String(data.get("linksExtra") ?? "[]"));
    if (!Array.isArray(parsed) || !parsed.every((link) => typeof link === "string")) return "invalid";
    extraLinks = parsed;
  } catch { return "invalid"; }
  const socialLinks: string[] = [];
  for (const site of SOCIALS) {
    const url = String(data.get("social_" + site.key) ?? "").trim();
    if (url && socialKey(url) !== site.key) return "invalid";
    if (url) socialLinks.push(url);
  }
  const links = data.has("links") ? String(data.get("links") ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [...new Set([...socialLinks, ...extraLinks])];
  const schema = user.role === "admin" ? profileSchema.extend({ email: profileSchema.shape.email.or(z.literal("")) }) : profileSchema;
  const parsed = schema.safeParse({ ...Object.fromEntries(data), links });
  if (!parsed.success) return "invalid";
  const { name, email, company, bio, contact } = parsed.data;
  const photo = data.get("photo");
  let key: string | null = null;
  if (photo instanceof File && photo.size) { key = await saveMedia(photo, true); if (!key) return "file"; }
  const photoValue = key ?? (data.get("removePhoto") === "on" ? "" : null);
  try {
    const changed = await query("UPDATE accounts SET name=$1,email=$2,company=$3,links=$4,photo=COALESCE($5,photo),bio=$8,contact=$9 WHERE id=$6 AND id IN (SELECT id FROM account_state WHERE suspended=0 AND session_version=$7) RETURNING id",
      [name, email, company, JSON.stringify(parsed.data.links), photoValue, user.id, user.session_version, bio, contact]);
    if (!changed.length) { await cleanup(key); return "denied"; }
  } catch (error) {
    await cleanup(key);
    if (/unique|duplicate/i.test(String(error))) return "taken";
    throw error;
  }
  if (photoValue !== null && user.photo) await cleanup(user.photo);
  refresh(); return "saved";
}
export async function changePassword(_: string, data: FormData) {
  const user = await viewer(), parsed = password.safeParse(data.get("password"));
  if (!user || !parsed.success) return "invalid";
  const [row] = await query<{ password_hash: string }>("SELECT password_hash FROM accounts WHERE id=$1", [user.id]);
  const current = String(data.get("current") ?? "");
  if (!row?.password_hash || current.length > 128 || !(await verify(row.password_hash, current))) return "denied";
  const changed = await query("UPDATE accounts SET password_hash=$1,revision=revision+1 WHERE id=$2 AND id IN (SELECT id FROM account_state WHERE suspended=0 AND session_version=$3) RETURNING id", [await hash(parsed.data), user.id, user.session_version]);
  if (!changed.length) return "denied";
  redirect("/login?changed=1");
}
export async function deleteAccount(_: string, data: FormData) {
  const user = await viewer();
  if (!user || user.role === "admin" || data.get("confirm") !== "DELETE") return "denied";
  const current = String(data.get("current") ?? "");
  const [row] = await query<{ password_hash: string }>("SELECT password_hash FROM accounts WHERE id=$1", [user.id]);
  if (!row?.password_hash || current.length > 128 || !(await verify(row.password_hash, current))) return "denied";
  const removedUploads: string[] = [];
  const anonymous = randomUUID();
  const result = await transaction(async (q) => {
    const changed = await q("UPDATE accounts SET deleted=1,revision=revision+1,name='Deleted account',username=$1,email=$2,password_hash='',company='',links='[]',photo='',bio='',contact='' WHERE id=$3 AND id IN (SELECT id FROM account_state WHERE suspended=0 AND session_version=$4) AND NOT EXISTS(SELECT 1 FROM commissions WHERE status='progress' AND (customer=$3 OR artist=$3)) RETURNING id", ["deleted_" + anonymous, anonymous + "@deleted.invalid", user.id, user.session_version]);
    if (!changed.length) return "active";
    const removedWorks = await q<{ url: string }>("DELETE FROM works WHERE artist=$1 RETURNING url", [user.id]);
    for (const work of removedWorks) { const key = ownedMedia(work.url); if (key) removedUploads.push(key); }
    return "saved";
  });
  if (result !== "saved") return result;
  await cleanup(user.photo);
  for (const key of removedUploads) await cleanup(key);
  refresh(); redirect("/login?deleted=1");
}
async function saveWork(data: FormData, updating: boolean) {
  const user = await viewer();
  if (user?.role !== "artist") return "denied";
  const title = short.safeParse(data.get("title")), cat = category.safeParse(data.get("category")), name = short.safeParse(data.get("formName"));
  if (!title.success || !cat.success || !name.success) return "invalid";
  const id = updating ? String(data.get("id") ?? "") : randomUUID();
  const [old] = updating ? await query<{ url: string }>("SELECT url FROM works WHERE id=$1 AND artist=$2", [id, user.id]) : [];
  if (updating && !old) return "denied";
  let key: string | null = null;
  const file = data.get("file");
  if (file instanceof File && file.size) { key = await saveMedia(file, false); if (!key) return "file"; }
  const rawUrl = String(data.get("url") ?? "").trim();
  const url = key ? "/api/media/" + key : rawUrl || old?.url || "";
  if (!key && url !== old?.url && !web.safeParse(url).success) return "invalid";
  try {
    const result = await transaction(async (q) => {
      if (!await currentSession(q, user)) return "denied";
      const form = await resolveForm(q, cat.data, name.data);
      if (!form) return "invalid";
      const rows = updating
        ? await q("UPDATE works SET title=$1,url=$2,form=$3 WHERE id=$4 AND artist=$5 RETURNING id", [title.data, url, form, id, user.id])
        : await q("INSERT INTO works(id,artist,form,title,url) VALUES($1,$2,$3,$4,$5) RETURNING id", [id, user.id, form, title.data, url]);
      return rows.length ? "saved" : "denied";
    });
    if (result !== "saved") await cleanup(key);
    else if (old && old.url !== url) await cleanup(ownedMedia(old.url));
    refresh(); return result;
  } catch (error) { await cleanup(key); throw error; }
}
export async function addWork(_: string, data: FormData) { return saveWork(data, false); }
export async function updateWork(_: string, data: FormData) { return saveWork(data, true); }
export async function deleteWork(_: string, data: FormData) {
  const user = await viewer();
  if (user?.role !== "artist") return "denied";
  const rows = await query<{ url: string }>("DELETE FROM works WHERE id=$1 AND artist=$2 AND EXISTS(SELECT 1 FROM account_state WHERE id=$2 AND suspended=0 AND session_version=$3) RETURNING url", [String(data.get("id")), user.id, user.session_version]);
  if (!rows.length) return "denied";
  await cleanup(ownedMedia(rows[0].url));
  refresh(); return "saved";
}
export async function postCommission(_: string, data: FormData) {
  const user = await viewer(), parsed = commissionSchema.safeParse(Object.fromEntries(data));
  if (user?.role !== "customer") return "denied";
  if (!parsed.success) return "invalid";
  const { title, brief, category: cat, fee, output_type, deadline } = parsed.data;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (deadline < today) return "invalid";
  const id = randomUUID(), now = Date.now();
  let key: string | null = null;
  const reference = data.get("reference");
  if (reference instanceof File && reference.size) { key = await saveMedia(reference, true); if (!key) return "file"; }
  let result: string;
  try {
    result = await transaction(async (q) => {
      if (!await currentSession(q, user)) return "denied";
      let form = parsed.data.form;
      if (form === "__other__") {
        const name = short.safeParse(parsed.data.otherForm);
        if (!name.success) return "invalid";
        form = await resolveForm(q, cat, name.data) ?? "";
      }
      const rows = await q("INSERT INTO commissions(id,customer,form,title,brief,fee,original_fee,created,updated,output_type,reference,deadline) SELECT $1,$2,id,$4,$5,$6,$6,$7,$7,$9,$10,$11 FROM forms WHERE id=$3 AND category=$8 RETURNING id", [id, user.id, form, title, brief, fee, now, cat, output_type, key ?? "", deadline]);
      if (!rows.length) return "invalid";
      await event(q, id, user.id, "posted", now, "", "", fee);
      return "saved";
    });
  } catch (error) { await cleanup(key); throw error; }
  if (result !== "saved") { await cleanup(key); return result; }
  refresh(); redirect("/profile/history/" + id);
}

type Job = { id: string; customer: string; artist: string | null; status: string; fee: number; original_fee: number; output: string; paused: number };
export async function commissionAction(_: string, data: FormData) {
  const user = await viewer(), id = String(data.get("id") ?? ""), action = String(data.get("action") ?? "");
  if (!user) return "denied";
  let key: string | null = null;
  if (action === "submit") {
    const [allowed] = await query("SELECT id FROM commission_state WHERE id=$1 AND artist=$2 AND status='progress' AND output='' AND paused=0 AND sample=0", [id, user.id]);
    if (!allowed || user.role !== "artist") return "denied";
    const file = data.get("file");
    if (!(file instanceof File)) return "file";
    key = await saveMedia(file, false); if (!key) return "file";
  }
  let result: string;
  try {
    result = await transaction(async (q) => {
      // Acquire the commission row's write lock before deciding any transition.
      const locked = await q("UPDATE commissions SET updated=updated WHERE id=$1 AND sample=0 AND id IN (SELECT id FROM commission_state WHERE paused=0) RETURNING id", [id]);
      if (!locked.length) return "conflict";
      if (!await currentSession(q, user)) return "denied";
      const [c] = await q<Job>("SELECT id,customer,artist,status,fee,original_fee,output,paused FROM commission_state WHERE id=$1", [id]);
      if (!c || c.paused) return "conflict";
      const now = Date.now();
      if ((action === "propose" || action === "editProposal") && user.role === "artist" && c.status === "finding") {
        const message = paragraph.safeParse(data.get("message"));
        const pricing = data.get("pricing");
        const quote = pricing === "offered" ? money.safeParse(c.original_fee) : pricing === "quote" && String(data.get("quote") ?? "").trim() ? money.safeParse(data.get("quote")) : null;
        if (!message.success || !quote?.success || data.get("acknowledged") !== "on") return "invalid";
        const rows = action === "propose"
          ? await q("INSERT INTO proposals(id,commission,artist,message,quote,initial_quote,pricing,created,updated) VALUES($1,$2,$3,$4,$5,$5,$6,$7,$7) ON CONFLICT DO NOTHING RETURNING id", [randomUUID(), id, user.id, message.data, quote.data, pricing as string, now])
          : await q("UPDATE proposals SET message=$1,quote=$2,pricing=$3,updated=$4 WHERE commission=$5 AND artist=$6 AND status='active' AND created>=$7 RETURNING id", [message.data, quote.data, pricing as string, now, id, user.id, now - 15 * 60 * 1000]);
        if (!rows.length) return action === "editProposal" ? "expired" : "conflict";
        await event(q, id, user.id, action === "propose" ? "proposed" : "proposal_edited", now, user.id, message.data, quote.data);
      } else if (action === "select" && user.role === "customer" && c.customer === user.id && c.status === "finding") {
        if (data.get("acknowledged") !== "on") return "invalid";
        const [proposal] = await q<{ artist: string; quote: number }>("SELECT p.artist,p.quote FROM proposals p JOIN account_state a ON a.id=p.artist WHERE p.id=$1 AND p.commission=$2 AND p.status='active' AND a.suspended=0 AND a.sample=0", [String(data.get("proposal")), id]);
        if (!proposal) return "conflict";
        const participant = await q("UPDATE accounts SET revision=revision WHERE id=$1 AND deleted=0 AND id IN (SELECT id FROM account_state WHERE suspended=0 AND sample=0) RETURNING id", [proposal.artist]);
        if (!participant.length) return "conflict";
        await q("UPDATE commissions SET status='progress',artist=$1,fee=$2,selected_at=$3 WHERE id=$4", [proposal.artist, proposal.quote, now, id]);
        await event(q, id, user.id, "selected", now, proposal.artist, "", proposal.quote);
      } else if (action === "cancel" && user.role === "customer" && c.customer === user.id && c.status === "progress" && c.artist) {
        const reason = paragraph.safeParse(data.get("reason"));
        if (!reason.success) return "invalid";
        await event(q, id, user.id, "cancelled", now, c.artist, reason.data, c.fee, c.output);
        await q("UPDATE proposals SET status='cancelled',updated=$1 WHERE commission=$2 AND artist=$3", [now, id, c.artist]);
        await q("UPDATE commissions SET status='finding',artist=NULL,fee=original_fee,output='',published=0,selected_at=0,submitted_at=0,accepted_at=0 WHERE id=$1", [id]);
      } else if (action === "submit" && user.role === "artist" && c.artist === user.id && c.status === "progress" && !c.output && key) {
        await q("UPDATE commissions SET output=$1,submitted_at=$2 WHERE id=$3", [key, now, id]);
        await event(q, id, user.id, "submitted", now, user.id, "", c.fee, key);
      } else if (action === "accept" && user.role === "customer" && c.customer === user.id && c.status === "progress" && c.output) {
        await q("UPDATE commissions SET status='done',accepted_at=$1 WHERE id=$2", [now, id]);
        await event(q, id, user.id, "accepted", now, c.artist ?? "", "", c.fee);
      } else if (action === "visibility" && user.role === "customer" && c.customer === user.id && c.status === "done" && c.output) {
        const published = data.get("public") === "on" ? 1 : 0;
        await q("UPDATE commissions SET published=$1 WHERE id=$2", [published, id]);
        await event(q, id, user.id, published ? "published" : "hidden", now, c.artist ?? "");
      } else return "conflict";
      await q("UPDATE commissions SET updated=$1 WHERE id=$2", [now, id]);
      return "saved";
    });
  } catch (error) { await cleanup(key); throw error; }
  if (result !== "saved") await cleanup(key);
  refresh(); return result;
}
