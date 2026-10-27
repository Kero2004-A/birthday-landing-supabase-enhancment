"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fireConfetti } from "@/lib/confetti";
import { fill } from "@/lib/i18n";
import type { PageData } from "@/lib/pageData";
import Stars from "./Stars";
import Countdown from "./Countdown";
import Hero, { type CakeState } from "./Hero";
import Gallery from "./Gallery";
import Letter from "./Letter";

gsap.registerPlugin(ScrollTrigger);

type MusicState = "idle" | "playing" | "paused" | "error";

const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;
const PlayIcon = () => (
  <svg {...iconProps}>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
  </svg>
);
const PauseIcon = () => (
  <svg {...iconProps}>
    <rect x="6" y="5" width="4.2" height="14" rx="1.2" />
    <rect x="13.8" y="5" width="4.2" height="14" rx="1.2" />
  </svg>
);

export default function BirthdayExperience({ data }: { data: PageData }) {
  const { name, candles, music, revealDate, countdownSeconds, memories, letter, introLine, lang, dir, force, ui } = data;

  const [revealed, setRevealed] = useState(false);
  const [cake, setCake] = useState<CakeState>("idle");
  const [musicState, setMusicState] = useState<MusicState>("idle");

  const audioRef = useRef<HTMLAudioElement>(null);
  const nextSectionRef = useRef<HTMLDivElement>(null);

  const unlocked = revealed && cake === "blown";
  const hasNext = memories.length > 0 || letter !== null;

  // Tell the browser (and screen readers) which language and direction the page is in.
  useEffect(() => {
    const el = document.documentElement;
    const prev = { lang: el.lang, dir: el.dir };
    el.lang = lang;
    el.dir = dir;
    return () => {
      el.lang = prev.lang;
      el.dir = prev.dir;
    };
  }, [lang, dir]);

  // A comfortable volume to start with.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.8;
  }, []);

  // A bad song link can fail before this page is interactive, and React never sees that error
  // event. Look at the player once, so a broken link doesn't leave a button that does nothing.
  useEffect(() => {
    if (audioRef.current?.error) setMusicState("error");
  }, [music]);

  // Keep the page on the cake until the candles have been blown out.
  useEffect(() => {
    document.documentElement.style.overflow = unlocked ? "" : "hidden";
    if (unlocked) {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [unlocked]);

  const handleRevealed = useCallback(() => setRevealed(true), []);

  const lightCandles = () => {
    setCake("lit");
    // Music starts here: browsers only allow sound after a tap.
    audioRef.current?.play().catch(() => {
      /* Missing file or blocked: the page still works without music. */
    });
  };

  const blowOut = () => {
    setCake("blown");
    fireConfetti(180);
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      // Let the song settle softly instead of cutting off.
      gsap.to(audio, { volume: 0.35, duration: 3 });
    }
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => setMusicState("paused"));
    } else {
      audio.pause();
    }
  };

  const scrollOn = () => {
    nextSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const continueLabel = !hasNext ? null : memories.length > 0 ? ui.seeMemories : ui.letterHeading;
  const showMusicButton = revealed && Boolean(music) && musicState !== "error";

  return (
    <main dir={dir} lang={lang} className="relative">
      <Stars />
      {music && (
        <audio
          ref={audioRef}
          src={music}
          preload="auto"
          loop
          onPlay={() => setMusicState("playing")}
          onPause={() => setMusicState("paused")}
          onError={() => setMusicState("error")}
        />
      )}

      {!revealed && (
        <Countdown
          targetDate={revealDate}
          seconds={countdownSeconds}
          introLine={introLine}
          name={name}
          ui={ui}
          onDone={handleRevealed}
        />
      )}

      <Hero
        name={name}
        candles={candles}
        state={cake}
        ui={ui}
        lang={lang}
        force={force}
        continueLabel={continueLabel}
        onLight={lightCandles}
        onBlow={blowOut}
        onContinue={scrollOn}
      />

      {showMusicButton && (
        <button
          onClick={toggleMusic}
          aria-label={musicState === "playing" ? ui.musicPause : ui.musicPlay}
          aria-pressed={musicState === "playing"}
          className="fixed end-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-deep/70 text-cream backdrop-blur transition hover:bg-deep"
        >
          {musicState === "playing" ? <PauseIcon /> : <PlayIcon />}
        </button>
      )}

      <div ref={nextSectionRef} />
      {memories.length > 0 && <Gallery memories={memories} ui={ui} lang={lang} force={force} />}
      {letter && <Letter name={name} letter={letter} ui={ui} lang={lang} force={force} />}

      <footer className="px-6 pb-12 pt-8 text-center text-sm text-cream/40">
        {name ? fill(ui.footer, { name }) : ui.footerNoName}
      </footer>
    </main>
  );
}
