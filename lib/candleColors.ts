/**
 * Colour themes for the number candles, plus tiny helpers.
 * Add your own theme by adding a line to CANDLE_THEMES.
 *
 * Colours are given per digit, in order: the first colour is the first digit,
 * the second colour is the second digit, and so on (they repeat if there are more digits).
 */

export type CandleTheme = "cake" | "pastel" | "candy" | "sunset" | "ocean" | "gold" | "rose";

export const CANDLE_THEMES: Record<CandleTheme, string[]> = {
  // The same pinks as the cake itself.
  cake: ["#ff7b9c", "#ff8fa9"],
  pastel: ["#f9b6a2", "#7cc7cb", "#fadb8e", "#f9a9b3", "#92dcf0", "#a8d3a0", "#f98f78", "#d3e079"],
  candy: ["#ff6b8b", "#ffb703", "#3ec1d3", "#8e6bff", "#2ecc71", "#ff7a45"],
  sunset: ["#ff8a5c", "#ff5e7e", "#ffb36b", "#c75bd6"],
  ocean: ["#4cc9f0", "#4895ef", "#72efdd", "#5390d9"],
  gold: ["#f7d774", "#e8b94a", "#ffe9a8"],
  rose: ["#ff9fb8", "#ff7b9c", "#ffc2d1"],
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A theme name or your own list of hex colours -> a clean list of hex colours. */
export function resolveColors(colors: CandleTheme | string[]): string[] {
  const list = Array.isArray(colors) ? colors : CANDLE_THEMES[colors] ?? [];
  const valid = list.map((c) => c.trim()).filter((c) => HEX.test(c));
  return valid.length > 0 ? valid : CANDLE_THEMES.pastel;
}

function parse(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mix a colour with black (amount < 0) or white (amount > 0). Range -1 to 1. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = parse(hex);
  const target = amount < 0 ? 0 : 255;
  const p = Math.min(1, Math.abs(amount));
  const mix = (c: number) => Math.round(c + (target - c) * p);
  return "#" + [mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
