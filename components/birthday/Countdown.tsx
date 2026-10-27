"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { fill, type Ui } from "@/lib/i18n";

type Props = {
  /** ISO date (with UTC offset). If it is in the future the page waits, blurred, until then. */
  targetDate: string | null;
  /** Length of the final 3-2-1 style countdown, in seconds. */
  seconds: number;
  introLine: string;
  name: string;
  ui: Ui;
  /** Called once the overlay has fully faded out. */
  onDone: () => void;
};

type Phase = "loading" | "waiting" | "ready" | "counting" | "leaving";

const RING = 2 * Math.PI * 88;
const pad = (v: number) => String(v).padStart(2, "0");

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export default function Countdown({ targetDate, seconds, introLine, name, ui, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [remaining, setRemaining] = useState(0);
  const [n, setN] = useState(seconds);

  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const target = targetDate ? Date.parse(targetDate) : NaN;

  // Decide where to start. Done on the client only, so the viewer's clock is used.
  useEffect(() => {
    if (Number.isNaN(target)) {
      if (targetDate) console.warn(`[birthday] reveal date "${targetDate}" is not a valid date; skipping the wait.`);
      setPhase("ready");
      return;
    }
    const left = target - Date.now();
    if (left <= 0) {
      setPhase("ready");
      return;
    }
    setRemaining(left);
    setPhase("waiting");
  }, [target, targetDate]);

  // Live countdown to the date.
  useEffect(() => {
    if (phase !== "waiting") return;
    const id = setInterval(() => {
      const left = target - Date.now();
      if (left <= 0) {
        clearInterval(id);
        setPhase("ready");
      } else {
        setRemaining(left);
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase, target]);

  // Final short countdown after pressing "Open it".
  useEffect(() => {
    if (phase !== "counting") return;
    if (n <= 0) {
      setPhase("leaving");
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        numRef.current,
        { scale: 0.4, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: "back.out(2.2)" }
      );
      gsap.to(numRef.current, { opacity: 0.15, duration: 0.25, delay: 0.72 });
      gsap.fromTo(
        ringRef.current,
        { strokeDashoffset: RING },
        { strokeDashoffset: 0, duration: 1, ease: "none" }
      );
    }, rootRef);
    const t = setTimeout(() => setN((v) => v - 1), 1000);
    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, [phase, n]);

  // Fade the overlay away to reveal the page.
  useEffect(() => {
    if (phase !== "leaving") return;
    const tween = gsap.to(rootRef.current, {
      opacity: 0,
      scale: 1.06,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => onDoneRef.current(),
    });
    return () => {
      tween.kill();
    };
  }, [phase]);

  const t = split(remaining);
  const units: [string, number, boolean][] = [
    [ui.days, t.days, false],
    [ui.hours, t.hours, true],
    [ui.minutes, t.minutes, true],
    [ui.seconds, t.seconds, true],
  ];

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={introLine}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-night/60 px-6 text-center backdrop-blur-2xl"
    >
      {phase === "waiting" && (
        <div className="flex flex-col items-center">
          <p className="font-hand text-3xl text-gold md:text-4xl">{introLine}</p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-cream md:text-6xl">
            {name ? fill(ui.comingTitle, { name }) : ui.comingTitleNoName}
          </h2>

          {/* The digits always read left to right, in either language. */}
          <div className="mt-10 grid grid-cols-4 gap-2.5 md:gap-5" role="timer" aria-live="off">
            {units.map(([label, value, padded]) => (
              <div
                key={label}
                className="w-[4.6rem] rounded-2xl border border-white/15 bg-white/5 py-4 shadow-xl shadow-black/30 md:w-28 md:py-6"
              >
                <div dir="ltr" className="font-display text-4xl font-bold tabular-nums text-blush md:text-6xl">
                  {padded ? pad(value) : value}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/60 md:text-xs">
                  {label}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-cream/60">
            {ui.opens}{" "}
            {new Date(target).toLocaleString(ui.locale, { dateStyle: "full", timeStyle: "short" })}
          </p>
        </div>
      )}

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-8">
          <p className="font-hand text-3xl text-gold md:text-4xl">{introLine}</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-cream md:text-6xl">
            {ui.readyTitle}
          </h2>
          <button
            onClick={() => {
              setN(seconds);
              setPhase("counting");
            }}
            className="relative mt-2 rounded-full bg-blush px-10 py-4 text-lg font-bold text-white shadow-[0_0_40px_rgba(255,123,156,0.45)] transition hover:scale-105 hover:bg-blush-deep active:scale-95"
          >
            <span className="relative z-10">{ui.openIt}</span>
            <span className="absolute inset-0 animate-ping rounded-full bg-blush/40 [animation-duration:2.4s]" />
          </button>
        </div>
      )}

      {(phase === "counting" || phase === "leaving") && (
        <div className="flex flex-col items-center">
          <p className="mb-8 text-sm font-semibold uppercase tracking-[0.35em] text-cream/70 md:text-base">
            {ui.startsIn}
          </p>
          <div className="relative grid h-56 w-56 place-items-center md:h-64 md:w-64">
            <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <circle
                ref={ringRef}
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="#ff7b9c"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={RING}
                strokeDashoffset={phase === "leaving" ? 0 : RING}
              />
            </svg>
            <span
              ref={numRef}
              aria-live="polite"
              className="font-display text-8xl font-bold text-blush drop-shadow-[0_0_24px_rgba(255,123,156,0.8)] md:text-9xl"
            >
              {n > 0 ? n : "🎉"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
