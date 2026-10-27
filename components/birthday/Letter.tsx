"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fireConfetti } from "@/lib/confetti";
import type { LetterData } from "@/lib/config";
import { detectLang, dirOf, langProps, NO_FORCE, type Force, type Lang } from "@/lib/direction";
import type { Ui } from "@/lib/i18n";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  name: string;
  letter: LetterData;
  ui: Ui;
  lang: Lang;
  force?: Force;
};

export default function Letter({ name, letter, ui, lang, force = NO_FORCE }: Props) {
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // The letter has its own language (it may differ from the page's), taken from what was written.
  const letterLang: Lang = force.lang ?? detectLang(letter.paragraphs.join(" \n ")) ?? lang;
  const letterDir = force.dir ?? dirOf(letterLang);
  // Greeting, sign-off and name share the letter's direction so they line up with the text;
  // each keeps its own language for the font.
  const line = (text: string) => ({ dir: letterDir, lang: force.lang ?? detectLang(text) ?? letterLang });
  const greeting = name && letter.greeting ? letter.greeting.replaceAll("{name}", name) : "";

  // Scroll-in for the section.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".letter-in", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Dialog behaviour: animation, Escape, scroll lock, focus.
  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const ctx = gsap.context(() => {
      gsap.from(".letter-backdrop", { opacity: 0, duration: 0.4 });
      gsap.from(".letter-paper", { y: 80, rotate: -3, scale: 0.92, opacity: 0, duration: 0.8, ease: "back.out(1.4)" });
      gsap.from(".letter-line", { opacity: 0, y: 14, duration: 0.7, stagger: 0.35, delay: 0.5, ease: "power2.out" });
    }, dialogRef);
    fireConfetti(90);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevOverflow;
      ctx.revert();
      trigger?.focus();
    };
  }, [open]);

  return (
    <section ref={sectionRef} className="relative px-6 py-28 text-center md:py-40">
      <div className="mx-auto max-w-xl">
        <p className="letter-in font-hand text-3xl text-gold">{ui.letterKicker}</p>
        <h2 className="letter-in mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {ui.letterHeading}
        </h2>

        <button
          ref={triggerRef}
          onClick={() => setOpen(true)}
          className="letter-in group mx-auto mt-12 block"
          aria-haspopup="dialog"
        >
          <span dir="ltr" className="relative mx-auto block h-36 w-56 transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-1 md:h-40 md:w-64">
            {/* envelope */}
            <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ffe9d0] to-[#ffd2b0] shadow-2xl shadow-black/50" />
            <span
              className="absolute inset-x-0 top-0 h-20 rounded-t-xl bg-gradient-to-b from-[#ffd9b8] to-[#ffc9a0] md:h-24"
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
            />
            <span className="absolute left-1/2 top-[3.2rem] grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full bg-blush text-lg shadow-lg md:top-[3.6rem]">
              ❤️
            </span>
          </span>
          <span className="mt-6 inline-block rounded-full bg-blush px-8 py-3.5 text-base font-bold text-white shadow-[0_0_28px_rgba(255,123,156,0.4)] transition group-hover:bg-blush-deep">
            {ui.openLetter}
          </span>
        </button>
      </div>

      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="letter-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="letter-backdrop absolute inset-0 bg-abyss/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />
          <div
            dir={letterDir}
            lang={letterLang}
            className="letter-paper paper relative max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-2xl p-8 text-start text-ink shadow-2xl md:p-12"
          >
            <h3
              id="letter-title"
              {...line(letter.title)}
              className="letter-line font-display text-3xl font-semibold text-blush-deep md:text-4xl"
            >
              {letter.title}
            </h3>
            {greeting && (
              <p {...line(letter.greeting.replaceAll("{name}", ""))} className="letter-line mt-6 font-hand text-3xl leading-none">
                {greeting}
              </p>
            )}
            <div className="mt-4 space-y-4 text-lg leading-relaxed">
              {letter.paragraphs.map((p, i) => (
                <p key={i} {...langProps(p, letterLang, force)} className="letter-line whitespace-pre-line text-start">
                  {p}
                </p>
              ))}
            </div>
            {letter.signOff && (
              <p {...line(letter.signOff)} className="letter-line mt-8 font-hand text-3xl">
                {letter.signOff}
              </p>
            )}
            {letter.from && (
              <p {...line(letter.from)} className="letter-line font-hand text-3xl text-blush-deep">
                {letter.from}
              </p>
            )}

            <div className="letter-line mt-10 flex justify-end">
              <button
                ref={closeRef}
                onClick={() => setOpen(false)}
                className="rounded-xl bg-blush px-6 py-2.5 font-semibold text-white transition hover:bg-blush-deep"
              >
                {ui.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
