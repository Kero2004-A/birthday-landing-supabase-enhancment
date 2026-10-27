import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { keyAllowed } from "@/lib/adminAuth";
import { MEDIA_BUCKET, supabase, supabaseConfigured } from "@/lib/supabase";
import { KINDS, MB, MIME, UPLOAD_DIR, uploadsEnabled } from "@/lib/uploads";

export const runtime = "nodejs";

const json = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (!uploadsEnabled()) return json({ error: "uploads_disabled" }, 501);
  if (!keyAllowed(req)) return json({ error: "admin_key_required" }, 401);

  // Refuse huge bodies before reading them.
  if (Number(req.headers.get("content-length") ?? 0) > 16 * MB) return json({ error: "too_large" }, 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const kind = form.get("kind");
  const file = form.get("file");
  if ((kind !== "audio" && kind !== "image") || !(file instanceof File)) return json({ error: "bad_request" }, 400);

  const rule = KINDS[kind];
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!Object.hasOwn(rule.types, ext)) return json({ error: "bad_type", allowed: Object.keys(rule.types) }, 415);
  if (file.size === 0 || file.size > rule.max) return json({ error: "too_large", maxMb: rule.max / MB }, 413);

  const name = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (supabaseConfigured()) {
    const { error } = await supabase()
      .storage.from(MEDIA_BUCKET)
      .upload(name, bytes, { contentType: MIME[ext], cacheControl: "31536000", upsert: false });
    if (error) {
      console.error("Supabase upload failed:", error.message);
      return json({ error: "upload_failed" }, 500);
    }
    return json({ url: supabase().storage.from(MEDIA_BUCKET).getPublicUrl(name).data.publicUrl });
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), bytes);
  } catch {
    // No writable disk (for example on Vercel).
    return json({ error: "upload_failed" }, 500);
  }

  return json({ url: `/api/files/${name}` });
}
