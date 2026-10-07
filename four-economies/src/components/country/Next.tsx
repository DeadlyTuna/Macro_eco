import { specs } from "@/components/scene/specs";
import { Reveal } from "@/components/motion/Reveal";
import { TLink } from "@/components/motion/Transition";
import { Flag } from "@/components/ui/Flag";
import type { Country } from "@/lib/countries";
import { v } from "@/lib/data";
import { usd } from "@/lib/format";
import { Head, Section } from "./parts";

function CountryCard({ c, dir, delay }: { c: Country; dir: "Previous" | "Next"; delay: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <TLink
        href={`/countries/${c.slug}`}
        label={c.name}
        color={c.color}
        className="frame group flex h-full flex-col p-6 transition-colors hover:border-paper/40 sm:p-7"
      >
        <span className="absolute inset-x-0 top-0 h-[2px]" aria-hidden style={{ background: c.color }} />
        <span className="eyebrow relative flex items-center justify-between gap-3">
          <span>
            {dir} country<span className="sr-only">: {c.name}</span>
          </span>
          <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
            {dir === "Next" ? "→" : "←"}
          </span>
        </span>
        <span className="relative mt-6 flex items-center gap-4">
          <Flag iso={c.iso} className="h-6 w-auto shrink-0 border border-rule" />
          <span className="display text-[clamp(1.9rem,3.4vw,2.8rem)] text-paper">{c.name}</span>
        </span>
        <span className="relative mt-4 text-sm leading-relaxed text-paper-2">{c.thesis}</span>
        <span className="relative mt-auto pt-6">
          <span className="eyebrow block">GNI per head, 2024</span>
          <span className="denom num mt-1.5 block text-3xl text-paper">{usd(v(c.iso, "gniPc", 2024))}</span>
        </span>
      </TLink>
    </Reveal>
  );
}

/** Closing slide: the previous and next country files (wrapping round the four) and the comparison page. */
export function Next({ prev, next }: { prev: Country; next: Country }) {
  return (
    <Section spec={specs.globe(null)} align="center" dim={0.45} id="next" label="Keep reading" width="wide">
      <Head serial="10" eyebrow="Keep reading" title="Open another country file" />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <CountryCard c={prev} dir="Previous" delay={100} />
        {next.iso !== prev.iso && <CountryCard c={next} dir="Next" delay={180} />}
      </div>

      <Reveal delay={260} className="mt-4">
        <TLink
          href="/compare"
          label="Compare"
          className="frame group flex flex-wrap items-center justify-between gap-x-6 gap-y-3 p-6 transition-colors hover:border-paper/40 sm:p-7"
        >
          <span className="relative">
            <span className="eyebrow block">All four, side by side</span>
            <span className="display mt-2 block text-[clamp(1.7rem,3vw,2.4rem)] text-paper">Compare the economies</span>
          </span>
          <span className="eyebrow relative flex items-center gap-2 text-paper">
            Open compare
            <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
              →
            </span>
          </span>
        </TLink>
      </Reveal>

      <Reveal delay={320} className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <TLink href="/" label="The story" className="link-underline text-paper-2 hover:text-paper">
          Back to the story
        </TLink>
        <TLink href="/method" label="Method" className="link-underline text-paper-2 hover:text-paper">
          Method and sources
        </TLink>
      </Reveal>
    </Section>
  );
}
