import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { FILE_NAME, MIME, UPLOAD_DIR } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * Serves a file saved by /api/upload. Supports byte ranges, which iPhones need
 * before they will play audio, and lets the player seek.
 */
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!FILE_NAME.test(name)) return new Response("Not found", { status: 404 });

  const file = path.join(UPLOAD_DIR, name);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  let start = 0;
  let end = size - 1;
  let status = 200;

  const range = req.headers.get("range");
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    const bad = () => new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    if (!m || (m[1] === "" && m[2] === "")) return bad();
    if (m[1] === "") {
      start = Math.max(0, size - Number(m[2])); // "last N bytes"
    } else {
      start = Number(m[1]);
      if (m[2] !== "") end = Math.min(Number(m[2]), size - 1);
    }
    if (start > end || start >= size) return bad();
    status = 206;
  }

  const headers: Record<string, string> = {
    "Content-Type": MIME[name.split(".").pop() as string],
    "Content-Length": String(end - start + 1),
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  if (status === 206) headers["Content-Range"] = `bytes ${start}-${end}/${size}`;

  const body = Readable.toWeb(createReadStream(file, { start, end })) as unknown as ReadableStream;
  return new Response(body, { status, headers });
}
