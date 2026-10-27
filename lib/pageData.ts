/**
 * Server-only. Decides what the landing page shows.
 *
 *   • Opened as /b/<id> (made by /admin)             -> everything comes from the Supabase row.
 *   • Opened with old link parameters (?name=…, ?z=…) -> everything comes from the link, still supported.
 *   • Opened plain (just "/")                       -> the demo from lib/config.ts,
 *                                                      public/memories and content/letter.md.
 */

import { config, type CandleConfig, type LetterData, type Memory } from "./config";
import { dirOf, dominantLang, NO_FORCE, type Dir, type Force, type Lang } from "./direction";
import { UI, type Ui } from "./i18n";
import { letterFromFile } from "./letter";
import { loadMemories } from "./memories";
import { hasShareParams, type RawParams, type ShareData } from "./share";
import { decodeAnyShare } from "./shareCompactServer";

export type PageData = {
  /** True when the page was built from link parameters. */
  custom: boolean;
  name: string;
  candles: CandleConfig;
  /**
   * Audio URL, or "" for no music (then there is no player or button at all).
   * A link plays only the song it carries; config.musicSrc is the song of the plain demo page.
   * If the file can't be loaded, the page hides the play / pause button by itself.
   */
  music: string;
  /** ISO date-time or null. */
  revealDate: string | null;
  countdownSeconds: number;
  memories: Memory[];
  /** null = no letter section */
  letter: LetterData | null;
  introLine: string;
  /** Language of the page's own wording: what the admin chose, otherwise detected from the content. */
  lang: Lang;
  dir: Dir;
  /** What the admin chose for the text itself (null = detect it per text). */
  force: Force;
  ui: Ui;
};

export function resolvePageData(raw: RawParams): PageData {
  if (!hasShareParams(raw)) {
    return {
      custom: false,
      name: config.name,
      candles: config.candles,
      music: config.musicSrc,
      revealDate: config.revealDate,
      countdownSeconds: config.countdownSeconds,
      memories: (() => {
        const folders = loadMemories();
        return folders.length > 0 ? folders : config.memories;
      })(),
      letter: letterFromFile() ?? config.letter,
      introLine: config.introLine,
      lang: "en",
      dir: "ltr",
      force: NO_FORCE,
      ui: UI.en,
    };
  }

  return pageDataFromShare(decodeAnyShare(raw));
}

/** Builds the page from already-cleaned details: a stored page (/b/<id>) or an old ?param link. */
export function pageDataFromShare(d: ShareData): PageData {
  // The page's wording follows the admin's choice, or else whichever language most of the typed text is in.
  const force: Force = { lang: d.lang === "auto" ? null : d.lang, dir: d.dir === "auto" ? null : d.dir };
  const lang = force.lang ?? dominantLang([d.name, d.letter, ...d.gallery.map((g) => g.caption)]);
  const ui = UI[lang];

  const memories: Memory[] = d.gallery.map((g) => ({
    title: "",
    message: g.caption,
    src: g.src || undefined,
    emoji: "💖",
  }));

  const letter: LetterData | null = d.letter
    ? {
        title: ui.letterTitle,
        greeting: ui.greeting,
        paragraphs: d.letter
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean),
        signOff: d.from ? ui.signOff : "",
        from: d.from,
      }
    : null;

  return {
    custom: true,
    name: d.name,
    candles: { ...config.candles, age: d.age ?? config.candles.age },
    music: d.music,
    revealDate: d.date || null,
    countdownSeconds: config.countdownSeconds,
    memories,
    letter,
    introLine: ui.introLine,
    lang,
    dir: force.dir ?? dirOf(lang),
    force,
    ui,
  };
}
