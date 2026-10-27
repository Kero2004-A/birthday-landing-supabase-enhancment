/**
 * Language + direction. By default there is nothing to pick: we look at the letters of the
 * text itself. The admin can override either one for a page (see Force below).
 *
 *   detectLang("سارة")            -> "ar"   (right-to-left, Cairo / Amiri fonts)
 *   detectLang("Happy birthday")  -> "en"   (left-to-right)
 *   detectLang("🎂 2026")         -> null   (no letters, so nothing to decide)
 *
 * Mixed text goes to whichever script has more letters; on a tie the first letter decides.
 */

export type Lang = "ar" | "en";
export type Dir = "ltr" | "rtl";

// Arabic script (also covers Persian / Urdu letters) and Latin letters with accents.
const AR = "\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF";
const LA = "A-Za-z\\u00C0-\\u024F";

const AR_ALL = new RegExp(`[${AR}]`, "g");
const LA_ALL = new RegExp(`[${LA}]`, "g");
const FIRST_STRONG = new RegExp(`[${AR}${LA}]`);
const IS_AR = new RegExp(`[${AR}]`);

/** Which script the text is written in, or null if it has no letters at all. */
export function detectLang(text: string): Lang | null {
  const ar = (text.match(AR_ALL) ?? []).length;
  const la = (text.match(LA_ALL) ?? []).length;
  if (ar === 0 && la === 0) return null;
  if (ar !== la) return ar > la ? "ar" : "en";

  const first = text.search(FIRST_STRONG);
  return first >= 0 && IS_AR.test(text[first]) ? "ar" : "en";
}

export const dirOf = (lang: Lang): Dir => (lang === "ar" ? "rtl" : "ltr");

/**
 * What the admin chose for a page. null = automatic (detect from the text).
 * The two are independent: forcing only the direction keeps each text's detected language.
 */
export type Force = { lang: Lang | null; dir: Dir | null };
export const NO_FORCE: Force = { lang: null, dir: null };

/**
 * Attributes to spread on an element that shows user text:
 *   <p {...langProps(text, pageLang)}>{text}</p>
 * Text with no letters (just numbers or emoji) simply follows the page.
 * Whatever the admin forced wins over what is detected.
 */
export function langProps(text: string, fallback: Lang = "en", force: Force = NO_FORCE): { lang: Lang; dir: Dir } {
  const lang = force.lang ?? detectLang(text) ?? fallback;
  return { lang, dir: force.dir ?? dirOf(lang) };
}

/** The language that most of the given texts are written in (English if there are no letters). */
export function dominantLang(texts: string[]): Lang {
  return detectLang(texts.join(" \n ")) ?? "en";
}
