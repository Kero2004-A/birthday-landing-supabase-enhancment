import type { CandleTheme } from "./candleColors";

/**
 * ✏️  EDIT THIS FILE to personalise the page. Nothing else needs to change.
 */

export type CandleConfig = {
  age: number;
  style: "numbers" | "sticks";
  /** "cake" matches the cake (pink, cream icing rim, gold dots). "stitched" is a pastel candle with dashed stitching. */
  look: "cake" | "stitched";
  colors: CandleTheme | string[];
};

export type Memory = {
  title: string;
  message: string;
  /** Small label above the title, e.g. "Summer 2023". */
  date?: string;
  /** Path in /public (e.g. "/photos/1.jpg") or a full URL. Leave empty for a pretty placeholder. */
  src?: string;
  /** Emoji shown on the placeholder when there is no photo. */
  emoji?: string;
};

export type LetterData = {
  title: string;
  /** "{name}" is replaced with the birthday person's name. */
  greeting: string;
  paragraphs: string[];
  signOff: string;
  from: string;
};

export const config = {
  /** The birthday person's name. */
  name: "Alex",

  /**
   * The candles on the cake.
   * Try things out live at http://localhost:3000/candles and paste the result here.
   */
  candles: {
    /** Their age. 21 gives a "2" and a "1" candle (or 21 small candles with style "sticks"). */
    age: 21,

    /**
     * "numbers" = chunky number candles, e.g. a "2" and a "1" (works for 1 to 999).
     * "sticks"  = one small candle per year, arranged in rows automatically
     *             (switches to numbers by itself above 40).
     */
    style: "numbers",

    /**
     * "cake"     = made to match the cake: pink body, cream icing rim, gold dots.
     * "stitched" = soft pastel candles with dashed white stitching.
     */
    look: "cake",

    /**
     * Colours. Either a theme name:
     *   "cake" | "pastel" | "candy" | "sunset" | "ocean" | "gold" | "rose"
     * or your own list of hex colours, one per digit:  ["#ff6b8b", "#3ec1d3"]
     */
    colors: "cake",
  } as CandleConfig,

  /**
   * When the surprise opens. Until then the page sits blurred behind a live
   * days / hours / minutes / seconds countdown.
   * Use an ISO date WITH your UTC offset, e.g. "2026-12-25T00:00:00+02:00".
   * Set to null to skip the wait (good for testing).
   */
  revealDate: null as string | null,

  /** Seconds in the short 3-2-1 style countdown after "Open it". */
  countdownSeconds: 5,

  /** Put your song in /public and point to it here. */
  musicSrc: "/birthday-song.mp3",

  /** Shown on the opening screen. */
  introLine: "Someone made something for you",

  /**
   * Fallback only. If /public/memories has folders, those are used instead
   * (see README). Delete this list once you have your own folders.
   */
  memories: [
    {
      date: "Where it began",
      title: "The Beginning",
      message:
        "Every great story starts somewhere. Mine just got a lot better the day you showed up.",
      emoji: "🌟",
      src: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=900&auto=format&fit=crop",
    },
    {
      date: "Road trip",
      title: "Unforgettable Moments",
      message:
        "Remember this one? Still one of my favourite days, and I'd do it all again in a heartbeat.",
      emoji: "🚗",
      src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=900&auto=format&fit=crop",
    },
    {
      date: "Always",
      title: "Pure Joy & Laughter",
      message:
        "You have a way of making every room lighter. People feel it the second you walk in.",
      emoji: "😂",
      src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&auto=format&fit=crop",
    },
    {
      date: "What's next",
      title: "To Another Great Year",
      message:
        "Here's to even more incredible memories together in the year ahead.",
      emoji: "🥂",
      src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop",
    },
  ] satisfies Memory[],

  /**
   * Fallback only. The letter is written in content/letter.md; this is used
   * if that file is missing or empty.
   */
  letter: {
    title: "Happy Birthday!",
    greeting: "Dear {name},",
    paragraphs: [
      "Wishing you a day as wonderful as you are, and a year packed with happiness, success, and the kind of memories you'll want to keep forever.",
      "Thank you for being such a good presence in my life. I hope every dream you're carrying right now finds its way to you.",
    ],
    signOff: "With all my love,",
    from: "Someone who adores you",
  } satisfies LetterData,
};
