import { MediaStage } from "@/contract/schemas";
import { handle } from "@/server/http";
import { BadRequest, MAX_UPLOAD_BYTES, saveUpload } from "@/server/mockStore";

const ALLOWED = /^(image\/(jpeg|png|webp|heic|heif)|audio\/(mpeg|mp4|aac|ogg|webm|wav|x-wav|x-m4a)|video\/(mp4|webm|quicktime))$/;

/**
 * Upload one photo, audio clip or video (multipart/form-data):
 *   file    – the file (required)
 *   stage   – "process" | "final" (default "process")
 *   caption – optional text
 * Returns a Media object; pass its id to POST /api/submissions.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new BadRequest("Missing file");
    if (!ALLOWED.test(file.type)) throw new BadRequest(`Unsupported file type ${file.type || "unknown"}`);
    if (file.size > MAX_UPLOAD_BYTES) throw new BadRequest("File is larger than 25 MB");
    const stage = MediaStage.parse(form.get("stage") ?? "process");
    const caption = typeof form.get("caption") === "string" ? (form.get("caption") as string) : undefined;
    return saveUpload({ type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) }, { stage, caption });
  }, 201);
}
