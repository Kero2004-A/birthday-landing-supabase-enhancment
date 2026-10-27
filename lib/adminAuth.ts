import { timingSafeEqual } from "node:crypto";

/** If ADMIN_KEY is set on the server, the request must carry the same key in `x-admin-key`. */
export function keyAllowed(req: Request): boolean {
  const want = process.env.ADMIN_KEY;
  if (!want) return true;
  const got = Buffer.from(req.headers.get("x-admin-key") ?? "");
  const exp = Buffer.from(want);
  return got.length === exp.length && timingSafeEqual(got, exp);
}
