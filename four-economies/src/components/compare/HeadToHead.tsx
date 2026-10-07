"use client";

import { useState } from "react";
import { Slide } from "@/components/motion/Slide";
import { Odometer, Reveal, SplitHeading } from "@/components/motion/Reveal";
import { Flag } from "@/components/ui/Flag";
import { specs } from "@/components/scene/specs";
import { COUNTRIES, ORDER } from "@/lib/countries";
import { change, val, type IndicatorKey, type Iso } from "@/lib/data";
import { num, pct, people, usd } from "@/lib/format";
import { NameOf, PossOf, kept, nameOf, possOf, times } from "./prose";
import { Segmented, SelectField } from "./controls";

type Metric = {
  id: string;
  label: string;
  unit: string;
  get: (iso: Iso, year: number) => number | null;
  show: (v: number) => string;
  /** How the distance between the two values is put into words. */
  gap: "ratio" | "points" | "years";
  /** Sentence naming the higher (`hi`) and lower (`lo`) country; `d` is the formatted ratio or gap. */
  say: (hi: Iso, lo: Iso, d: string) => string;
};

const wb = (key: IndicatorKey) => (iso: Iso, year: number) => val(iso, key, year);

const METRICS: Metric[] = [
  {
    id: "gniPc",
    label: "Income per head, Atlas method",
    unit: "current US$",
    get: wb("gniPc"),
    show: (v) => usd(v),
    gap: "ratio",
    say: (h, l, d) => `${NameOf(h)} earns ${d} ${nameOf(l)} per head in US dollars.`,
  },
  {
    id: "gniPcPpp",
    label: "Income per head, PPP",
    unit: "current international $",
    get: wb("gniPcPpp"),
    show: (v) => usd(v, { intl: true }),
    gap: "ratio",
    say: (h, l, d) => `${NameOf(h)} earns ${d} ${nameOf(l)} per head at PPP.`,
  },
  {
    id: "gniAtlas",
    label: "National income (GNI), Atlas method",
    unit: "current US$",
    get: wb("gniAtlas"),
    show: (v) => usd(v),
    gap: "ratio",
    say: (h, l, d) => `${PossOf(h)} national income is ${d} ${possOf(l)}.`,
  },
  {
    id: "pop",
    label: "Population",
    unit: "people",
    get: wb("pop"),
    show: (v) => people(v),
    gap: "ratio",
    say: (h, l, d) => `${NameOf(h)} has ${d} as many people as ${nameOf(l)}.`,
  },
  {
    id: "cpi",
    label: "Inflation, consumer prices",
    unit: "annual %",
    get: wb("cpi"),
    show: (v) => pct(v, 2),
    gap: "points",
    say: (h, l, d) => `Inflation ran ${d} higher in ${nameOf(h)} than in ${nameOf(l)}.`,
  },
  {
    id: "gdpGrowth",
    label: "GDP growth",
    unit: "annual %, constant prices",
    get: wb("gdpGrowth"),
    show: (v) => pct(v, 1),
    gap: "points",
    say: (h, l, d) => `${NameOf(h)} grew ${d} faster than ${nameOf(l)}.`,
  },
  {
    id: "kept",
    label: "Kept share, GNI ÷ GDP",
    unit: "% of output kept as national income",
    get: kept,
    show: (v) => pct(v, 1),
    gap: "points",
    say: (h, l, d) => `${NameOf(h)} keeps ${d} more of its output as national income than ${nameOf(l)}.`,
  },
  {
    id: "remitPct",
    label: "Remittances received",
    unit: "% of GDP",
    get: wb("remitPct"),
    show: (v) => pct(v, Math.abs(v) < 1 ? 2 : 1),
    gap: "points",
    say: (h, l, d) => `Remittances are worth ${d} more of GDP in ${nameOf(h)} than in ${nameOf(l)}.`,
  },
  {
    id: "exportsPct",
    label: "Exports of goods and services",
    unit: "% of GDP",
    get: wb("exportsPct"),
    show: (v) => pct(v, 1),
    gap: "points",
    say: (h, l, d) => `Exports are worth ${d} more of GDP in ${nameOf(h)} than in ${nameOf(l)}.`,
  },
  {
    id: "unemployment",
    label: "Unemployment",
    unit: "% of labour force, ILO model",
    get: wb("unemployment"),
    show: (v) => pct(v, 1),
    gap: "points",
    say: (h, l, d) => `Unemployment is ${d} higher in ${nameOf(h)} than in ${nameOf(l)}.`,
  },
  {
    id: "lifeExp",
    label: "Life expectancy at birth",
    unit: "years",
    get: wb("lifeExp"),
    show: (v) => `${num(v, 1)} yrs`,
    gap: "years",
    say: (h, l, d) => `Life expectancy at birth is ${d} longer in ${nameOf(h)} than in ${nameOf(l)}.`,
  },
];

const YEAR_OPTS = [2022, 2023, 2024, 2025];
const SYC_POP_JUMP = pct(change(val("SYC", "pop", 2021) ?? NaN, val("SYC", "pop", 2022) ?? NaN), 0);

function sentence(m: Metric, a: Iso, b: Iso, va: number | null, vb: number | null, year: number) {
  if (va == null && vb == null) return `Neither reports this for ${year}.`;
  if (va == null) return `${NameOf(a)} does not report this for ${year}.`;
  if (vb == null) return `${NameOf(b)} does not report this for ${year}.`;
  const [hi, lo, vh, vl] = va >= vb ? [a, b, va, vb] : [b, a, vb, va];
  if (m.gap === "ratio") {
    if (vl <= 0) return "";
    const r = vh / vl;
    return r < 1.005 ? `${NameOf(a)} and ${nameOf(b)} are level.` : m.say(hi, lo, times(r));
  }
  const g = vh - vl;
  if (g < 0.05) return `${NameOf(a)} and ${nameOf(b)} are level.`;
  const d = m.gap === "years" ? `${num(g, 1)} years` : `${num(g, 1)} ${g >= 0.95 && g < 1.05 ? "point" : "points"}`;
  return m.say(hi, lo, d);
}

function MiniBar({ value, lo, hi, color }: { value: number | null; lo: number; hi: number; color: string }) {
  const span = hi - lo || 1;
  const z = ((0 - lo) / span) * 100;
  const p = (((value ?? 0) - lo) / span) * 100;
  return (
    <div aria-hidden className="relative mt-2.5 h-1 w-full bg-paper/[0.07]">
      <div
        className="absolute inset-y-0 transition-[left,width] duration-700 ease-mint"
        style={{ left: `${Math.min(z, p)}%`, width: `${value == null ? 0 : Math.max(0.6, Math.abs(p - z))}%`, background: color }}
      />
      {lo < 0 && <div className="absolute -inset-y-1 w-px bg-paper/50" style={{ left: `${z}%` }} />}
    </div>
  );
}

function Figure({ iso, value, text }: { iso: Iso; value: number | null; text: string }) {
  if (value == null)
    return (
      <p className="flex items-baseline gap-2">
        <span className="sr-only">{COUNTRIES[iso].short}: </span>
        <span aria-hidden className="denom text-2xl text-muted sm:text-3xl">
          —
        </span>
        <span className="eyebrow">not reported</span>
      </p>
    );
  return (
    <p>
      <span className="sr-only">{COUNTRIES[iso].short}: </span>
      <Odometer value={text} className="denom text-2xl text-paper sm:text-3xl" />
    </p>
  );
}

function CountrySelect({ id, label, value, onChange }: { id: string; label: string; value: Iso; onChange: (iso: Iso) => void }) {
  return (
    <SelectField id={id} label={label} value={value} onChange={(v) => onChange(v as Iso)} dot={COUNTRIES[value].color}>
      {ORDER.map((iso) => (
        <option key={iso} value={iso}>
          {COUNTRIES[iso].short}
        </option>
      ))}
    </SelectField>
  );
}

/** Section 1: any two countries, eleven measures, one year. */
export function HeadToHead() {
  const [a, setA] = useState<Iso>("BIH");
  const [b, setB] = useState<Iso>("SYC");
  const [year, setYear] = useState(2024);

  // Picking the country already on the other side swaps the two.
  const pickA = (next: Iso) => {
    if (next === b) setB(a);
    setA(next);
  };
  const pickB = (next: Iso) => {
    if (next === a) setA(b);
    setB(next);
  };

  const rows = METRICS.map((m) => {
    const va = m.get(a, year);
    const vb = m.get(b, year);
    const lo = Math.min(0, va ?? 0, vb ?? 0);
    const hi = Math.max(0, va ?? 0, vb ?? 0);
    return { m, va, vb, lo, hi, text: sentence(m, a, b, va, vb, year) };
  });
  const reported2025 = METRICS.filter((m) => m.get(a, 2025) != null && m.get(b, 2025) != null).length;

  return (
    <Slide spec={specs.gniPc(a)} align="right" label="Side by side" id="side-by-side" className="slide-pad flex min-h-svh items-center">
      <div className="w-full max-w-xl lg:max-w-[600px]">
        <p className="eyebrow on-stage">Compare · World Bank data, 2022–2024</p>
        <SplitHeading as="h1" immediate className="display mt-4 text-6xl text-paper sm:text-7xl lg:text-8xl">
          Side by side
        </SplitHeading>
        <Reveal>
          <p className="lede on-stage mt-6">
            Pick any two of the four economies and a year. Every figure below is the World Bank&apos;s, and every comparison is worked out from it.
          </p>
        </Reveal>

        <Reveal className="frame mt-8 p-4 sm:p-5" delay={80}>
          <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:gap-3">
            <CountrySelect id="h2h-a" label="Country A" value={a} onChange={pickA} />
            <button
              type="button"
              onClick={() => {
                setA(b);
                setB(a);
              }}
              className="eyebrow mb-px border border-rule px-2.5 py-3 text-paper-2 transition-colors hover:border-paper/30 hover:text-paper"
            >
              Swap
            </button>
            <CountrySelect id="h2h-b" label="Country B" value={b} onChange={pickB} />
          </div>
          <Segmented
            className="relative mt-5"
            label="Year"
            value={year}
            onChange={setYear}
            options={YEAR_OPTS.map((y) => ({ value: y, label: y, srHint: y === 2025 ? "partial" : undefined }))}
          />
          <p className="relative mt-3 text-xs text-muted" aria-live="polite">
            {year === 2025
              ? `2025 is partial: ${reported2025} of ${METRICS.length} measures are published for both countries so far.`
              : `Inside the deck’s 2022–2024 window. Bars compare the two countries on each line.`}
          </p>
        </Reveal>

        <div className="sticky top-[68px] z-10 mt-8 grid grid-cols-2 gap-x-6 border-b border-rule bg-ink/90 py-3" aria-hidden>
          {[a, b].map((iso) => (
            <span key={iso} className="flex min-w-0 items-center gap-2 text-sm text-paper">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: COUNTRIES[iso].color }} />
              <Flag iso={iso} className="h-3 w-auto shrink-0" />
              <span className="truncate">{COUNTRIES[iso].short}</span>
              <span className="num ml-auto text-xs text-muted">{year}</span>
            </span>
          ))}
        </div>

        <dl className="divide-y divide-rule">
          {rows.map(({ m, va, vb, lo, hi, text }) => (
            <div key={m.id} className="py-5">
              <dt className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-sm font-medium text-paper">{m.label}</span>
                <span className="text-[11px] text-muted">{m.unit}</span>
              </dt>
              <dd className="mt-3 grid grid-cols-2 gap-x-6">
                <div className="min-w-0">
                  <Figure iso={a} value={va} text={va == null ? "—" : m.show(va)} />
                  <MiniBar value={va} lo={lo} hi={hi} color={COUNTRIES[a].color} />
                </div>
                <div className="min-w-0">
                  <Figure iso={b} value={vb} text={vb == null ? "—" : m.show(vb)} />
                  <MiniBar value={vb} lo={lo} hi={hi} color={COUNTRIES[b].color} />
                </div>
              </dd>
              {text && <dd className="mt-3 text-[13px] leading-snug text-paper-2">{text}</dd>}
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[11px] leading-relaxed text-muted">
          Source: World Bank, World Development Indicators. Kept share is GNI divided by GDP, both in current US$. Seychelles&apos; population series jumps {SYC_POP_JUMP} between 2021 and 2022: a
          break after the 2022 census, not real growth. Bosnia&apos;s 2024 inflation ({pct(val("BIH", "cpi", 2024), 2)}) comes from Trading Economics&apos; republication of the World Bank series
          because the API cell was empty.
        </p>
      </div>
    </Slide>
  );
}
