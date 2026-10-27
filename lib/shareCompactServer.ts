/**
 * Server-only. Reads a link's parameters, in either form: readable (`?name=…&letter=…`)
 * or compact (`?z=…`). Everything goes through decodeShare(), so the same cleaning and
 * limits apply to both.
 */
import { inflateSync } from "node:zlib";
import { decodeShare, paramsFromCompactJson, toParams, type RawParams, type ShareData } from "./share";

/** A compressed link can never expand to more than this many bytes of JSON. */
const MAX_JSON_BYTES = 64 * 1024;

function inflateCompact(token: string): URLSearchParams | null {
  if (!/^[A-Za-z0-9_-]{1,16000}$/.test(token)) return null;
  try {
    const json = inflateSync(Buffer.from(token, "base64url"), { maxOutputLength: MAX_JSON_BYTES }).toString("utf8");
    return paramsFromCompactJson(json);
  } catch {
    // Not valid compressed data (a damaged or hand-typed link), or it expands too far.
    return null;
  }
}

/**
 * True when the link has a compact `z` part that can't be read, usually because a chat app
 * cut the link short or changed a character. The page then says so instead of showing an
 * empty birthday.
 */
export function isDamagedShare(raw: RawParams): boolean {
  const z = toParams(raw).get("z");
  return Boolean(z) && inflateCompact(z as string) === null;
}

export function decodeAnyShare(raw: RawParams): ShareData {
  const p = toParams(raw);
  const z = p.get("z");
  if (z) return decodeShare(inflateCompact(z) ?? new URLSearchParams());
  return decodeShare(p);
}
