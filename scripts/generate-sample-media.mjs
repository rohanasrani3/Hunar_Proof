// Generates ORIGINAL placeholder media for KareGhar sample data.
// These are simple geometric illustrations and tunes made by this script —
// not reproductions of any real artist's work. Every image is labelled
// "SAMPLE PLACEHOLDER" so it is never mistaken for a real commission.
//
// Usage (from firstship/):  node scripts/generate-sample-media.mjs
// Output: public/seed/forms/<form-id>.svg and, for music forms, <form-id>.wav
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "public/seed/forms";
const W = 1200;
const H = 750;
mkdirSync(OUT, { recursive: true });

// Deterministic pseudo-random numbers so regenerating gives identical files.
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

const svg = (label, bg, body, ink = "#1d1b17") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Sample placeholder in the spirit of ${label}">
<rect width="${W}" height="${H}" fill="${bg}"/>
${body}
<text x="${W - 20}" y="34" text-anchor="end" font-family="sans-serif" font-size="18" fill="${ink}" opacity="0.75">SAMPLE PLACEHOLDER · ${label.toUpperCase()}</text>
</svg>`;

const border = (color, inset = 24, width = 10) =>
  `<rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" fill="none" stroke="${color}" stroke-width="${width}"/>`;

/* ---------------- Folk painting ---------------- */

function madhubani() {
  // Paired fish around a lotus, double border filled with hatching.
  const fish = (x, y, flip, c) =>
    `<g transform="translate(${x} ${y}) scale(${flip} 1)" stroke="#1d1b17" stroke-width="4" fill="${c}">
    <path d="M-150 0 C-80 -90 80 -90 140 0 C80 90 -80 90 -150 0Z"/>
    <path d="M140 0 L210 -60 L200 0 L210 60Z"/>
    <circle cx="-95" cy="-12" r="14" fill="#fff"/><circle cx="-95" cy="-12" r="6" fill="#1d1b17"/>
    ${[-40, 0, 40, 80].map((dx) => `<path d="M${dx} -45 Q${dx + 25} 0 ${dx} 45" fill="none"/>`).join("")}
  </g>`;
  let hatch = "";
  for (let x = 40; x < W - 40; x += 16) hatch += `<path d="M${x} 40 l10 24 M${x} ${H - 64} l10 24"/>`;
  for (let y = 40; y < H - 40; y += 16) hatch += `<path d="M40 ${y} l24 10 M${W - 64} ${y} l24 10"/>`;
  let petals = "";
  for (let i = 0; i < 12; i++)
    petals += `<ellipse cx="600" cy="300" rx="22" ry="70" transform="rotate(${i * 30} 600 375)" fill="${i % 2 ? "#e0a32b" : "#c8372d"}" stroke="#1d1b17" stroke-width="3"/>`;
  return svg(
    "Madhubani",
    "#f4ead2",
    `${border("#1d1b17", 30, 6)}${border("#1d1b17", 70, 4)}<g stroke="#1d1b17" stroke-width="3">${hatch}</g>
     ${petals}<circle cx="600" cy="375" r="38" fill="#2f6b3a" stroke="#1d1b17" stroke-width="4"/>
     ${fish(330, 380, 1, "#c8372d")}${fish(870, 380, -1, "#2f6b3a")}`,
  );
}

function gond() {
  // A tree and a deer, filled with dot-and-dash patterns.
  const r = rng(7);
  let dots = "";
  for (let i = 0; i < 900; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 230;
    dots += `<circle cx="${(600 + Math.cos(a) * d).toFixed(1)}" cy="${(300 + Math.sin(a) * d * 0.8).toFixed(1)}" r="${(2 + r() * 3).toFixed(1)}"/>`;
  }
  let dashes = "";
  for (let y = 470; y < 700; y += 14) dashes += `<path d="M560 ${y} l80 0" stroke-dasharray="10 8"/>`;
  return svg(
    "Gond",
    "#14324a",
    `<ellipse cx="600" cy="300" rx="250" ry="200" fill="#e9a33b"/>
     <g fill="#14324a">${dots}</g>
     <rect x="560" y="460" width="80" height="250" fill="#c94f3d"/><g stroke="#f6efe0" stroke-width="5">${dashes}</g>
     <g transform="translate(900 520)" fill="#5fae9b" stroke="#f6efe0" stroke-width="4">
       <path d="M-110 0 Q-110 -70 0 -70 Q90 -70 100 -10 L100 60 L80 60 L75 0 L-70 0 L-75 60 L-95 60Z"/>
       <path d="M80 -60 L120 -150 M100 -65 L150 -130" fill="none"/>
       ${[-80, -50, -20, 10, 40, 70].map((x) => `<circle cx="${x}" cy="-35" r="6" fill="#f6efe0"/>`).join("")}
     </g>`,
    "#f6efe0",
  );
}

function pattachitra() {
  // Ornate red frame with a temple arch and two stylised figures.
  let scallops = "";
  for (let x = 60; x < W - 60; x += 40) scallops += `<path d="M${x} 90 a20 20 0 0 1 40 0" fill="none"/>`;
  const figure = (x, c) => `<g transform="translate(${x} 0)" stroke="#1d1b17" stroke-width="4">
    <circle cx="0" cy="300" r="42" fill="#f0c9a0"/><path d="M-30 270 Q0 230 30 270" fill="#1d1b17"/>
    <path d="M-60 350 L60 350 L90 600 L-90 600Z" fill="${c}"/>
    <path d="M-60 370 L-120 470 M60 370 L120 470" fill="none" stroke-width="10" stroke-linecap="round"/>
    ${[400, 450, 500, 550].map((y) => `<path d="M-70 ${y} L70 ${y}" stroke="#f2d16b"/>`).join("")}</g>`;
  return svg(
    "Pattachitra",
    "#a8261d",
    `<rect x="50" y="50" width="${W - 100}" height="${H - 100}" fill="#f3e3c3" stroke="#1d1b17" stroke-width="6"/>
     <g stroke="#a8261d" stroke-width="4">${scallops}</g>
     <path d="M250 640 L250 260 Q600 100 950 260 L950 640" fill="none" stroke="#2c5b8c" stroke-width="14"/>
     ${figure(470, "#2c5b8c")}${figure(730, "#2f7a4a")}`,
  );
}

function kalamkari() {
  // Indigo and madder vines with large paisley flowers.
  const r = rng(11);
  let vines = "";
  for (let i = 0; i < 6; i++) {
    const y = 120 + i * 100;
    vines += `<path d="M40 ${y} C300 ${y - 80} 500 ${y + 80} 800 ${y} S1100 ${y - 60} 1180 ${y}" fill="none" stroke="#2b3f6b" stroke-width="5"/>`;
    for (let k = 0; k < 5; k++) {
      const x = 120 + k * 230 + r() * 60;
      vines += `<path d="M${x} ${y} q30 -60 70 -20 q-20 50 -70 20z" fill="${k % 2 ? "#a23a2a" : "#c98b2b"}" stroke="#1d1b17" stroke-width="2"/>`;
    }
  }
  return svg("Kalamkari", "#efe2c6", `${border("#2b3f6b", 26, 8)}${vines}`);
}

/* ---------------- Crafts & textiles ---------------- */

function terracotta() {
  const pot = (x, w, h, c) => `<g transform="translate(${x} 640)" stroke="#5a2c17" stroke-width="4" fill="${c}">
    <path d="M${-w * 0.3} ${-h} L${w * 0.3} ${-h} Q${w * 0.35} ${-h * 0.85} ${w * 0.5} ${-h * 0.6} Q${w * 0.6} ${-h * 0.2} ${w * 0.3} 0 L${-w * 0.3} 0 Q${-w * 0.6} ${-h * 0.2} ${-w * 0.5} ${-h * 0.6} Q${-w * 0.35} ${-h * 0.85} ${-w * 0.3} ${-h}Z"/>
    <path d="M${-w * 0.45} ${-h * 0.5} L${w * 0.45} ${-h * 0.5}" stroke="#f3dcc0" stroke-dasharray="12 10"/></g>`;
  return svg(
    "Terracotta pottery",
    "#f3dcc0",
    `<rect y="640" width="${W}" height="${H - 640}" fill="#c9a27a"/>
     ${pot(230, 240, 300, "#b5562e")}${pot(520, 300, 420, "#c8683a")}${pot(820, 220, 260, "#a64b26")}${pot(1030, 160, 200, "#bf5f34")}`,
    "#5a2c17",
  );
}

function handloom() {
  let warp = "";
  const colors = ["#b23a48", "#e3a33b", "#2d5d7b", "#f2ead8", "#3e7a5c"];
  for (let x = 0; x < W; x += 24) warp += `<rect x="${x}" y="0" width="12" height="${H}" fill="${colors[(x / 24) % 5]}" opacity="0.85"/>`;
  let weft = "";
  for (let y = 0; y < H; y += 24) weft += `<rect x="0" y="${y}" width="${W}" height="12" fill="${colors[(y / 24 + 2) % 5]}" opacity="0.55"/>`;
  return svg("Handloom weaving", "#f2ead8", `${warp}${weft}<rect x="80" y="300" width="${W - 160}" height="90" fill="#1d1b17" opacity="0.8"/><g fill="#e3a33b">${Array.from({ length: 22 }, (_, i) => `<path d="M${120 + i * 45} 345 l15 -25 l15 25 l-15 25z"/>`).join("")}</g>`);
}

function chikankari() {
  // White shadow-work flowers on pastel muslin.
  const flower = (x, y, s) =>
    `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="#ffffff" stroke-width="3">
    ${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="14" ry="34" transform="rotate(${a}) translate(0 -36)"/>`).join("")}
    <circle r="10" fill="#ffffff"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<circle r="3" fill="#ffffff" transform="rotate(${a}) translate(0 -90)"/>`).join("")}</g>`;
  let field = "";
  for (let y = 120; y < H; y += 200) for (let x = 120; x < W; x += 240) field += flower(x + ((y / 200) % 2) * 120, y, 0.9);
  return svg("Chikankari embroidery", "#b8cfc4", `${field}<path d="M0 ${H - 60} C300 ${H - 120} 900 ${H} ${W} ${H - 80}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 8"/>`);
}

/* ---------------- Dance & performance ---------------- */

const stage = (bg, floor) => `<rect width="${W}" height="${H}" fill="${bg}"/><path d="M0 580 L${W} 580 L${W} ${H} L0 ${H}Z" fill="${floor}"/>
<path d="M600 0 L250 580 L950 580Z" fill="#fff4d6" opacity="0.18"/>`;

function kathak() {
  // A spinning dancer: flared skirt drawn as concentric arcs.
  let skirt = "";
  for (let i = 0; i < 9; i++) skirt += `<path d="M${600 - 40 - i * 22} ${380 + i * 20} Q600 ${430 + i * 32} ${600 + 40 + i * 22} ${380 + i * 20}" fill="none" stroke="${i % 2 ? "#e3a33b" : "#c8372d"}" stroke-width="10"/>`;
  return svg("Kathak", "#2a2140", `${stage("#2a2140", "#3d3058")}<circle cx="600" cy="250" r="40" fill="#f0c9a0"/><path d="M570 300 L630 300 L640 390 L560 390Z" fill="#c8372d"/>
    <path d="M570 310 L470 230 M630 310 L730 230" stroke="#f0c9a0" stroke-width="14" stroke-linecap="round"/>${skirt}`, "#f6efe0");
}

function bharatanatyam() {
  // Half-seated pose (aramandi) with a fanned pleat.
  return svg("Bharatanatyam", "#3b1e2b", `${stage("#3b1e2b", "#55303f")}
    <circle cx="600" cy="220" r="40" fill="#e8b98f"/><path d="M565 270 L635 270 L650 380 L550 380Z" fill="#e3a33b"/>
    <path d="M565 285 L460 285 L430 220 M635 285 L740 285 L770 220" fill="none" stroke="#e8b98f" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M550 380 L470 470 L520 570 M650 380 L730 470 L680 570" fill="none" stroke="#c8372d" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M600 385 L${540 + i * 20} 520" stroke="#2f7a4a" stroke-width="10"/>`).join("")}`, "#f6efe0");
}

function lavani() {
  // Dancer in a nine-yard sari beside a dholki drum.
  return svg("Lavani", "#4a1630", `${stage("#4a1630", "#6a2343")}
    <circle cx="520" cy="210" r="38" fill="#e2b48a"/><path d="M490 255 L560 255 L600 420 L470 420Z" fill="#2f7a4a"/>
    <path d="M470 420 L440 570 L500 570 L530 450 L560 570 L620 570 L600 420Z" fill="#e3a33b"/>
    <path d="M490 270 L410 200 M560 270 L640 330" stroke="#e2b48a" stroke-width="13" stroke-linecap="round"/>
    <g transform="translate(830 500)"><rect x="-110" y="-55" width="220" height="110" rx="55" fill="#a2552a" stroke="#f6efe0" stroke-width="5"/>
    ${[-70, -35, 0, 35, 70].map((x) => `<path d="M${x} -55 L${x + 20} 55" stroke="#f6efe0" stroke-width="3"/>`).join("")}</g>`, "#f6efe0");
}

function kathputli() {
  // Two string puppets hanging from a wooden bar.
  const puppet = (x, c) => `<g transform="translate(${x} 0)">
    <path d="M-40 110 L-40 260 M40 110 L40 260 M0 110 L0 230" stroke="#f6efe0" stroke-width="2"/>
    <circle cx="0" cy="270" r="40" fill="#f0c9a0" stroke="#1d1b17" stroke-width="3"/><path d="M-25 262 l10 0 M15 262 l10 0" stroke="#1d1b17" stroke-width="5"/>
    <path d="M-60 320 L60 320 L100 540 L-100 540Z" fill="${c}" stroke="#1d1b17" stroke-width="3"/>
    ${[360, 400, 440, 480, 520].map((y) => `<path d="M-90 ${y} L90 ${y}" stroke="#f2d16b" stroke-width="4" stroke-dasharray="8 6"/>`).join("")}</g>`;
  return svg("Kathputli puppetry", "#1f3a3a", `${stage("#1f3a3a", "#2c5050")}<rect x="250" y="95" width="700" height="18" rx="9" fill="#8a5a2b"/>${puppet(430, "#c8372d")}${puppet(770, "#e3a33b")}`, "#f6efe0");
}

/* ---------------- Music (poster + tune) ---------------- */

function musicPoster(label, bg, instrument) {
  let waves = "";
  for (let i = 0; i < 6; i++) waves += `<path d="M0 ${560 + i * 22} C200 ${520 + i * 22} 400 ${600 + i * 22} 600 ${560 + i * 22} S1000 ${520 + i * 22} ${W} ${560 + i * 22}" fill="none" stroke="#f6efe0" stroke-width="3" opacity="${0.8 - i * 0.12}"/>`;
  return svg(label, bg, `${waves}${instrument}`, "#f6efe0");
}
const instruments = {
  "marathi-folk": `<g transform="translate(600 320)"><rect x="-230" y="-120" width="460" height="240" rx="120" fill="#a2552a" stroke="#f6efe0" stroke-width="6"/>
    ${[-150, -75, 0, 75, 150].map((x) => `<path d="M${x} -120 L${x + 40} 120" stroke="#f6efe0" stroke-width="4"/>`).join("")}<ellipse cx="-230" cy="0" rx="30" ry="120" fill="#e9d3a8"/><ellipse cx="230" cy="0" rx="30" ry="120" fill="#e9d3a8"/></g>`,
  baul: `<g transform="translate(600 330)"><ellipse cx="0" cy="130" rx="90" ry="60" fill="#c98b2b" stroke="#f6efe0" stroke-width="5"/>
    <path d="M-60 120 L-20 -230 M60 120 L20 -230" stroke="#e9d3a8" stroke-width="16" stroke-linecap="round"/><path d="M0 130 L0 -230" stroke="#f6efe0" stroke-width="3"/></g>`,
  hindustani: `<g transform="translate(600 300)"><circle cx="0" cy="170" r="120" fill="#c98b2b" stroke="#f6efe0" stroke-width="5"/>
    <rect x="-22" y="-260" width="44" height="320" fill="#7a4a24"/>${[-12, -4, 4, 12].map((x) => `<path d="M${x} -255 L${x} 280" stroke="#f6efe0" stroke-width="2"/>`).join("")}</g>`,
  carnatic: `<g transform="translate(600 320) rotate(-20)"><circle cx="-260" cy="0" r="80" fill="#c98b2b" stroke="#f6efe0" stroke-width="5"/><circle cx="260" cy="0" r="60" fill="#c98b2b" stroke="#f6efe0" stroke-width="5"/>
    <rect x="-260" y="-24" width="520" height="48" rx="20" fill="#7a4a24"/>${[-14, -5, 5, 14].map((y) => `<path d="M-250 ${y} L250 ${y}" stroke="#f6efe0" stroke-width="2"/>`).join("")}</g>`,
};
const MUSIC = {
  "marathi-folk": { label: "Marathi folk song", bg: "#5b2a1a", notes: [62, 65, 67, 69, 67, 65, 62, 0, 62, 65, 67, 72, 69, 67, 65, 0], beat: 0.32 },
  baul: { label: "Baul", bg: "#33402a", notes: [64, 0, 67, 69, 71, 69, 67, 64, 0, 62, 64, 67, 64, 62, 60, 0], beat: 0.38 },
  hindustani: { label: "Hindustani classical", bg: "#2a2a4a", notes: [60, 0, 0, 62, 64, 0, 65, 67, 0, 0, 65, 64, 62, 0, 60, 0], beat: 0.55 },
  carnatic: { label: "Carnatic", bg: "#3a2a1a", notes: [60, 62, 64, 67, 69, 72, 69, 67, 64, 62, 60, 62, 64, 62, 60, 0], beat: 0.28 },
};

function wav(notes, beat) {
  const rate = 16000;
  const out = new Int16Array(Math.floor(rate * beat * notes.length));
  notes.forEach((m, i) => {
    if (!m) return;
    const f = 440 * 2 ** ((m - 69) / 12);
    const start = Math.floor(i * beat * rate);
    for (let k = 0; k < beat * rate * 1.6 && start + k < out.length; k++) {
      const t = k / rate;
      const v = (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(4 * Math.PI * f * t) + 0.15 * Math.sin(6 * Math.PI * f * t)) * Math.exp(-3.5 * t) * 0.3;
      out[start + k] = Math.max(-32767, Math.min(32767, out[start + k] + v * 32767));
    }
  });
  const data = Buffer.from(out.buffer);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

/* ---------------- Write files ---------------- */

const images = { madhubani, gond, pattachitra, kalamkari, terracotta, handloom, chikankari, kathak, bharatanatyam, lavani, kathputli };
for (const [id, make] of Object.entries(images)) writeFileSync(join(OUT, `${id}.svg`), make());
for (const [id, m] of Object.entries(MUSIC)) {
  writeFileSync(join(OUT, `${id}.svg`), musicPoster(m.label, m.bg, instruments[id]));
  writeFileSync(join(OUT, `${id}.wav`), wav(m.notes, m.beat));
}
console.log(`Wrote ${Object.keys(images).length + Object.keys(MUSIC).length} images and ${Object.keys(MUSIC).length} tunes to ${OUT}`);
