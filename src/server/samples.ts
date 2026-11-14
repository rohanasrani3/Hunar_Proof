import "server-only";
import { sampleCover } from "@/lib/sample-media";

/**
 * Sample marketplace data. Only this trusted backend module designates
 * sample records (sample=1). Every person and business here is fictional, and
 * every image and tune under /public/seed is a generated placeholder
 * (scripts/generate-sample-media.mjs), not a real artist's work.
 *
 * Product rules (AGENTS.md): samples are marked "Sample data" on public pages,
 * are read-only, cannot sign in (empty password hash, login requires sample=0),
 * and are included in pilot rankings and impact totals with clear sample labels.
 *
 * Inserts are idempotent (ON CONFLICT DO NOTHING) and run on local SQLite,
 * or on PostgreSQL when KAREGHAR_SEED_SAMPLES=1.
 */

type Value = string | number | null;
type Query = (sql: string, values?: Value[]) => Promise<unknown[]>;

type SampleAccount = { id: string; name: string; role: "artist" | "customer"; company?: string };
type SampleWork = { id: string; artist: string; form: string; title: string; url: string };
type SampleCommission = {
  id: string;
  customer: string;
  form: string;
  title: string;
  brief: string;
  fee: number;
  status: "finding" | "progress" | "done";
  artist?: string;
};

const art = (form: string) => `/seed/forms/${form}.svg`;
const tune = (form: string) => `/seed/forms/${form}.wav`;

export const SAMPLE_ACCOUNTS: SampleAccount[] = [
  // Customers (businesses commissioning work)
  { id: "demo-customer", name: "Aangan Studio", role: "customer" },
  { id: "demo-hotel", name: "Haveli Courtyard Hotel", role: "customer" },
  { id: "demo-cafe", name: "Chai Adda Café", role: "customer" },
  { id: "demo-events", name: "Shubh Utsav Events", role: "customer" },
  { id: "demo-artsclub", name: "Kala Ankur Arts Club", role: "customer" },
  // Folk painting
  { id: "demo-artist", name: "Meera Patil", role: "artist" },
  { id: "demo-madhubani", name: "Pooja Jha", role: "artist" },
  { id: "demo-gond", name: "Arjun Dhurve", role: "artist" },
  { id: "demo-pattachitra", name: "Lipika Mahapatra", role: "artist" },
  { id: "demo-kalamkari", name: "Srinivas Reddy", role: "artist" },
  // Music
  { id: "demo-musician", name: "Ravi P.", role: "artist" },
  { id: "demo-baul", name: "Gour Das", role: "artist" },
  { id: "demo-hindustani", name: "Ananya Kulkarni", role: "artist" },
  { id: "demo-carnatic", name: "Karthik Iyer", role: "artist" },
  // Dance & performance
  { id: "demo-lavani", name: "Sneha Jadhav", role: "artist" },
  { id: "demo-kathak", name: "Riya Sharma", role: "artist" },
  { id: "demo-bharatanatyam", name: "Lakshmi Narayanan", role: "artist" },
  { id: "demo-kathputli", name: "Ramesh Bhat", role: "artist", company: "Bhat Puppet Theatre" },
  // Crafts & textiles
  { id: "demo-blockprinter", name: "Meena K.", role: "artist" },
  { id: "demo-terracotta", name: "Bapi Pal", role: "artist" },
  { id: "demo-handloom", name: "Fatima Ansari", role: "artist", company: "Ansari Handloom Co-op" },
  { id: "demo-chikankari", name: "Nazia Khan", role: "artist" },
];

export const SAMPLE_WORKS: SampleWork[] = [
  // Original three (kept for existing databases)
  { id: "demo-wall", artist: "demo-artist", form: "warli", title: "Village celebration", url: "/seed/warli-final.svg" },
  { id: "demo-textile", artist: "demo-blockprinter", form: "block-print", title: "Floral block print", url: "/seed/blockprint-sample.svg" },
  { id: "demo-song", artist: "demo-musician", form: "marathi-folk", title: "Marathi folk jingle", url: "/seed/jingle-draft.wav" },
  // Additions
  { id: "demo-wall-sketch", artist: "demo-artist", form: "warli", title: "Harvest dance layout sketch", url: "/seed/warli-sketch.svg" },
  { id: "demo-madhubani-fish", artist: "demo-madhubani", form: "madhubani", title: "Twin fish and lotus", url: art("madhubani") },
  { id: "demo-gond-tree", artist: "demo-gond", form: "gond", title: "Tree of life with deer", url: art("gond") },
  { id: "demo-patta-temple", artist: "demo-pattachitra", form: "pattachitra", title: "Temple procession panel", url: art("pattachitra") },
  { id: "demo-kalam-vines", artist: "demo-kalamkari", form: "kalamkari", title: "Indigo vine wall hanging", url: art("kalamkari") },
  { id: "demo-folk-poster", artist: "demo-musician", form: "marathi-folk", title: "Dholki evening poster", url: art("marathi-folk") },
  { id: "demo-baul-song", artist: "demo-baul", form: "baul", title: "Ektara melody", url: tune("baul") },
  { id: "demo-baul-poster", artist: "demo-baul", form: "baul", title: "Baul gathering poster", url: art("baul") },
  { id: "demo-raag", artist: "demo-hindustani", form: "hindustani", title: "Evening raag excerpt", url: tune("hindustani") },
  { id: "demo-raag-poster", artist: "demo-hindustani", form: "hindustani", title: "Baithak concert poster", url: art("hindustani") },
  { id: "demo-varnam", artist: "demo-carnatic", form: "carnatic", title: "Violin varnam excerpt", url: tune("carnatic") },
  { id: "demo-varnam-poster", artist: "demo-carnatic", form: "carnatic", title: "Kutcheri poster", url: art("carnatic") },
  { id: "demo-lavani-stage", artist: "demo-lavani", form: "lavani", title: "Lavani with dholki", url: art("lavani") },
  { id: "demo-kathak-spin", artist: "demo-kathak", form: "kathak", title: "Chakkar sequence", url: art("kathak") },
  { id: "demo-bn-pose", artist: "demo-bharatanatyam", form: "bharatanatyam", title: "Aramandi study", url: art("bharatanatyam") },
  { id: "demo-puppets", artist: "demo-kathputli", form: "kathputli", title: "Raja and Rani puppets", url: art("kathputli") },
  { id: "demo-pots", artist: "demo-terracotta", form: "terracotta", title: "Courtyard pot set", url: art("terracotta") },
  { id: "demo-weave", artist: "demo-handloom", form: "handloom", title: "Striped cotton throw", url: art("handloom") },
  { id: "demo-chikan-flowers", artist: "demo-chikankari", form: "chikankari", title: "Shadow-work floral panel", url: art("chikankari") },
];

/** Listed oldest → newest; `created` follows this order so newer samples sort first among samples. */
export const SAMPLE_COMMISSIONS: SampleCommission[] = [
  // Done
  { id: "demo-pattachitra-invite", customer: "demo-events", form: "pattachitra", title: "Pattachitra art for wedding invitations", brief: "Paint one Pattachitra panel of a bride and groom under a temple arch. We will print it on 300 invitation cards.", fee: 11000, status: "done", artist: "demo-pattachitra" },
  { id: "demo-carnatic-score", customer: "demo-customer", form: "carnatic", title: "Carnatic violin score for a short film", brief: "Record about three minutes of Carnatic violin for a short documentary about a weaving village. Calm, slow tempo.", fee: 10000, status: "done", artist: "demo-carnatic" },
  { id: "demo-handloom-throws", customer: "demo-hotel", form: "handloom", title: "Handwoven throws for 10 guest rooms", brief: "Ten cotton throws, about 50 × 60 inches, in our courtyard colours (rust, mustard and indigo).", fee: 20000, status: "done", artist: "demo-handloom" },
  { id: "demo-kalamkari-hanging", customer: "demo-cafe", form: "kalamkari", title: "Kalamkari wall hanging for the reading corner", brief: "A 4 × 3 ft Kalamkari cloth with vines and flowers, natural dyes, ready to hang.", fee: 8500, status: "done", artist: "demo-kalamkari" },
  { id: "demo-bn-annual-day", customer: "demo-artsclub", form: "bharatanatyam", title: "Bharatanatyam recital for our annual day", brief: "A 20-minute solo recital for an audience of families and children, with a short explanation of each piece.", fee: 9000, status: "done", artist: "demo-bharatanatyam" },
  { id: "demo-raag-evening", customer: "demo-hotel", form: "hindustani", title: "Hindustani vocal evening in the courtyard", brief: "Ninety minutes of light classical vocal music for hotel guests, with tabla and harmonium accompaniment.", fee: 14000, status: "done", artist: "demo-hindustani" },
  // In progress
  { id: "demo-gond-menu", customer: "demo-cafe", form: "gond", title: "Gond illustrations for our new menu", brief: "Six small Gond-style illustrations of tea, snacks and birds for a printed menu card.", fee: 9000, status: "progress", artist: "demo-gond" },
  { id: "demo-chikan-kurtas", customer: "demo-hotel", form: "chikankari", title: "Chikankari detailing on staff kurtas", brief: "Hand chikankari yokes on 12 white cotton kurtas for front-desk staff. Simple floral pattern.", fee: 16000, status: "progress", artist: "demo-chikankari" },
  { id: "demo-kathak-launch", customer: "demo-events", form: "kathak", title: "Kathak performance at a product launch", brief: "A 10-minute Kathak piece with live tabla to open a jewellery brand launch.", fee: 15000, status: "progress", artist: "demo-kathak" },
  // Finding an artist
  { id: "demo-madhubani-lobby", customer: "demo-hotel", form: "madhubani", title: "Madhubani panels for the hotel lobby", brief: "Three 3 × 4 ft Madhubani panels showing local festivals for the lobby wall. Bright natural colours.", fee: 25000, status: "finding" },
  { id: "demo-lavani-sangeet", customer: "demo-events", form: "lavani", title: "Lavani performance for a sangeet night", brief: "A group Lavani performance of about 15 minutes for a wedding sangeet in Pune, with dholki.", fee: 18000, status: "finding" },
  { id: "demo-baul-evening", customer: "demo-cafe", form: "baul", title: "बाउल संगीत की एक शाम", brief: "हमारे कैफ़े की पहली सालगिरह पर एक घंटे का बाउल संगीत कार्यक्रम चाहिए। छोटी जगह है, लगभग 40 लोग होंगे।", fee: 7000, status: "finding" },
  { id: "demo-terracotta-planters", customer: "demo-hotel", form: "terracotta", title: "Terracotta planters for the courtyard", brief: "Twenty hand-thrown terracotta planters in three sizes, with simple incised patterns.", fee: 12000, status: "finding" },
  { id: "demo-kathputli-show", customer: "demo-artsclub", form: "kathputli", title: "बाल दिवस के लिए कठपुतली शो", brief: "बच्चों के लिए 30 मिनट का कठपुतली शो, कहानी के साथ। लगभग 80 बच्चे होंगे।", fee: 6000, status: "finding" },
];

export async function seedSamples(query: Query) {
  for (const a of SAMPLE_ACCOUNTS)
    await query(
      "INSERT INTO accounts(id,username,email,name,role,password_hash,company,sample) VALUES($1,$1,$2,$3,$4,'',$5,1) ON CONFLICT DO NOTHING",
      [a.id, a.id + "@example.invalid", a.name, a.role, a.company ?? ""],
    );

  for (const w of SAMPLE_WORKS)
    await query("INSERT INTO works(id,artist,form,title,url) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING", [
      w.id,
      w.artist,
      w.form,
      w.title,
      w.url,
    ]);

  // The three original sample commissions keep created=0 and their original values.
  await query(
    "INSERT INTO commissions(id,customer,form,title,brief,fee,sample,created,status,artist) VALUES ('demo-mural','demo-customer','warli','Warli mural for a café','Paint a village celebration for the café counter wall.',8000,1,0,'done','demo-artist'),('demo-jingle','demo-customer','marathi-folk','Marathi folk jingle','Record a short folk melody for a café opening.',3000,1,0,'progress','demo-musician') ON CONFLICT DO NOTHING",
  );
  await query(
    "INSERT INTO commissions(id,customer,form,title,brief,fee,sample,created) VALUES ('demo-print','demo-customer','block-print','Hand-printed table runners','Design six cotton runners with Bagru floral motifs for our café.',4500,1,0) ON CONFLICT DO NOTHING",
  );

  // Small created values keep every sample below real commissions (created DESC = real first).
  for (const [i, c] of SAMPLE_COMMISSIONS.entries()) {
    await query(
      "INSERT INTO commissions(id,customer,form,title,brief,fee,status,artist,sample,created) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9) ON CONFLICT DO NOTHING",
      [c.id, c.customer, c.form, c.title, c.brief, c.fee, c.status, c.artist ?? null, i + 1],
    );
  }

  // Upgrade only trusted sample records. Old seeds become a complete pilot
  // journey, while real data and existing sample identities remain untouched.
  for (const a of SAMPLE_ACCOUNTS) {
    await query("UPDATE accounts SET bio=$1,contact=$2 WHERE id=$3 AND sample=1", [
      a.role === "artist" ? "A fictional artist profile demonstrating the KareGhar pilot. Explore the sample portfolio to see how artists share their work." : "A fictional customer account demonstrating how businesses commission work on KareGhar.",
      a.id + "@example.invalid", a.id,
    ]);
  }
  const originals: SampleCommission[] = [
    { id: "demo-mural", customer: "demo-customer", form: "warli", title: "", brief: "", fee: 8000, status: "done", artist: "demo-artist" },
    { id: "demo-jingle", customer: "demo-customer", form: "marathi-folk", title: "", brief: "", fee: 3000, status: "progress", artist: "demo-musician" },
    { id: "demo-print", customer: "demo-customer", form: "block-print", title: "", brief: "", fee: 4500, status: "finding" },
  ];
  const music = new Set(["marathi-folk", "baul", "hindustani", "carnatic"]);
  const dance = new Set(["lavani", "kathak", "bharatanatyam", "kathputli"]);
  const craft = new Set(["block-print", "terracotta", "handloom", "chikankari", "kalamkari"]);
  for (const [i, c] of [...originals, ...SAMPLE_COMMISSIONS].entries()) {
    const created = Date.UTC(2025, 0, 1) + i * 86400000;
    const outputType = music.has(c.form) ? "audio" : dance.has(c.form) ? "live" : craft.has(c.form) ? "physical" : "image";
    const output = c.status === "done" ? music.has(c.form) ? tune(c.form) : sampleCover(c.form) ?? "" : "";
    await query(`UPDATE commissions SET original_fee=fee,output_type=$1,created=$2,updated=$3,
      selected_at=$4,submitted_at=$5,accepted_at=$6,output=$7,published=$8 WHERE id=$9 AND sample=1`, [
      outputType, created, created + (c.status === "done" ? 604800000 : c.status === "progress" ? 86400000 : 0),
      c.artist ? created + 86400000 : 0, c.status === "done" ? created + 518400000 : 0,
      c.status === "done" ? created + 604800000 : 0, output, c.status === "done" ? 1 : 0, c.id,
    ]);
  }
}
