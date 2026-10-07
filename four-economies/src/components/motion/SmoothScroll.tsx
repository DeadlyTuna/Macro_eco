"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 1.3, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

const visibleSlides = () =>
  [...document.querySelectorAll<HTMLElement>("[data-slide]")].filter((el) => el.offsetParent !== null);

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // Slides: arrow keys / PageUp / PageDown / Space step between [data-slide] sections.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable], [role=slider], [role=listbox]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const next = e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey);
      const prev = e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey);
      if (!next && !prev) return;
      const slides = visibleSlides();
      if (slides.length < 2) return;
      const y = window.scrollY;
      const tops = slides.map((el) => Math.round(el.getBoundingClientRect().top + y));
      const target = next ? tops.find((v) => v > y + 4) : [...tops].reverse().find((v) => v < y - 4);
      if (target == null) return;
      e.preventDefault();
      scrollToY(target);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
