import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
const mediaDirectory = () => join(process.env.KAREGHAR_DATA_DIR || ".kareghar", "media");
const formats = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  mp4: "video/mp4",
} as const;
export type Extension = keyof typeof formats;
function detect(data: Buffer): Extension | undefined {
  if (data.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "png";
  if (data.subarray(0, 3).toString("hex") === "ffd8ff") return "jpg";
  if (data.toString("ascii", 0, 4) === "RIFF") {
    if (data.toString("ascii", 8, 12) === "WEBP") return "webp";
    if (data.toString("ascii", 8, 12) === "WAVE") return "wav";
  }
  if (data.toString("ascii", 4, 8) === "ftyp") return "mp4";
  if (
    data.toString("ascii", 0, 3) === "ID3" ||
    (data[0] === 255 && (data[1] & 224) === 224)
  )
    return "mp3";
}
function remote(key: string) {
  const base = process.env.SUPABASE_URL,
    secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !secret) throw Error("Supabase Storage configuration missing");
  return {
    url: base + "/storage/v1/object/kareghar/" + key,
    headers: { Authorization: "Bearer " + secret, apikey: secret },
  };
}
export async function saveMedia(file: File, photo: boolean) {
  if (!file.size || file.size > 5 * 1024 * 1024) return null;
  const bytes = Buffer.from(await file.arrayBuffer()),
    ext = detect(bytes);
  if (!ext || (photo && !formats[ext].startsWith("image/"))) return null;
  const key = randomUUID() + "." + ext;
  if (process.env.DATABASE_URL) {
    const { url, headers } = remote(key);
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": formats[ext] },
      body: new Uint8Array(bytes),
    });
    if (!response.ok) throw Error("Media upload failed");
  } else {
    await mkdir(mediaDirectory(), { recursive: true });
    await writeFile(join(mediaDirectory(), key), bytes);
  }
  return key;
}
export async function removeMedia(key: string) {
  if (!key) return;
  if (process.env.DATABASE_URL) {
    const { url, headers } = remote(key);
    const result = await fetch(url, { method: "DELETE", headers });
    if (!result.ok) throw Error("Media cleanup failed");
  } else await unlink(join(mediaDirectory(), key));
}
export async function mediaResponse(key: string) {
  const type = formats[key.split(".").pop() as Extension];
  const headers = {
    "Content-Type": type,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (process.env.DATABASE_URL) {
    const remoteFile = remote(key),
      response = await fetch(remoteFile.url, {
        headers: remoteFile.headers,
        cache: "no-store",
      });
    if (!response.ok) return new Response(null, { status: 404 });
    return new Response(response.body, { headers });
  }
  return new Response(
    new Uint8Array(await readFile(join(mediaDirectory(), key))),
    { headers },
  );
}
