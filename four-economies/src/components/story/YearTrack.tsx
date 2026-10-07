"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { COUNTRIES } from "@/lib/countries";
import type { Iso } from "@/lib/data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type YearEvents = { year: number; items: { when: string; iso: Iso; text: string }[] };

/** 2022 → 2023 → 2024 as one horizontal strip, scrubbed by vertical scroll (pinned on wide screens). */
export function YearTrack({ years }: { years: YearEvents[] }) {
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = strip.current!;
        const dist = () => el.scrollWidth - window.innerWidth + 80;
        gsap.to(el, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative overflow-hidden lg:h-svh">
      <div className="slide-pad pb-6 lg:pb-0">
        <p className="eyebrow mb-4">The window, month by month</p>
        <h2 className="display on-stage text-[clamp(2.3rem,5vw,4.4rem)] text-paper">The three years, as they were lived</h2>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-paper-2" aria-label="Legend">
          {(["BIH", "SYC", "VNM", "MDV"] as Iso[]).map((i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: COUNTRIES[i].color }} />
              {COUNTRIES[i].name}
            </span>
          ))}
        </p>
      </div>
      <div ref={strip} className="flex flex-col gap-10 px-[clamp(1.25rem,5vw,5rem)] pb-16 lg:w-max lg:flex-row lg:gap-16 lg:pl-[max(9rem,8vw)] lg:pr-24">
        {years.map((y) => (
          <section key={y.year} className="lg:w-[min(56rem,80vw)]" aria-labelledby={`yr-${y.year}`}>
            <h3 id={`yr-${y.year}`} className="denom num text-[clamp(4rem,10vw,9rem)] text-paper/90">
              {y.year}
            </h3>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2">
              {y.items.map((it, k) => (
                <li key={k} className="yt-card frame p-5" style={{ borderLeft: `2px solid ${COUNTRIES[it.iso].color}` }}>
                  <p className="eyebrow flex items-center gap-2">
                    <span className="size-1.5 rounded-full" style={{ background: COUNTRIES[it.iso].color }} />
                    {it.when} · {COUNTRIES[it.iso].short}
                  </p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-paper-2">{it.text}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
