"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

type Tagname = "div" | "section" | "article" | "li" | "span" | "p" | "h1" | "h2" | "h3";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Headline whose words rise out of masked lines when it scrolls into view. */
export function SplitHeading({
  as = "h2",
  children,
  className,
  delay = 0,
  immediate = false,
}: {
  as?: Tagname;
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!ref.current || reducedMotion()) return;
      const split = SplitText.create(ref.current, {
        type: "lines,words",
        mask: "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.words, {
            yPercent: 115,
            rotate: 3,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.04,
            delay,
            scrollTrigger: immediate ? undefined : { trigger: ref.current, start: "top 88%", once: true },
          }),
      });
      return () => split.revert();
    },
    { scope: ref }
  );
  const Tag = as as "div";
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/** Fades and lifts its children in once, when they enter the viewport. */
export function Reveal({ children, className = "", delay = 0, as = "div" }: { children: ReactNode; className?: string; delay?: number; as?: Tagname }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as as "div";
  return (
    <Tag ref={ref} className={`reveal ${on ? "is-in" : ""} ${className}`} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** Rolls each digit into place like a currency counter. `value` is the formatted string. */
export function Odometer({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  let d = 0;
  return (
    <span ref={ref} className={`num inline-flex ${className}`} aria-label={value} role="img">
      {[...value].map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={i} aria-hidden>{ch}</span>;
        const n = Number(ch);
        const delay = d++ * 70;
        return (
          <span key={i} className="odo-digit" aria-hidden>
            <span className="odo-strip" style={{ transform: `translateY(${on ? -n : 0}em)`, transitionDelay: `${delay}ms` }}>
              {Array.from({ length: 10 }, (_, k) => (
                <span key={k}>{k}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
