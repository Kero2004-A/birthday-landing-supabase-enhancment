"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Cake from "./Cake";
import { flameCount } from "./Candles";
import type { CandleConfig } from "@/lib/config";
import { langProps, NO_FORCE, type Force, type Lang } from "@/lib/direction";
import { fill, type Ui } from "@/lib/i18n";

export type CakeState = "idle" | "lit" | "blown";

type Props = {
  name: string;
  candles: CandleConfig;
  state: CakeState;
  ui: Ui;
  lang: Lang;
  force?: Force;
  /** Text of the "scroll on" button after the candles are out. null = no button (nothing below). */
  continueLabel: string | null;
  onLight: () => void;
  onBlow: () => void;
  onContinue: () => void;
};

export default function Hero({ name, candles, state, ui, lang, force = NO_FORCE, continueLabel, onLight, onBlow, onContinue }: Props) {
  const rootRef = useRef<HTMLElement>(null);

  // However many flames there are, light them all in about 1.6s.
  const n = flameCount(candles.age, candles.style);
  const stagger = Math.min(0.14, 1.6 / n);

  // The page stays visible (blurred) behind the countdown overlay, so only the flames start hidden.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".flame", { opacity: 0, scale: 0, transformOrigin: "50% 100%" });
      gsap.set(".smoke", { opacity: 0 });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Light / blow out animations.
  useEffect(() => {
    if (state === "idle") return;
    const ctx = gsap.context(() => {
      if (state === "lit") {
        gsap.to(".flame", {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          stagger,
          ease: "back.out(2.5)",
        });
        gsap.to(".cake-glow", { opacity: 1, duration: 1.2 });
      } else {
        const out = Math.min(0.06, 0.6 / n);
        gsap.to(".flame", {
          scale: 0,
          opacity: 0,
          duration: 0.35,
          stagger: out,
          ease: "power2.in",
        });
        gsap.to(".cake-glow", { opacity: 0, duration: 0.6 });
        gsap.fromTo(
          ".smoke",
          { opacity: 0.6, y: 0, scale: 0.6 },
          { opacity: 0, y: -46, scale: 1.8, duration: 1.8, stagger: out, ease: "power1.out" }
        );
      }
    }, rootRef);
    return () => ctx.revert();
  }, [state]);

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center"
    >
      <p className="hero-in mb-3 font-hand text-3xl text-gold md:text-4xl">{ui.happyBirthday}</p>
      {name && (
        <h1
          {...langProps(name, lang, force)}
          className="hero-in font-display text-6xl font-semibold leading-[1.05] tracking-tight md:text-8xl"
        >
          {/* fontFamily: "inherit" keeps the heading's font (Amiri for Arabic); the global :lang(ar) rule would otherwise give this inner span Cairo. */}
          <span className="text-shine" style={{ fontFamily: "inherit" }}>
            {name}
          </span>
        </h1>
      )}

      {/* ---------- Cake (drawings never flip, whatever the language) ---------- */}
      <div dir="ltr" className="relative mt-10 w-[min(88vw,380px)] md:mt-14">
        <Cake candles={candles} label={fill(ui.cakeAlt, { n: candles.age })} />
      </div>

      {/* ---------- Actions ---------- */}
      <div className="hero-in mt-10 flex min-h-[7.5rem] flex-col items-center gap-4">
        {state === "idle" && (
          <>
            <p className="max-w-sm text-cream/75">{ui.makeWish}</p>
            <button
              onClick={onLight}
              className="rounded-full bg-blush px-8 py-4 text-lg font-bold text-white shadow-[0_0_32px_rgba(255,123,156,0.5)] transition hover:scale-105 hover:bg-blush-deep active:scale-95"
            >
              {ui.lightBtn}
            </button>
          </>
        )}

        {state === "lit" && (
          <>
            <p className="max-w-sm text-cream/75">{ui.closeEyes}</p>
            <button
              onClick={onBlow}
              className="rounded-full bg-gold px-8 py-4 text-lg font-bold text-ink shadow-[0_0_32px_rgba(255,210,122,0.45)] transition hover:scale-105 active:scale-95"
            >
              {ui.blowBtn}
            </button>
          </>
        )}

        {state === "blown" && (
          <>
            <p className="font-hand text-3xl text-gold">{ui.wishOnWay}</p>
            {continueLabel && (
              <button
                onClick={onContinue}
                className="group flex flex-col items-center gap-1 text-cream/80 transition hover:text-cream"
              >
                <span className="text-sm font-semibold uppercase tracking-[0.25em]">{continueLabel}</span>
                <span className="cue-bounce text-2xl">↓</span>
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
