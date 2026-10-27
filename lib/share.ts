/**
 * Everything the admin form can customise, and how it travels inside a link.
 *
 *   /?name=Sara&age=25&music=https://…/song.mp3&date=2026-12-25T00:00Z
 *     &letter=…&from=Ahmed&img=https://…/1.jpg&cap=First+trip&img=…&cap=…
 *
 * Plain search parameters, so the link can be read, edited and pasted anywhere.
 * `img` and `cap` repeat, one pair per photo, in order.
 *
 * Arabic text costs about six characters per letter in a link ("%D8%A7"), so a page written
 * in Arabic can make a very long link. When that happens the form switches by itself to the
 * compact form, `/?z=…`: the same details as compressed JSON, usually 3 to 4 times shorter.
 * The page reads both forms (see shareCompact.ts and shareCompactServer.ts).
 *
 * Used by the admin form (to build the link) and by the landing page (to read it),
 * so both always agree. This file has no Node or browser APIs, it runs anywhere.
 */

export const LIMITS = {
  name: 60,
  from: 60,
  letter: 7000,
  caption: 240,
  url: 600,
  photos: 20,
  age: 999,
} as const;

export type GalleryItem = { src: string; caption: string };

/** The admin's choice of wording language. "auto" = read it from the text. */
export type LangChoice = "auto" | "en" | "ar";
/** The admin's choice of text direction. "auto" = follow the language. */
export type DirChoice = "auto" | "ltr" | "rtl";

export type ShareData = {
  name: string;
  /** null = not given */
  age: number | null;
  /** audio file URL (or a /path inside this site's public folder) */
  music: string;
  /** ISO date-time, e.g. 2026-12-25T00:00Z. Empty = no waiting. */
  date: string;
  letter: string;
  from: string;
  gallery: GalleryItem[];
  lang: LangChoice;
  dir: DirChoice;
};

export type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

const KEYS = ["name", "age", "music", "date", "letter", "from", "img", "cap", "z", "lang", "dir"];

export function toParams(raw: RawParams): URLSearchParams {
  if (raw instanceof URLSearchParams) return raw;
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((v) => p.append(key, v));
    else if (value !== undefined) p.append(key, value);
  }
  return p;
}

/** True if the link carries any of our parameters (so it is a "custom" page, not the demo). */
export function hasShareParams(raw: RawParams): boolean {
  const p = toParams(raw);
  return KEYS.some((k) => p.has(k));
}

/** Plain text with sane limits and no control characters. */
function clean(value: string | null | undefined, max: number): string {
  return (value ?? "")
    .replace(/\r\n?/g, "\n")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

/**
 * Only http(s) links and paths inside this site ("/music/song.mp3") are allowed.
 * Anything else (javascript:, data:, //host…) becomes "".
 */
export function safeUrl(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (!v || v.length > LIMITS.url) return "";
  if (/^https?:\/\//i.test(v)) {
    try {
      return new URL(v).toString() === "" ? "" : v;
    } catch {
      return "";
    }
  }
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  return "";
}

function cleanDate(value: string | null | undefined): string {
  const v = clean(value, 40);
  if (!v) return "";
  const t = Date.parse(v);
  return Number.isNaN(t) ? "" : new Date(t).toISOString();
}

function cleanAge(value: string | null | undefined): number | null {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(n, LIMITS.age);
}

/** Read and sanitise everything from a link's search parameters. */
export function decodeShare(raw: RawParams): ShareData {
  const p = toParams(raw);
  const imgs = p.getAll("img");
  const caps = p.getAll("cap");

  const gallery: GalleryItem[] = [];
  const count = Math.min(Math.max(imgs.length, caps.length), LIMITS.photos);
  for (let i = 0; i < count; i++) {
    const src = safeUrl(imgs[i]);
    const caption = clean(caps[i], LIMITS.caption);
    if (src || caption) gallery.push({ src, caption });
  }

  return {
    name: clean(p.get("name"), LIMITS.name),
    age: cleanAge(p.get("age")),
    music: safeUrl(p.get("music")),
    date: cleanDate(p.get("date")),
    letter: clean(p.get("letter"), LIMITS.letter),
    from: clean(p.get("from"), LIMITS.from),
    gallery,
    lang: p.get("lang") === "en" || p.get("lang") === "ar" ? (p.get("lang") as LangChoice) : "auto",
    dir: p.get("dir") === "ltr" || p.get("dir") === "rtl" ? (p.get("dir") as DirChoice) : "auto",
  };
}

/** The details as small JSON with short keys, for the compact `z` form. Empty fields are left out. */
export function toCompactJson(data: ShareData): string {
  const o: Record<string, unknown> = {};
  if (data.name) o.n = data.name;
  if (data.age) o.a = data.age;
  if (data.music) o.m = data.music;
  if (data.date) o.d = data.date;
  if (data.letter) o.l = data.letter;
  if (data.from) o.f = data.from;
  if (data.gallery.length > 0) o.g = data.gallery.map((g) => [g.src, g.caption]);
  if (data.lang !== "auto") o.lg = data.lang;
  if (data.dir !== "auto") o.dr = data.dir;
  return JSON.stringify(o);
}

/**
 * Reads that JSON back into ordinary search parameters, so decodeShare() cleans and limits
 * it exactly like a normal link. Anything unexpected is ignored. Returns null if it isn't JSON.
 */
export function paramsFromCompactJson(json: string): URLSearchParams | null {
  let o: unknown;
  try {
    o = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof o !== "object" || o === null || Array.isArray(o)) return null;
  const r = o as Record<string, unknown>;
  const p = new URLSearchParams();
  const text = (key: string, short: string) => {
    if (typeof r[short] === "string") p.set(key, r[short] as string);
  };
  text("name", "n");
  text("music", "m");
  text("date", "d");
  text("letter", "l");
  text("from", "f");
  text("lang", "lg");
  text("dir", "dr");
  if (typeof r.a === "number" || typeof r.a === "string") p.set("age", String(r.a));
  if (Array.isArray(r.g)) {
    for (const item of r.g.slice(0, LIMITS.photos)) {
      const [src, cap] = Array.isArray(item) ? item : [];
      p.append("img", typeof src === "string" ? src : "");
      p.append("cap", typeof cap === "string" ? cap : "");
    }
  }
  return p;
}

/** Turn the form's values into a query string (without the leading "?"). Empty fields are left out. */
export function encodeShare(data: ShareData): string {
  const p = new URLSearchParams();
  if (data.name) p.set("name", data.name);
  if (data.age) p.set("age", String(data.age));
  if (data.music) p.set("music", data.music);
  if (data.date) p.set("date", data.date.replace(/:\d{2}\.\d{3}Z$/, "Z")); // 2026-12-25T00:00Z, shorter
  if (data.letter) p.set("letter", data.letter);
  if (data.from) p.set("from", data.from);
  if (data.lang !== "auto") p.set("lang", data.lang);
  if (data.dir !== "auto") p.set("dir", data.dir);
  for (const item of data.gallery) {
    p.append("img", item.src);
    p.append("cap", item.caption);
  }
  return p.toString();
}
