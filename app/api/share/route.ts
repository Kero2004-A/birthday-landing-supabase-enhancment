import { keyAllowed } from "@/lib/adminAuth";
import { parseShareBody, saveShare } from "@/lib/shareStore";
import { supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const json = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Creates a birthday page. The body is the compact JSON from toCompactJson(); the reply is
 * { id }, and the finished link is <site>/b/<id>.
 */
export async function POST(req: Request) {
  if (!supabaseConfigured()) return json({ error: "supabase_not_configured" }, 501);
  // On a public server nobody may create pages unless an ADMIN_KEY protects the form.
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_KEY) return json({ error: "admin_key_not_set" }, 501);
  if (!keyAllowed(req)) return json({ error: "admin_key_required" }, 401);

  if (Number(req.headers.get("content-length") ?? 0) > 128 * 1024) return json({ error: "too_large" }, 413);

  const data = parseShareBody(await req.text());
  if (!data) return json({ error: "bad_request" }, 400);

  try {
    return json({ id: await saveShare(data) });
  } catch (err) {
    console.error("saveShare failed:", err);
    return json({ error: "save_failed" }, 500);
  }
}
