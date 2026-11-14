// Integration checks exercise the real action/read modules against migrated
// SQLite. Framework boundaries (session, redirects, storage) are isolated.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import ts from "typescript";
import { hash } from "@node-rs/argon2";
import { initializeLocalDb } from "./init-local-db.mjs";

const require = createRequire(import.meta.url), root = process.cwd();
const db = new DatabaseSync(":memory:");
// Start with an actual pre-upgrade database containing real data.
db.exec(readFileSync("migrations/001_marketplace.sql", "utf8"));
db.exec(readFileSync("migrations/003_moderation.sql", "utf8").split("-- PostgreSQL privileges")[0] + "COMMIT;");
db.exec("INSERT INTO accounts(id,username,email,name,role,password_hash) VALUES('legacy','legacy','legacy@example.invalid','Legacy','customer',''); INSERT INTO forms(id,category,name,hi) VALUES('legacy-form','painting','Legacy','Legacy'); INSERT INTO commissions(id,customer,form,title,brief,fee,created) VALUES('legacy-job','legacy','legacy-form','Legacy work','Preserve this',456,123)");
initializeLocalDb(db);
initializeLocalDb(db);
assert.equal(db.prepare("SELECT original_fee FROM commissions WHERE id='legacy-job'").get().original_fee, 456);
assert.equal(db.prepare("SELECT COUNT(*) AS n FROM commissions WHERE id='legacy-job'").get().n, 1);

const q = async (sql, values = []) => {
  const ordered = [];
  const converted = sql.replace(/\$(\d+)/g, (_, n) => { ordered.push(values[Number(n) - 1]); return "?"; });
  return db.prepare(converted).all(...ordered).map((row) => ({ ...row }));
};
const transaction = async (fn) => {
  db.exec("BEGIN IMMEDIATE");
  try { const result = await fn(q); db.exec("COMMIT"); return result; }
  catch (error) { db.exec("ROLLBACK"); throw error; }
};
let session = null;
const viewer = async () => !session ? null : (await q("SELECT *,effective_role AS role FROM account_state WHERE id=$1 AND session_version=$2 AND suspended=0", [session.id, session.version]))[0] ?? null;
const actAs = async (id) => {
  const [account] = await q("SELECT id,session_version FROM account_state WHERE id=$1", [id]);
  session = { id, version: account.session_version };
};
class Redirect extends Error { constructor(path) { super(path); this.path = path; } }
const stored = new Map();
const mocks = {
  "server-only": {},
  "next/cache": { revalidatePath() {} },
  "next/headers": { cookies: async () => ({ set() {} }) },
  "next/navigation": { redirect(path) { throw new Redirect(path); } },
  "@/server/auth": { viewer },
  "@/server/db": { query: q, transaction },
  "@/server/media": {
    saveMedia: async (file) => { if (!file.size || file.size > 5 * 1024 * 1024) return null; const key = randomUUID() + ".png"; stored.set(key, file); return key; },
    removeMedia: async (key) => { stored.delete(key); },
    mediaResponse: async (key) => new Response(stored.has(key) ? "bytes" : null, { status: stored.has(key) ? 200 : 404 }),
  },
};
const cache = new Map();
function load(file) {
  const absolute = resolve(root, file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const loaded = { exports: {} }; cache.set(absolute, loaded);
  const code = ts.transpileModule(readFileSync(absolute, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const localRequire = (name) => {
    if (mocks[name]) return mocks[name];
    let target = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : name.startsWith(".") ? resolve(dirname(absolute), name) : null;
    if (!target) return require(name);
    if (target === resolve(root, "src/server/auth")) return mocks["@/server/auth"];
    if (target === resolve(root, "src/server/db")) return mocks["@/server/db"];
    if (target === resolve(root, "src/server/media")) return mocks["@/server/media"];
    if (!extname(target)) { try { readFileSync(target + ".ts"); target += ".ts"; } catch { target += ".tsx"; } }
    return load(target);
  };
  runInNewContext(`(function(require,module,exports){${code}\n})`, { File, FormData, Response, Request, URL, Buffer, Date, console, process, setTimeout, clearTimeout })(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
const actions = load("src/server/actions.ts"), market = load("src/server/market.ts"), history = load("src/server/history.ts"), messaging = load("src/server/history-actions.ts"), media = load("src/app/api/media/[key]/route.ts");
const { ART_FORMS } = load("src/contract/artForms.ts"), { seedSamples } = load("src/server/samples.ts");
for (const form of ART_FORMS) await q("INSERT INTO forms(id,category,name,hi) VALUES($1,$2,$3,$4)", [form.id, form.category, form.name, form.hi]);
await seedSamples(q); await seedSamples(q);
assert.equal((await q("SELECT COUNT(*) AS n FROM accounts WHERE sample=1"))[0].n, 22);
assert.equal((await q("SELECT COUNT(*) AS n FROM commissions WHERE sample=1"))[0].n, 17);
assert.equal((await q("SELECT COUNT(*) AS n FROM commissions WHERE sample=1 AND status='done' AND output<>''"))[0].n, 7);
assert((await market.commissions()).some((c) => c.status === "finding"));
assert(!(await market.commissions()).some((c) => c.status === "progress"));
assert((await market.artists()).some((a) => a.sample && a.completed > 0));

const pw = await hash("example-pass");
for (const [id, role] of [["customer", "customer"], ["other-customer", "customer"], ["artist", "artist"], ["other-artist", "artist"]])
  await q("INSERT INTO accounts(id,username,email,name,role,password_hash) VALUES($1,$1,$2,$1,$3,$4)", [id, id + "@example.invalid", role, pw]);
const form = (values) => { const result = new FormData(); for (const [key, value] of Object.entries(values)) result.set(key, value instanceof File ? value : String(value)); return result; };
const invoke = (action, values) => action("", form(values));
await actAs("customer");
let id;
const deadline = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
const brief = { title: "A real commission", brief: "Create a wall painting", category: "painting", form: "warli", fee: 1000, output_type: "physical", reference: new File(["reference"], "reference.png") };
assert.equal(await invoke(actions.postCommission, brief), "invalid");
assert.equal(await invoke(actions.postCommission, { ...brief, deadline: "2020-01-01" }), "invalid");
try { await invoke(actions.postCommission, { ...brief, deadline }); assert.fail("Expected redirect"); }
catch (error) { assert(error instanceof Redirect); id = error.path.split("/").pop(); }
const job = async () => (await q("SELECT * FROM commissions WHERE id=$1", [id]))[0];
assert.equal((await job()).original_fee, 1000);
assert.equal((await job()).deadline, deadline);
assert(!(await market.commissions({}, "", "customer")).some((c) => c.id === id));
const referenceKey = (await job()).reference;
session = null;
assert.equal((await media.GET(new Request("http://test"), { params: Promise.resolve({ key: referenceKey }) })).status, 200);

await actAs("artist");
const proposal = { id, action: "propose", message: "I can paint this", pricing: "quote", quote: 900, acknowledged: "on" };
assert.equal(await invoke(actions.commissionAction, { ...proposal, acknowledged: "" }), "invalid");
assert.equal(await invoke(actions.commissionAction, { ...proposal, quote: "" }), "invalid");
assert.equal(await invoke(actions.commissionAction, proposal), "saved");
assert.equal(await invoke(actions.commissionAction, proposal), "conflict");
assert.equal(await invoke(actions.commissionAction, { ...proposal, action: "editProposal", quote: 950 }), "saved");
let offer = (await market.proposals(id, "artist"))[0];
assert.equal(offer.initial_quote, 900); assert.equal(offer.quote, 950);
await q("UPDATE proposals SET created=$1 WHERE id=$2", [Date.now() - 901000, offer.id]);
assert.equal(await invoke(actions.commissionAction, { ...proposal, action: "editProposal", quote: 800 }), "expired");
await q("UPDATE proposals SET created=$1 WHERE id=$2", [Date.now(), offer.id]);
await actAs("other-artist");
assert.equal((await market.proposals(id, "other-artist")).length, 0);
assert.equal(await history.historyDetail(id, "other-artist"), undefined);
assert.equal(await invoke(messaging.sendMessage, { id, artist: "artist", body: "Unauthorized" }), "denied");
assert.equal(await invoke(actions.commissionAction, { ...proposal, pricing: "offered", quote: "" }), "saved");
assert.equal((await market.proposals(id, "other-artist"))[0].quote, 1000);
assert.equal((await history.historyDetail(id, "other-artist")).events.some((e) => e.artist === "artist"), false);

await actAs("customer");
assert((await history.unreadCount("customer")) > 0);
assert.equal(await invoke(messaging.sendMessage, { id, artist: "artist", body: "Let us discuss the dimensions." }), "saved");
assert.equal(await invoke(actions.commissionAction, { id, action: "select", proposal: offer.id }), "invalid");
await actAs("other-customer");
assert.equal(await invoke(actions.commissionAction, { id, action: "select", proposal: offer.id, acknowledged: "on" }), "conflict");
assert.equal(await invoke(messaging.markHistoryRead, { id, seenAt: Date.now() }), "denied");
await actAs("customer");
assert.equal(await invoke(actions.commissionAction, { id, action: "select", proposal: offer.id, acknowledged: "on" }), "saved");
assert.equal((await job()).fee, 950);
session = null;
assert.equal((await market.commissions({}, id)).length, 0);
assert.equal((await media.GET(new Request("http://test"), { params: Promise.resolve({ key: referenceKey }) })).status, 404);
await actAs("artist");
assert.equal(await invoke(actions.deleteAccount, { current: "example-pass", confirm: "DELETE" }), "active");
assert.equal(await invoke(actions.commissionAction, { id, action: "submit", file: new File(["finished"], "painting.png") }), "saved");
const firstOutput = (await job()).output;
assert.equal((await media.GET(new Request("http://test"), { params: Promise.resolve({ key: firstOutput }) })).status, 200);
assert.equal((await market.artists()).find((a) => a.id === "artist").completed, 0);
await actAs("other-artist");
assert.equal((await history.historyDetail(id, "other-artist")).commission.output, "");
assert.equal((await media.GET(new Request("http://test"), { params: Promise.resolve({ key: firstOutput }) })).status, 404);
assert.equal((await history.historyDetail(id, "other-artist")).messages.length, 0);
await actAs("customer");
assert.equal(await invoke(actions.commissionAction, { id, action: "cancel", reason: "The agreed schedule no longer works." }), "saved");
assert.equal((await job()).status, "finding");
assert.equal((await job()).fee, 1000);
assert.equal((await market.proposals(id, "customer")).find((p) => p.artist === "artist").status, "cancelled");
session = null;
assert.equal((await media.GET(new Request("http://test"), { params: Promise.resolve({ key: firstOutput }) })).status, 404);
await actAs("artist");
assert((await history.historyDetail(id, "artist")).events.some((e) => e.kind === "cancelled" && e.output === firstOutput));
assert.equal((await media.GET(new Request("http://test"), { params: Promise.resolve({ key: firstOutput }) })).status, 200);
assert.equal(await invoke(messaging.sendMessage, { id, artist: "artist", body: "Thanks for letting me know." }), "saved");

await actAs("customer");
const otherOffer = (await market.proposals(id, "customer")).find((p) => p.artist === "other-artist");
assert.equal(await invoke(actions.commissionAction, { id, action: "select", proposal: otherOffer.id, acknowledged: "on" }), "saved");
assert.equal(await invoke(actions.commissionAction, { id, action: "accept" }), "conflict");
await actAs("other-artist");
assert.equal(await invoke(actions.commissionAction, { id, action: "submit", file: new File(["finished two"], "painting.png") }), "saved");
const finalOutput = (await job()).output;
await actAs("customer");
assert.equal(await invoke(actions.commissionAction, { id, action: "accept" }), "saved");
assert.equal(await invoke(actions.commissionAction, { id, action: "cancel", reason: "Already accepted" }), "conflict");
assert.equal((await market.artists()).find((a) => a.id === "other-artist").completed, 1);
session = null;
assert.equal((await market.commissions({}, id))[0].output, "");
assert.equal((await media.GET(new Request("http://test"), { params: Promise.resolve({ key: finalOutput }) })).status, 404);
await actAs("customer");
assert.equal(await invoke(actions.commissionAction, { id, action: "visibility", public: "on" }), "saved");
session = null;
assert.equal((await media.GET(new Request("http://test"), { params: Promise.resolve({ key: finalOutput }) })).status, 200);
await actAs("customer");
assert.equal(await invoke(actions.commissionAction, { id, action: "visibility" }), "saved");
await actAs("other-artist");
assert.equal(await invoke(messaging.markHistoryRead, { id, seenAt: Date.now() }), "saved");
assert.equal(await history.unreadCount("other-artist"), 0);

// Portfolio ownership, upload replacement, profile removal, deletion and sessions.
await actAs("artist");
assert.equal(await invoke(actions.addWork, { title: "My study", category: "painting", formName: "Warli", file: new File(["portfolio"], "work.png") }), "saved");
const [work] = await market.works("artist");
assert.equal(await invoke(actions.updateWork, { id: work.id, title: "Edited study", category: "painting", formName: "Warli", url: work.url }), "saved");
await actAs("other-artist");
assert.equal(await invoke(actions.deleteWork, { id: work.id }), "denied");
await actAs("artist");
assert.equal(await invoke(actions.updateProfile, { name: "Artist", email: "artist@example.invalid", company: "", bio: "About my work", contact: "Public studio contact", photo: new File(["photo"], "photo.png") }), "saved");
assert.equal((await market.publicProfile("artist")).bio, "About my work");
assert.equal((await market.publicProfile("artist")).contact, "Public studio contact");
assert(!("email" in (await market.publicProfile("artist"))));
assert.equal(await invoke(actions.updateProfile, { name: "Artist", email: "artist@example.invalid", company: "", removePhoto: "on" }), "saved");
assert.equal((await viewer()).photo, "");
assert.equal(await invoke(actions.deleteAccount, { current: "bad-pass", confirm: "DELETE" }), "denied");
try { await invoke(actions.deleteAccount, { current: "example-pass", confirm: "DELETE" }); assert.fail("Expected redirect"); }
catch (error) { assert(error instanceof Redirect); }
assert.equal(await viewer(), null);
assert.equal(await market.publicProfile("artist"), undefined);
assert.equal((await market.works("artist")).length, 0);
assert.equal(stored.has(work.url.split("/").pop()), false);
assert((await history.historyDetail(id, "customer")).events.some((e) => e.kind === "cancelled"));
db.close();
console.log("PASS: migration upgrade/idempotency, pilot samples, quotes/edit window, workflow ownership, cancellation/history, private messages/media, rankings, portfolio/profile and account deletion/session invalidation.");
