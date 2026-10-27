/**
 * Server-only. Saves a birthday page in Supabase and reads it back by its short id.
 *
 * The row holds the same compact JSON the old `?z=` link used (see toCompactJson in share.ts),
 * and it goes through decodeShare() both when saving and when loading, so the same cleaning
 * and limits apply however the data arrives.
 */
import { randomInt } from "node:crypto";
import { decodeShare, paramsFromCompactJson, toCompactJson, type ShareData } from "./share";
import { supabase } from "./supabase";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 8; // 62^8 is about 2 x 10^14 combinations, so ids can't be guessed.
export const ID_PATTERN = /^[0-9A-Za-z]{6,32}$/;
const TABLE = "birthdays";

function newId(): string {
  let id = "";
  for (let i = 0; i < ID_LENGTH; i++) id += ALPHABET[randomInt(ALPHABET.length)];
  return id;
}

/** Cleans untrusted JSON (the compact form) into ShareData, or null if it isn't usable. */
export function parseShareBody(text: string): ShareData | null {
  const p = paramsFromCompactJson(text);
  return p ? decodeShare(p) : null;
}

export async function saveShare(data: ShareData): Promise<string> {
  const row = JSON.parse(toCompactJson(data)) as Record<string, unknown>;
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = newId();
    const { error } = await supabase().from(TABLE).insert({ id, data: row });
    if (!error) return id;
    if (error.code !== "23505") throw new Error(error.message); // 23505 = id already taken, try another
  }
  throw new Error("Could not find a free id.");
}

/** null = no such page (or the id is malformed). Throws if Supabase itself fails. */
export async function loadShare(id: string): Promise<ShareData | null> {
  if (!ID_PATTERN.test(id)) return null;
  const { data, error } = await supabase().from(TABLE).select("data").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return parseShareBody(JSON.stringify(data.data));
}
