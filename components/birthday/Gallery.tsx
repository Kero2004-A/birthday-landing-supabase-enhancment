"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Memory } from "@/lib/config";
import { dirOf, langProps, NO_FORCE, type Force, type Lang } from "@/lib/direction";
import { fill, type Ui } from "@/lib/i18n";

gsap.registerPlugin(ScrollTrigger);

function Photo({ memory, alt }: { memory: Memory; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!memory.src || failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blush/30 via-night to-gold/20 text-6xl">
        <span aria-hidden>{memory.emoji ?? "💖"}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={memory.src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );
}

export default function Gallery({
  memories,
  ui,
  lang,
  force = NO_FORCE,
}: {
  memories: Memory[];
  ui: Ui;
  lang: Lang;
  force?: Force;
}) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const wide = window.innerWidth >= 768;
      // The first card sits on the start side: the left in English, the right in Arabic.
      // It should slide in from its own side, so the whole pattern flips with the page.
      const flip = dirOf(lang) === "rtl" ? -1 : 1;

      gsap.utils.toArray<HTMLElement>(".memory-card").forEach((card, i) => {
        const dir = (i % 2 === 0 ? -1 : 1) * flip;
        gsap.fromTo(
          card,
          { x: wide ? dir * 120 : 0, y: wide ? 0 : 50, opacity: 0, rotate: wide ? dir * 2 : 0 },
          {
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 82%", toggleActions: "play none none reverse" },
          }
        );
      });

      // The timeline line "draws" itself as you scroll.
      gsap.fromTo(
        ".timeline-fill",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "top",
          scrollTrigger: { trigger: ".timeline", start: "top 70%", end: "bottom 60%", scrub: true },
        }
      );

      gsap.from(".gallery-title", {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".gallery-title", start: "top 85%" },
      });
    }, rootRef);

    return () => ctx.revert();
  }, [memories, lang]);

  return (
    <section ref={rootRef} className="relative mx-auto max-w-5xl px-5 py-24 md:py-32">
      <div className="gallery-title mb-20 text-center">
        <p className="font-hand text-3xl text-gold">{ui.galleryKicker}</p>
        <h2 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">{ui.galleryTitle}</h2>
      </div>

      <div className="timeline relative">
        {/* Line (desktop: centred, mobile: at the start edge). Logical positions, so it mirrors in Arabic. */}
        <div className="absolute bottom-0 start-4 top-0 w-px bg-white/10 md:start-1/2">
          <div className="timeline-fill h-full w-full bg-gradient-to-b from-blush to-gold" />
        </div>

        <ol className="space-y-20 md:space-y-28">
          {memories.map((m, i) => {
            const first = i % 2 === 0;
            const title = m.title.trim();
            const alt = title || m.message.slice(0, 80) || fill(ui.memoryAlt, { n: i + 1 });
            return (
              <li
                key={i}
                className={`relative ps-12 md:flex md:w-1/2 md:ps-0 ${
                  first ? "md:pe-14" : "md:ms-auto md:ps-14"
                }`}
              >
                {/* Dot */}
                <span
                  aria-hidden
                  className={`absolute top-8 h-3 w-3 rounded-full bg-blush shadow-[0_0_0_6px_rgba(255,123,156,0.2)] start-[10px] ${
                    first ? "md:start-auto md:-end-[6px]" : "md:-start-[6px]"
                  }`}
                />
                <article className="memory-card group w-full overflow-hidden rounded-3xl border border-white/10 bg-deep/80 shadow-2xl shadow-black/40 backdrop-blur">
                  <div dir="ltr" className="aspect-[4/3] overflow-hidden">
                    <Photo memory={m} alt={alt} />
                  </div>
                  {(m.date || title || m.message) && (
                    <div className="p-6">
                      {m.date && (
                        <p
                          {...langProps(m.date, lang, force)}
                          className="mb-1 text-start text-xs font-bold uppercase tracking-[0.25em] text-gold/90"
                        >
                          {m.date}
                        </p>
                      )}
                      {title && (
                        <h3
                          {...langProps(title, lang, force)}
                          className="text-start font-display text-2xl font-semibold text-blush"
                        >
                          {title}
                        </h3>
                      )}
                      {m.message && (
                        <p
                          {...langProps(m.message, lang, force)}
                          className={`text-start leading-relaxed text-cream/80 ${title ? "mt-2" : ""}`}
                        >
                          {m.message}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
