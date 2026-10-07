import { Fragment } from "react";
import { Slide } from "@/components/motion/Slide";
import { Reveal, SplitHeading } from "@/components/motion/Reveal";
import { specs } from "@/components/scene/specs";
import { Flag } from "@/components/ui/Flag";
import type { Country } from "@/lib/countries";
import type { Research } from "@/lib/research";
import { num } from "@/lib/format";
import { Chips } from "./parts";

const LANG: Record<Country["iso"], string> = { BIH: "bs", SYC: "crs", VNM: "vi", MDV: "dv" };

/** Fluid size from the longest word, so "Herzegovina" never overflows a phone. */
function titleSize(name: string) {
  const L = Math.max(...name.split(/\s+/).map((w) => w.length));
  const lo = Math.min(3.5, 36 / L);
  const vw = Math.min(11, 70 / L);
  const hi = Math.min(10, 85 / L);
  return `clamp(${lo.toFixed(2)}rem, ${vw.toFixed(2)}vw, ${hi.toFixed(2)}rem)`;
}

export function Hero({ c, research }: { c: Country; research: Research | null }) {
  const parts = c.name.split(" & ");
  const basics = research?.basics;
  const chips = [
    { k: "Capital", v: c.capital },
    { k: "Currency", v: `${c.currency.name} (${c.currency.code})` },
    { k: "Regime", v: c.regimeShort },
    { k: "Income group", v: c.incomeGroup },
    // A chip is one short fact; the Maldives entry is a sentence, so it stays out.
    ...(basics?.islands != null && (typeof basics.islands === "number" || basics.islands.length <= 24)
      ? [{ k: "Islands", v: typeof basics.islands === "number" ? num(basics.islands) : basics.islands }]
      : []),
  ];

  return (
    <Slide spec={specs.sculpture(c.iso)} id="overview" label="Overview" className="slide-pad flex min-h-svh items-center">
      <div className="w-full max-w-3xl">
        <p className="eyebrow mb-6 flex items-center gap-3">
          <span aria-hidden className="h-px w-8" style={{ background: c.color }} />
          Country file · <span className="num">{c.iso2}</span> · 2022–2024
        </p>

        <div style={{ fontSize: titleSize(c.name) }}>
          <SplitHeading as="h1" immediate className="display on-stage text-paper">
            {parts.map((p, i) => (
              <Fragment key={p}>
                {i > 0 && (
                  <>
                    {" "}
                    <span className="italic text-paper-2">&amp;</span>{" "}
                  </>
                )}
                {p}
              </Fragment>
            ))}
          </SplitHeading>
        </div>

        <Reveal delay={250} className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Flag iso={c.iso} className="h-7 w-auto shrink-0 border border-rule" />
          {c.local.script === "thaana" ? (
            <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span lang={LANG[c.iso]} dir="rtl" className="font-thaana text-[clamp(1.6rem,3vw,2.4rem)] leading-none text-paper on-stage">
                {c.local.text}
              </span>
              {c.local.alt && (
                <span lang={`${LANG[c.iso]}-Latn`} className="eyebrow text-paper-2">
                  {c.local.alt}
                </span>
              )}
            </p>
          ) : (
            <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span lang={LANG[c.iso]} className="display on-stage text-[clamp(1.5rem,2.6vw,2.2rem)] italic text-paper-2">
                {c.local.text}
              </span>
              {c.local.alt && (
                <span lang={/[Ѐ-ӿ]/.test(c.local.alt) ? `${LANG[c.iso]}-Cyrl` : undefined} className="font-mono text-xs text-muted">
                  {c.local.alt}
                </span>
              )}
            </p>
          )}
        </Reveal>

        <div className="max-w-xl">
          <Reveal delay={350}>
            <p className="lede on-stage mt-8">{c.thesis}</p>
          </Reveal>
          <Reveal delay={450}>
            <Chips items={chips} className="mt-8" />
          </Reveal>
          <Reveal delay={550}>
            <p className="mt-10 flex max-w-md gap-3 text-xs leading-relaxed text-muted">
              <span aria-hidden className="mt-[0.55em] h-px w-5 shrink-0 bg-paper/30" />
              <span>
                <span className="text-paper-2">Particle landmark: {c.artifact.name}</span> — {c.artifact.caption}
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </Slide>
  );
}
