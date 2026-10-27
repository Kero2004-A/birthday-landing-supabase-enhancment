"use client";

import { useState } from "react";
import Cake from "@/components/birthday/Cake";
import Stars from "@/components/birthday/Stars";
import { CANDLE_THEMES, resolveColors, type CandleTheme } from "@/lib/candleColors";
import { config, type CandleConfig } from "@/lib/config";

/**
 * Candle designer: try ages, styles and colours live, then copy the result
 * into `candles` in lib/config.ts. Delete this folder (app/candles) before
 * you publish if you don't want it on your site.
 */

const THEMES = Object.keys(CANDLE_THEMES) as CandleTheme[];

export default function CandleDesigner() {
  const [age, setAge] = useState(config.candles.age);
  const [style, setStyle] = useState<CandleConfig["style"]>(config.candles.style);
  const [colors, setColors] = useState<string[]>(() => resolveColors(config.candles.colors));
  const [look, setLook] = useState<CandleConfig["look"]>(config.candles.look);
  const [out, setOut] = useState(false);
  const [copied, setCopied] = useState(false);

  const safeAge = Math.min(999, Math.max(1, Math.floor(age) || 1));
  const digits = String(safeAge).length;
  const usingNumbers = style === "numbers" || safeAge > 40;

  const candles: CandleConfig = { age: safeAge, style, look, colors };

  // Print a theme name if the colours match one exactly, otherwise the list.
  const matchedTheme = THEMES.find((t) => JSON.stringify(CANDLE_THEMES[t]) === JSON.stringify(colors));
  const shownColors = matchedTheme
    ? `"${matchedTheme}"`
    : `[${(usingNumbers ? colors.slice(0, digits) : colors.slice(0, 3)).map((c) => `"${c}"`).join(", ")}]`;

  const snippet = `candles: {
  age: ${safeAge},
  style: "${style}",
  look: "${look}",
  colors: ${shownColors},
} as CandleConfig,`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the text is selectable below */
    }
  };

  const setDigitColor = (i: number, value: string) =>
    setColors((prev) => {
      const next = [...prev];
      while (next.length <= i) next.push(next[next.length - 1] ?? "#f9b6a2");
      next[i] = value;
      return next;
    });

  const chip = "rounded-full border px-4 py-2 text-sm font-semibold transition";
  const on = "border-blush bg-blush text-white";
  const off = "border-white/15 bg-white/5 text-cream/80 hover:bg-white/10";

  return (
    <main className="relative min-h-svh px-5 py-10">
      <Stars />
      <div className="mx-auto max-w-5xl">
        <p className="font-hand text-3xl text-gold">design your</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Birthday candles</h1>

        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.1fr]">
          {/* ---------- Preview ---------- */}
          <section
            className={`designer flex flex-col items-center rounded-3xl border border-white/10 bg-deep/60 p-6 backdrop-blur ${
              out ? "candles-out" : ""
            }`}
          >
            <div className="w-full max-w-sm">
              <Cake candles={candles} />
            </div>
            <button onClick={() => setOut((v) => !v)} className={`${chip} ${off} mt-6`}>
              {out ? "🕯️ Light them again" : "🌬️ Blow them out"}
            </button>
          </section>

          {/* ---------- Controls ---------- */}
          <section className="space-y-7 rounded-3xl border border-white/10 bg-deep/60 p-6 backdrop-blur">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-cream/60" htmlFor="age">
                Age
              </label>
              <div className="flex items-center gap-3">
                <button aria-label="One year less" onClick={() => setAge(Math.max(1, safeAge - 1))} className={`${chip} ${off} h-11 w-11 !px-0 text-lg`}>
                  −
                </button>
                <input
                  id="age"
                  type="number"
                  min={1}
                  max={999}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="h-11 w-24 rounded-xl border border-white/15 bg-white/5 text-center text-xl font-bold text-cream outline-none focus:border-blush"
                />
                <button aria-label="One year more" onClick={() => setAge(Math.min(999, safeAge + 1))} className={`${chip} ${off} h-11 w-11 !px-0 text-lg`}>
                  +
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cream/60">Style</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setStyle("numbers")} className={`${chip} ${style === "numbers" ? on : off}`}>
                  Number candles
                </button>
                <button onClick={() => setStyle("sticks")} className={`${chip} ${style === "sticks" ? on : off}`}>
                  One per year
                </button>
              </div>
              {style === "sticks" && safeAge > 40 && (
                <p className="mt-2 text-sm text-gold">Above 40 it shows number candles automatically.</p>
              )}
            </div>

            {usingNumbers && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cream/60">Look</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setLook("cake")} className={`${chip} ${look === "cake" ? on : off}`}>
                    Like the cake
                  </button>
                  <button onClick={() => setLook("stitched")} className={`${chip} ${look === "stitched" ? on : off}`}>
                    Stitched
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cream/60">Colour theme</p>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setColors([...CANDLE_THEMES[t]])}
                    className={`${chip} ${matchedTheme === t ? on : off} flex items-center gap-2 capitalize`}
                  >
                    <span className="flex -space-x-1">
                      {CANDLE_THEMES[t].slice(0, 3).map((c) => (
                        <span key={c} className="h-4 w-4 rounded-full border border-black/20" style={{ background: c }} />
                      ))}
                    </span>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {usingNumbers && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cream/60">Colour of each digit</p>
                <div className="flex flex-wrap items-center gap-4">
                  {String(safeAge)
                    .slice(0, 3)
                    .split("")
                    .map((d, i) => (
                      <label key={i} className="flex items-center gap-2 text-cream/80">
                        <input
                          type="color"
                          value={colors[i % colors.length]}
                          onChange={(e) => setDigitColor(i, e.target.value)}
                          className="h-11 w-11 cursor-pointer rounded-xl border border-white/15 bg-transparent p-1"
                          aria-label={`Colour of digit ${d}`}
                        />
                        <span className="font-display text-2xl font-semibold">{d}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cream/60">Paste into lib/config.ts</p>
                <button onClick={copy} className={`${chip} ${copied ? on : off} !py-1.5`}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-abyss/80 p-4 text-sm leading-relaxed text-cream/90">
                {snippet}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
