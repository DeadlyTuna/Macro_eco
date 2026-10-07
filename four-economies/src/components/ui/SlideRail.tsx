"use client";

import { useEffect, useState } from "react";
import { scrollToY } from "@/components/motion/SmoothScroll";

/** Left-edge progress rail: one tick per slide, the current one named. */
export function SlideRail() {
  const [slides, setSlides] = useState<{ el: HTMLElement; label: string }[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("main [data-slide]")].filter((el) => el.offsetParent !== null);
    const raf = requestAnimationFrame(() => setSlides(els.map((el) => ({ el, label: el.dataset.label ?? "" }))));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(els.indexOf(e.target as HTMLElement))),
      { rootMargin: "-50% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  if (!slides.length) return null;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <nav aria-label="Slides" className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 xl:block">
      <ol className="flex flex-col gap-[7px]">
        {slides.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => scrollToY(s.el.getBoundingClientRect().top + window.scrollY)}
              className="group flex h-3 items-center gap-3"
              aria-label={`Slide ${i + 1}: ${s.label}`}
              aria-current={i === active ? "step" : undefined}
            >
              <span className={`block h-px transition-all duration-500 ${i === active ? "w-8 bg-paper" : "w-3 bg-paper/30 group-hover:w-5 group-hover:bg-paper/70"}`} />
              <span className={`eyebrow whitespace-nowrap transition-opacity duration-300 ${i === active ? "opacity-100 text-paper" : "opacity-0 group-hover:opacity-100"}`}>{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="eyebrow mt-6 num text-paper">
        {pad(active + 1)} <span className="text-muted">/ {pad(slides.length)}</span>
      </p>
      <p className="eyebrow mt-1 text-muted">↑ ↓ to move</p>
    </nav>
  );
}
