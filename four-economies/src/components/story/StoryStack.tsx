"use client";

import { useEffect, useRef, useState } from "react";
import { useScene } from "@/components/scene/store";
import { specs } from "@/components/scene/specs";
import { TLink } from "@/components/motion/Transition";
import type { Iso } from "@/lib/data";

export type StoryCard = {
  iso: Iso;
  name: string;
  short: string;
  slug: string;
  color: string;
  regime: string;
  title: string;
  points: { lead: string; body: string }[];
  figure: { label: string; value: string; note: string };
  sources: string;
};

/**
 * Four country cards that stack like notes dealt onto a table. A 400svh track of
 * invisible markers decides which card is up; the sticky stage animates them.
 */
export function StoryStack({ cards }: { cards: StoryCard[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const show = useScene((s) => s.show);

  useEffect(() => {
    const markers = [...(track.current?.querySelectorAll<HTMLElement>("[data-slide]") ?? [])];
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = markers.indexOf(e.target as HTMLElement);
          setActive(i);
          show(specs.sculpture(cards[i].iso), { align: "right" });
        }),
      { rootMargin: "-50% 0px -50% 0px" }
    );
    markers.forEach((m) => io.observe(m));
    return () => io.disconnect();
  }, [cards, show]);

  return (
    <div className="relative z-10" style={{ height: `${cards.length * 100}svh` }}>
      <div ref={track} className="absolute inset-0 grid" style={{ gridTemplateRows: `repeat(${cards.length}, 100svh)` }} aria-hidden>
        {cards.map((c) => (
          <div key={c.iso} data-slide data-label={c.short} />
        ))}
      </div>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="slide-pad relative flex h-full items-center">
          <div className="relative h-[min(78svh,44rem)] w-full max-w-xl lg:max-w-[40rem]">
            {cards.map((c, i) => {
              const state = i < active ? "past" : i === active ? "now" : "next";
              const depth = active - i;
              return (
                <article
                  key={c.iso}
                  aria-hidden={state !== "now"}
                  className="frame absolute inset-0 flex flex-col overflow-hidden bg-ink-2 p-6 sm:p-8"
                  style={{
                    transform:
                      state === "now" ? "none" : state === "past" ? `translateY(${-depth * 18}px) scale(${1 - depth * 0.05})` : "translateY(115%) rotate(4deg)",
                    opacity: state === "past" ? Math.max(0, 0.5 - depth * 0.15) : 1,
                    transition: "transform 1s cubic-bezier(.22,1,.36,1), opacity .8s",
                    zIndex: i,
                    visibility: depth > 3 ? "hidden" : "visible",
                    borderTopColor: c.color,
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="eyebrow flex items-center gap-2 text-paper-2">
                      <span className="size-2 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </p>
                    <p className="eyebrow num">
                      {String(i + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}
                    </p>
                  </div>
                  <h3 className="display mt-4 text-[clamp(1.9rem,3.6vw,3rem)] text-paper">{c.title}</h3>
                  <p className="eyebrow mt-2" style={{ color: c.color }}>
                    {c.regime}
                  </p>
                  <ul className="scroll-thin mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 text-[0.94rem] leading-relaxed" data-lenis-prevent>
                    {c.points.map((p) => (
                      <li key={p.lead} className="text-paper-2">
                        <span className="font-semibold text-paper">{p.lead}</span> {p.body}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-rule pt-4">
                    <div>
                      <p className="eyebrow">{c.figure.label}</p>
                      <p className="denom num mt-1 text-[clamp(2rem,4vw,3.2rem)] text-paper">{c.figure.value}</p>
                      <p className="mt-1 max-w-sm text-xs text-paper-2">{c.figure.note}</p>
                    </div>
                    <TLink
                      href={`/countries/${c.slug}`}
                      label={c.name}
                      color={c.color}
                      tabIndex={state === "now" ? 0 : -1}
                      className="eyebrow rounded-full border border-rule px-4 py-2 text-paper transition-colors hover:border-paper"
                    >
                      Open the {c.short} file →
                    </TLink>
                  </div>
                  <p className="mt-3 text-[11px] text-muted">{c.sources}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
