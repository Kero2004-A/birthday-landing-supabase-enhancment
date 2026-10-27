/**
 * Reusable candles for the cake. Give it a number and it lays them out.
 *
 *   <Candles count={21} />                                  number candles in the cake's own style
 *   <Candles count={21} look="stitched" />                a stitched, plush look instead
 *   <Candles count={21} colors="sunset" />                  pick a colour theme...
 *   <Candles count={21} colors={["#ff6b8b", "#3ec1d3"]} />  ...or your own colours, one per digit
 *   <Candles count={21} style="sticks" />                   one small candle per year, in rows
 *
 * It draws inside the cake SVG (see Cake.tsx) and relies on the #glow gradient defined there.
 * Every flame has the class "flame" and every smoke puff the class "smoke",
 * which is what Hero animates for lighting and blowing out.
 */

import { useId } from "react";
import { resolveColors, shade, type CandleTheme } from "@/lib/candleColors";

export type CandleStyle = "sticks" | "numbers";

/**
 * How number candles are decorated:
 *   "cake"     pink body, cream icing drips and gold dots, just like the cake
 *   "stitched" soft toy-like candles with a dashed white stitch
 */
export type CandleLook = "cake" | "stitched";

/** Above this many candles the sticks get too tiny, so we switch to number candles. */
export const MAX_STICKS = 40;

type Options = {
  count: number;
  style?: CandleStyle;
  look?: CandleLook;
  /** A theme name or your own list of hex colours (one per digit, repeating). */
  colors?: CandleTheme | string[];
};

// Geometry of the cake's top face (an ellipse drawn in Cake.tsx).
const CX = 160;
const TOP_Y = 130;
const RX = 84;
const RY = 16;

// The cake's own colours, reused so the candles match it.
const ICING = "#fff4e8";
const GOLD = "#ffd27a";

/** True when this count will be drawn as number candles. */
export function usesNumbers(count: number, style: CandleStyle = "numbers") {
  return style === "numbers" || Math.floor(count) > MAX_STICKS;
}

/** How many flames the cake will have (handy for timing the light-up animation). */
export function flameCount(count: number, style: CandleStyle = "numbers") {
  const n = Math.max(1, Math.floor(count));
  return usesNumbers(n, style) ? String(Math.min(n, 999)).length : n;
}

function Flame({ delay }: { delay: number }) {
  return (
    <g className="flame">
      <g className="flame-flicker" style={{ animationDelay: `${delay}s` }}>
        <circle cx="0" cy="-12" r="17" fill="url(#glow)" />
        <path d="M0 -28 C8 -17 10 -8 0 1 C-10 -8 -8 -17 0 -28Z" fill="#ff6a3d" />
        <path d="M0 -22 C6 -14 7 -7 0 0 C-7 -7 -6 -14 0 -22Z" fill="#ffae2b" />
        <path d="M0 -13 C3 -9 4 -5 0 -1 C-4 -5 -3 -9 0 -13Z" fill="#fff3b0" />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Number candles                                                     */
/* ------------------------------------------------------------------ */

/**
 * Each digit is a single centre-line drawn with a very thick, round-capped stroke,
 * which is what gives the chunky bubble look. Drawn in a 50 x 80 box (the stroke
 * adds half its width on every side). No font needed, so it looks the same everywhere.
 */
type Digit = {
  d: string;
  /** Where the wick goes: the top-most point of the centre-line. */
  wick: [number, number];
  /** Where the digit touches the cake (x in the 50 x 80 box), so the stick and shadow sit under it. */
  foot: number;
  /** How wide the contact shadow is compared to a normal digit (1 = full). */
  wide?: number;
  /** Draw the path turned upside down (a 9 is a 6 turned around). */
  flip?: boolean;
};

const SIX = "M44 6 C20 -2 2 22 2 54 C2 84 48 84 48 56 C48 30 2 28 2 54";

const DIGITS: Record<string, Digit> = {
  "0": { d: "M25 0 C42 0 50 20 50 40 C50 60 42 80 25 80 C8 80 0 60 0 40 C0 20 8 0 25 0 Z", wick: [25, 0], foot: 25 },
  "1": { d: "M3 28 L26 5 L26 80", wick: [26, 5], foot: 26, wide: 0.5 },
  "2": { d: "M3 26 C3 -4 47 -6 47 24 C47 44 22 56 3 80 L49 80", wick: [25, 2.5], foot: 26 },
  "3": { d: "M4 14 C12 -2 44 0 44 20 C44 33 32 38 18 38 C36 38 48 46 48 58 C48 80 12 86 2 66", wick: [26, 2], foot: 25 },
  "4": { d: "M38 80 L38 2 L2 56 L50 56", wick: [38, 2], foot: 38, wide: 0.45 },
  "5": { d: "M46 4 L10 4 L6 38 C18 28 32 28 40 38 C50 50 46 72 28 78 C14 84 4 74 2 66", wick: [28, 4], foot: 24 },
  "6": { d: SIX, wick: [37, 4.5], foot: 25 },
  "7": { d: "M3 6 L48 6 L20 80", wick: [27, 6], foot: 20, wide: 0.5 },
  "8": {
    d: "M25 2 C44 2 44 36 25 40 C6 36 6 2 25 2 Z M25 40 C50 44 50 80 25 80 C0 80 0 44 25 40 Z",
    wick: [25, 2],
    foot: 25,
  },
  "9": { d: SIX, wick: [25, 3.25], foot: 18, wide: 0.8, flip: true },
};

const STROKE = 20; // thickness of the digit body

/** Icing drips that run down from the top of each digit (x position, how far each drips). */
const DRIPS: [number, number][] = [
  [-8, 10],
  [4, 19],
  [16, 8],
  [28, 21],
  [40, 12],
  [52, 17],
  [63, 9],
];

function DigitCandle({
  digit,
  x,
  baseY,
  scale,
  color,
  look,
  index,
}: {
  digit: string;
  x: number;
  baseY: number;
  scale: number;
  color: string;
  look: CandleLook;
  index: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradId = `body${uid}`;
  const maskId = `shape${uid}`;

  const g = DIGITS[digit];
  const edge = shade(color, -0.24);
  const flip = g.flip ? "rotate(180 25 40)" : undefined;

  // Wick top in cake coordinates. The digit's local box has its bottom-centre at (25, 80).
  const wickTopY = baseY + (g.wick[1] - STROKE / 2 - 9 - 80) * scale;
  const wickX = x + (g.wick[0] - 25) * scale;
  const footX = x + (g.foot - 25) * scale;

  const round = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  // Soft top-to-bottom shading (a flipped 9 needs the gradient flipped back).
  const [gy1, gy2] = g.flip ? [90, -10] : [-10, 90];
  const body = look === "stitched" ? color : `url(#${gradId})`;

  return (
    <g>
      {/* soft shadow on the cake */}
      <ellipse cx={footX + 2} cy={baseY + 9} rx={27 * scale * (g.wide ?? 1) + 2} ry={5.5 * scale + 1} fill="#000" opacity="0.2" />

      {/* little stick that goes into the cake */}
      <rect x={footX - 2.2} y={baseY + 2} width="4.4" height="9" rx="2.2" fill={shade(color, 0.35)} />

      <g transform={`translate(${x} ${baseY}) scale(${scale}) translate(-25 -80)`}>
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1={gy1} x2="0" y2={gy2}>
            <stop offset="0%" stopColor={shade(color, 0.16)} />
            <stop offset="100%" stopColor={shade(color, -0.1)} />
          </linearGradient>
          {look === "cake" && (
            <mask id={maskId} maskUnits="userSpaceOnUse" x="-30" y="-30" width="110" height="140">
              <path d={g.d} transform={flip} stroke="#fff" strokeWidth={STROKE} {...round} />
            </mask>
          )}
        </defs>

        {/* side / edge, which gives the candle some thickness */}
        <g transform="translate(2.5 4.5)">
          <path d={g.d} transform={flip} stroke={edge} strokeWidth={STROKE} {...round} />
        </g>

        {/* body */}
        <path d={g.d} transform={flip} stroke={body} strokeWidth={STROKE} {...round} />

        {/* cake look: gold dots like the cake's, then cream icing dripping from the top */}
        {look === "cake" && (
          <>
            <path
              d={g.d}
              transform={flip}
              stroke={GOLD}
              strokeWidth="6"
              strokeDasharray="0.1 19"
              {...round}
            />
            <g mask={`url(#${maskId})`}>
              <g transform="translate(0 2.5)" fill={shade(ICING, -0.1)}>
                <rect x="-16" y="-16" width="84" height="28" />
                {DRIPS.map(([dx, h]) => (
                  <rect key={dx} x={dx - 5} y="8" width="10" height={h * 0.7 + 6} rx="5" />
                ))}
              </g>
              <g fill={ICING}>
                <rect x="-16" y="-16" width="84" height="28" />
                {DRIPS.map(([dx, h]) => (
                  <rect key={dx} x={dx - 5} y="8" width="10" height={h * 0.7 + 6} rx="5" />
                ))}
              </g>
            </g>
          </>
        )}

        {/* stitched look: a wide dashed band, then the body colour on top leaves just a thin ring */}
        {look === "stitched" && (
          <>
            <path
              d={g.d}
              transform={flip}
              stroke="#ffffff"
              strokeOpacity="0.95"
              strokeWidth={STROKE - 6}
              strokeDasharray="5 5"
              fill="none"
              strokeLinejoin="round"
            />
            <path d={g.d} transform={flip} stroke={color} strokeWidth={STROKE - 10} {...round} />
          </>
        )}

        {/* glossy highlight */}
        <g transform="translate(-2 -2.6)">
          <path d={g.d} transform={flip} stroke="#ffffff" strokeOpacity="0.36" strokeWidth="3.4" {...round} />
        </g>
      </g>

      {/* wick (not scaled with the digit so it stays thin) */}
      <rect x={wickX - 1.3} y={wickTopY} width="2.6" height="10" rx="1.3" fill="#4a3a36" />

      <circle className="smoke" cx={wickX} cy={wickTopY - 8} r="4" fill="#cfd8e3" opacity="0" />
      <g transform={`translate(${wickX} ${wickTopY + 1})`}>
        <Flame delay={(index * 0.31) % 0.9} />
      </g>
    </g>
  );
}

function Numbers({ n, colors, look }: { n: number; colors: string[]; look: CandleLook }) {
  const digits = String(Math.min(n, 999)).split("");
  const count = digits.length;
  const scale = count === 1 ? 1 : count === 2 ? 0.8 : 0.58;
  const slot = (STROKE + 50) * scale * 1.1; // width of one digit plus a little space
  const start = CX - ((count - 1) * slot) / 2;
  const baseY = TOP_Y + 6;

  return (
    <>
      {digits.map((d, i) => (
        <DigitCandle
          key={i}
          digit={d}
          x={start + i * slot}
          baseY={baseY}
          scale={scale}
          color={colors[i % colors.length]}
          look={look}
          index={i}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stick candles (one per year)                                       */
/* ------------------------------------------------------------------ */

function Stick({ x, y, scale, index, color }: { x: number; y: number; scale: number; index: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-4" y="-40" width="8" height="42" rx="2" fill={ICING} />
      {[-34, -24, -14].map((sy) => (
        <rect key={sy} x="-4" y={sy} width="8" height="3" fill={color} opacity="0.85" />
      ))}
      <rect x="-4" y="-40" width="3" height="42" rx="1.5" fill="#ffffff" opacity="0.5" />
      <rect x="-0.7" y="-46" width="1.4" height="7" fill="#3a2a22" />
      <circle className="smoke" cx="0" cy="-52" r="4" fill="#cfd8e3" opacity="0" />
      <g transform="translate(0 -46)">
        <Flame delay={(index * 0.17) % 0.9} />
      </g>
    </g>
  );
}

/** Works out rows, spacing and candle size so any count sits neatly on the cake. */
function layoutSticks(n: number) {
  const rows = n <= 8 ? 1 : n <= 18 ? 2 : n <= 30 ? 3 : 4;
  const scale = n <= 8 ? 1 : n <= 18 ? 0.82 : n <= 30 ? 0.68 : 0.56;
  const rowGap = rows === 1 ? 0 : Math.min(9, 22 / (rows - 1));

  const base = Math.floor(n / rows);
  const extra = n % rows;

  const items: { x: number; y: number }[] = [];
  for (let k = 0; k < rows; k++) {
    const count = base + (k < extra ? 1 : 0);
    const dy = (k - (rows - 1) / 2) * rowGap;
    // Half-width of the top face at this depth, so back/front rows stay on the cake.
    const halfWidth = RX * 0.8 * Math.sqrt(Math.max(0, 1 - (dy / RY) ** 2));
    // Odd rows are shifted half a step so flames don't sit directly behind each other.
    const shift = rows > 1 && k % 2 === 1 ? 0.5 : 0;
    const steps = count - 1 + (rows > 1 ? 0.5 : 0);
    const spacing = count === 1 ? 0 : (2 * halfWidth) / steps;
    for (let i = 0; i < count; i++) {
      const x = count === 1 ? CX : CX - halfWidth + spacing * (i + shift);
      items.push({ x, y: TOP_Y + dy });
    }
  }
  return { items, scale };
}

function Sticks({ n, colors }: { n: number; colors: string[] }) {
  const { items, scale } = layoutSticks(n);
  // Back rows are drawn first so front candles overlap them.
  return (
    <>
      {items.map((p, i) => (
        <Stick key={i} x={p.x} y={p.y} scale={scale} index={i} color={colors[i % colors.length]} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */

export default function Candles({ count, style = "numbers", look = "cake", colors = "cake" }: Options) {
  const n = Math.max(1, Math.floor(count));
  const palette = resolveColors(colors);
  return usesNumbers(n, style) ? (
    <Numbers n={n} colors={palette} look={look} />
  ) : (
    <Sticks n={n} colors={palette} />
  );
}
