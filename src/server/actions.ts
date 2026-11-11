"use server";
import { createHash, randomUUID } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  signupSchema,
  profileSchema,
  commissionSchema,
  short,
  paragraph,
  web,
  category,
  password,
} from "@/contract/schemas";
import { z } from "zod";
import { query } from "./db";
import { viewer } from "./auth";
import { saveMedia, removeMedia } from "./media";
import { SOCIALS, socialKey } from "@/components/social-links";

export async function switchLanguage(data: FormData) {
  (await cookies()).set(
    "kareghar-language",
    data.get("lang") === "hi" ? "hi" : "en",
    { sameSite: "lax", path: "/", maxAge: 31536000 },
  );
  revalidatePath("/", "layout");
}
export async function register(_: string, data: FormData) {
  const parsed = signupSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return "invalid";
  const { username, email, name, role, password } = parsed.data;
  const inserted = await query(
    "INSERT INTO accounts(id,username,email,name,role,password_hash) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id",
    [randomUUID(), username, email, name, role, await hash(password)],
  );
  if (!inserted.length) return "taken";
  redirect("/login?created=1");
}
export async function updateProfile(_: string, data: FormData) {
  const user = await viewer();
  if (!user) return "denied";
  let extraLinks: string[];
  try {
    const parsed = JSON.parse(String(data.get("linksExtra") ?? "[]"));
    if (!Array.isArray(parsed) || !parsed.every((link) => typeof link === "string")) return "invalid";
    extraLinks = parsed;
  } catch {
    return "invalid";
  }
  const socialLinks: string[] = [];
  for (const site of SOCIALS) {
    const url = String(data.get("social_" + site.key) ?? "").trim();
    if (url && socialKey(url) !== site.key) return "invalid";
    if (url) socialLinks.push(url);
  }
  const links = data.has("links")
    ? String(data.get("links") ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    : [...new Set([...socialLinks, ...extraLinks])];
  const schema =
    user.role === "admin"
      ? profileSchema.extend({
          email: profileSchema.shape.email.or(z.literal("")),
        })
      : profileSchema;
  const parsed = schema.safeParse({
    ...Object.fromEntries(data),
    links,
  });
  if (!parsed.success) return "invalid";
  const { name, email, company } = parsed.data;
  const photo = data.get("photo");
  let key: string | null = null;
  if (photo instanceof File && photo.size) {
    key = await saveMedia(photo, true);
    if (!key) return "file";
  }
  try {
    const changed = await query(
      "UPDATE accounts SET name=$1,email=$2,company=$3,links=$4,photo=COALESCE($5,photo) WHERE id=$6 AND id IN (SELECT id FROM account_state WHERE suspended=0 AND session_version=$7) RETURNING id",
      [
        name,
        email,
        company,
        JSON.stringify(parsed.data.links),
        key,
        user.id,
        user.session_version,
      ],
    );
    if (!changed.length) {
      if (key) await removeMedia(key);
      return "denied";
    }
  } catch (error) {
    if (key) await removeMedia(key);
    if (/unique|duplicate/i.test(String(error))) return "taken";
    throw error;
  }
  if (key && user.photo) await removeMedia(user.photo);
  revalidatePath("/", "layout");
  return "saved";
}
export async function changePassword(_: string, data: FormData) {
  const user = await viewer(),
    parsed = password.safeParse(data.get("password"));
  if (!user || !parsed.success) return "invalid";
  const [row] = await query<{ password_hash: string }>(
    "SELECT password_hash FROM accounts WHERE id=$1",
    [user.id],
  );
  const current = String(data.get("current") ?? "");
  if (current.length > 128 || !(await verify(row.password_hash, current)))
    return "denied";
  const changed = await query(
    "UPDATE accounts SET password_hash=$1,revision=revision+1 WHERE id=$2 AND id IN (SELECT id FROM account_state WHERE suspended=0 AND session_version=$3) RETURNING id",
    [await hash(parsed.data), user.id, user.session_version],
  );
  if (!changed.length) return "denied";
  redirect("/login?changed=1");
}
export async function addWork(_: string, data: FormData) {
  const user = await viewer();
  if (user?.role !== "artist") return "denied";
  const title = short.safeParse(data.get("title")),
    url = web.safeParse(data.get("url")),
    cat = category.safeParse(data.get("category"));
  const name = short.safeParse(data.get("formName"));
  if (!title.success || !url.success || !cat.success || !name.success)
    return "invalid";
  const label = name.data.normalize("NFKC").replace(/\s+/g, " ");
  const id =
    cat.data +
    "-" +
    createHash("sha256").update(label.toLowerCase()).digest("hex");
  await query(
    "INSERT INTO forms(id,category,name,hi) SELECT $1,$2,$3,$3 WHERE NOT EXISTS(SELECT 1 FROM forms WHERE category=$2 AND lower(name)=lower($3)) ON CONFLICT DO NOTHING",
    [id, cat.data, label],
  );
  const [form] = await query<{ id: string }>(
    "SELECT id FROM forms WHERE category=$1 AND (lower(name)=lower($2) OR id=$3)",
    [cat.data, label, id],
  );
  const created = await query(
    "INSERT INTO works SELECT $1,$2,$3,$4,$5 FROM account_state WHERE id=$2 AND suspended=0 AND session_version=$6 RETURNING id",
    [
      randomUUID(),
      user.id,
      form.id,
      title.data,
      url.data,
      user.session_version,
    ],
  );
  if (!created.length) return "denied";
  revalidatePath("/", "layout");
  return "saved";
}
export async function postCommission(_: string, data: FormData) {
  const user = await viewer(),
    parsed = commissionSchema.safeParse(Object.fromEntries(data));
  if (user?.role !== "customer") return "denied";
  if (!parsed.success) return "invalid";
  const { title, brief, category: selectedCategory, fee } = parsed.data,
    id = randomUUID();
  let form = parsed.data.form;
  if (form === "__other__") {
    const name = short.safeParse(parsed.data.otherForm);
    if (!name.success) return "invalid";
    const label = name.data.normalize("NFKC").replace(/\s+/g, " ");
    const newId = selectedCategory + "-" + createHash("sha256").update(label.toLowerCase()).digest("hex");
    await query(
      "INSERT INTO forms(id,category,name,hi) SELECT $1,$2,$3,$3 WHERE NOT EXISTS(SELECT 1 FROM forms WHERE category=$2 AND lower(name)=lower($3)) ON CONFLICT DO NOTHING",
      [newId, selectedCategory, label],
    );
    const [createdForm] = await query<{ id: string }>(
      "SELECT id FROM forms WHERE category=$1 AND (lower(name)=lower($2) OR id=$3)",
      [selectedCategory, label, newId],
    );
    if (!createdForm) return "invalid";
    form = createdForm.id;
  }
  const result = await query(
    "INSERT INTO commissions(id,customer,form,title,brief,fee,created) SELECT $1,$2,id,$4,$5,$6,$7 FROM forms WHERE id=$3 AND category=$8 AND EXISTS(SELECT 1 FROM account_state WHERE id=$2 AND suspended=0 AND session_version=$9) RETURNING id",
    [id, user.id, form, title, brief, fee, Date.now(), selectedCategory, user.session_version],
  );
  if (!result.length) return "invalid";
  redirect("/commissions/" + id);
}
export async function commissionAction(_: string, data: FormData) {
  const user = await viewer(),
    id = String(data.get("id")),
    action = data.get("action");
  if (!user) return "denied";
  let rows: unknown[] = [];
  if (action === "propose" && user.role === "artist") {
    const message = paragraph.safeParse(data.get("message"));
    if (!message.success) return "invalid";
    rows = await query(
      "INSERT INTO proposals(id,commission,artist,message) SELECT $1,id,$2,$3 FROM commission_state WHERE id=$4 AND paused=0 AND status='finding' AND sample=0 AND EXISTS(SELECT 1 FROM account_state WHERE id=$2 AND suspended=0) ON CONFLICT DO NOTHING RETURNING id",
      [randomUUID(), user.id, message.data, id],
    );
  } else if (action === "select" && user.role === "customer") {
    rows = await query(
      "UPDATE commissions SET status='progress',artist=(SELECT artist FROM proposals WHERE id=$1 AND commission=$2) WHERE id=$2 AND id IN (SELECT id FROM commission_state WHERE paused=0) AND customer=$3 AND status='finding' AND EXISTS(SELECT 1 FROM proposals p JOIN account_state a ON a.id=p.artist WHERE p.id=$1 AND p.commission=$2 AND a.suspended=0) RETURNING id",
      [String(data.get("proposal")), id, user.id],
    );
  } else if (action === "submit" && user.role === "artist") {
    const file = data.get("file");
    if (!(file instanceof File)) return "file";
    const [allowed] = await query<{ id: string }>(
      "SELECT id FROM commissions WHERE id=$1 AND artist=$2 AND id IN (SELECT id FROM commission_state WHERE paused=0) AND status='progress' AND output='' ",
      [id, user.id],
    );
    if (!allowed) return "denied";
    const key = await saveMedia(file, false);
    if (!key) return "file";
    rows = await query(
      "UPDATE commissions SET output=$1 WHERE id=$2 AND artist=$3 AND id IN (SELECT id FROM commission_state WHERE paused=0) AND status='progress' AND output='' RETURNING id",
      [key, id, user.id],
    );
    if (!rows.length) await removeMedia(key);
  } else if (action === "accept" && user.role === "customer") {
    rows = await query(
      "UPDATE commissions SET status='done' WHERE id=$1 AND customer=$2 AND id IN (SELECT id FROM commission_state WHERE paused=0) AND status='progress' AND output<>'' RETURNING id",
      [id, user.id],
    );
  } else if (action === "visibility" && user.role === "customer") {
    rows = await query(
      "UPDATE commissions SET published=$1 WHERE id=$2 AND customer=$3 AND id IN (SELECT id FROM commission_state WHERE paused=0) AND status='done' RETURNING id",
      [data.get("public") === "on" ? 1 : 0, id, user.id],
    );
  }
  if (!rows.length) return "conflict";
  revalidatePath("/", "layout");
  return "saved";
}
