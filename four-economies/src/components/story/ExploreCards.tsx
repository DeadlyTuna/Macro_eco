"use client";

import { useScene } from "@/components/scene/store";
import { specs } from "@/components/scene/specs";
import { TLink } from "@/components/motion/Transition";
import type { Iso } from "@/lib/data";

export type ExploreCard = { iso: Iso; name: string; slug: string; color: string; thesis: string; stat: string; statLabel: string };

/** Hover or focus a card and the globe turns to that country. */
export function ExploreCards({ cards }: { cards: ExploreCard[] }) {
  const show = useScene((s) => s.show);
  const focus = (iso: Iso | null) => show(specs.globe(iso), { align: "right" });
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <li key={c.iso}>
          <TLink
            href={`/countries/${c.slug}`}
            label={c.name}
            color={c.color}
            onMouseEnter={() => focus(c.iso)}
            onMouseLeave={() => focus(null)}
            onFocus={() => focus(c.iso)}
            onBlur={() => focus(null)}
            className="frame group flex h-full flex-col gap-3 p-5 transition-colors hover:border-paper/40"
          >
            <span className="flex items-center justify-between">
              <span className="eyebrow flex items-center gap-2 text-paper-2">
                <span className="size-2 rounded-full" style={{ background: c.color }} />
                {c.name}
              </span>
              <span aria-hidden className="text-paper-2 transition-transform duration-500 group-hover:translate-x-1">
                →
              </span>
            </span>
            <span className="denom num text-3xl text-paper">{c.stat}</span>
            <span className="eyebrow -mt-2">{c.statLabel}</span>
            <span className="text-sm leading-relaxed text-paper-2">{c.thesis}</span>
          </TLink>
        </li>
      ))}
    </ul>
  );
}
