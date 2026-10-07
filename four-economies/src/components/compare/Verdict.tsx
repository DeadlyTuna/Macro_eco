"use client";

import { useState } from "react";
import { Slide } from "@/components/motion/Slide";
import { Odometer, Reveal, SplitHeading } from "@/components/motion/Reveal";
import { ChartFrame, type LegendItem } from "@/components/charts/ChartFrame";
import { Flag } from "@/components/ui/Flag";
import { specs } from "@/components/scene/specs";
import { COUNTRIES, ORDER } from "@/lib/countries";
import { val, verdict, type Iso } from "@/lib/data";
import { num, pct } from "@/lib/format";
import { NameOf, PossOf, listOf, nameOf, ordinal } from "./prose";
import { Segmented } from "./controls";

type Mode = "deck" | "matched" | "twoYear";
type Row = { iso: Iso; income: number; prices: number; real: number };

const MODES: { id: Mode; label: string }[] = [
  { id: "deck", label: "Deck framing" },
  { id: "matched", label: "Like-for-like" },
  { id: "twoYear", label: "Two years" },
];

/** The year spans each framing uses (the same for every country). */
const span = (mode: Mode) => {
  const { incomeFrom, priceFrom } = verdict("BIH", mode);
  return { incomeFrom, priceFrom, incomeSteps: 2024 - incomeFrom, priceSteps: 2024 - priceFrom + 1 };
};

const WORD = ["no", "one", "two", "three"];
const rowsFor = (mode: Mode): Row[] => ORDER.map((iso) => ({ iso, ...verdict(iso, mode) })).sort((a, b) => b.real - a.real);

/** One scale for all three framings, so the bars are comparable when you switch. */
const ALL = MODES.flatMap((m) => rowsFor(m.id));
const LO = Math.min(0, ...ALL.flatMap((r) => [r.income, r.prices]));
const HI = Math.max(0, ...ALL.flatMap((r) => [r.income, r.prices]));

const BIH_ACROSS = MODES.map((m) => ({ ...m, real: verdict("BIH", m.id).real }));

const moved = (x: number) => (x >= 0 ? "rose" : "fell");

function describe(mode: Mode) {
  const s = span(mode);
  if (mode === "deck")
    return `The deck sets income per head in ${s.incomeFrom} against 2024, but counts price rises across ${s.priceFrom}, ${s.priceFrom + 1} and 2024. Prices get ${WORD[s.priceSteps]} years of change; income gets ${WORD[s.incomeSteps]}.`;
  return `Income per head from ${s.incomeFrom} to 2024 and prices over ${s.priceFrom}–2024 cover the same ${WORD[s.incomeSteps]} years of change.`;
}

/** The answer in plain words, computed for the framing on screen. */
function story(rows: Row[]) {
  const i = rows.findIndex((r) => r.iso === "BIH");
  const b = rows[i];
  const top = rows[0];
  const parts = [
    `${PossOf("BIH")} income per head ${moved(b.income)} ${pct(Math.abs(b.income), 1)} while prices ${moved(b.prices)} ${pct(Math.abs(b.prices), 1)}, so in real terms it ${
      b.real < 0 ? `went backwards by ${pct(-b.real, 1)}` : `gained ${pct(b.real, 1)}`
    }.`,
  ];
  if (i === rows.length - 1) {
    const next = rows[i - 1];
    const gap = next.real - b.real;
    parts.push(`That is the weakest of the four${gap >= 5 ? ", by a wide margin" : ""}: ${nameOf(next.iso)}, the next weakest, is ${num(gap, 1)} points ahead.`);
  } else {
    parts.push(`On this framing it ranks ${ordinal(i + 1)} of the four.`);
  }
  if (top.iso !== "BIH")
    parts.push(`${NameOf(top.iso)} leads at ${pct(top.real, 1, true)} real, with income per head ${pct(top.income, 1, true)} and prices ${pct(top.prices, 1, true)}.`);
  return parts.join(" ");
}

function PairBar({ label, value, color, outlined }: { label: string; value: number; color: string; outlined?: boolean }) {
  const range = HI - LO || 1;
  const z = ((0 - LO) / range) * 100;
  const p = ((value - LO) / range) * 100;
  return (
    <div className="grid grid-cols-[6.25rem_minmax(0,1fr)_4.25rem] items-center gap-x-3 text-xs">
      <span className="text-paper-2">{label}</span>
      <span aria-hidden className="relative h-2.5 bg-paper/[0.06]">
        <span
          className="absolute inset-y-0 transition-[left,width] duration-700 ease-mint"
          style={{
            left: `${Math.min(z, p)}%`,
            width: `${Math.max(0.6, Math.abs(p - z))}%`,
            ...(outlined
              ? { background: "repeating-linear-gradient(135deg, rgb(189 183 168 / 0.55) 0 2px, transparent 2px 5px)", border: "1px solid var(--color-paper-2)" }
              : { background: color }),
          }}
        />
        {LO < 0 && <span className="absolute -inset-y-1 w-px bg-paper/50" style={{ left: `${z}%` }} />}
      </span>
      <span className="num text-right text-paper">{pct(value, 1, true)}</span>
    </div>
  );
}

const LEGEND: LegendItem[] = [
  { label: "Income per head (solid, country colour)", color: "var(--color-paper)" },
  { label: "Consumer prices (hatched)", color: "var(--color-paper-2)", ghost: true },
];

/** Section 5: did income per head outrun prices? Three ways of lining up the years. */
export function Verdict() {
  const [mode, setMode] = useState<Mode>("deck");
  const [sel, setSel] = useState<Iso>("BIH");

  const rows = rowsFor(mode);
  const chosen = rows.find((r) => r.iso === sel) ?? rows[0];
  const s = span(mode);
  const table = {
    columns: ["Country", `Income per head, ${s.incomeFrom}–2024`, `Prices, ${s.priceFrom}–2024`, "Real change"],
    rows: rows.map((r) => [COUNTRIES[r.iso].short, pct(r.income, 1, true), pct(r.prices, 1, true), pct(r.real, 1, true)]),
  };

  return (
    <Slide spec={specs.verdict(sel, mode)} align="right" label="Verdict" id="verdict" className="slide-pad flex min-h-svh items-center">
      <div className="w-full max-w-xl lg:max-w-[600px]">
        <p className="eyebrow on-stage">Verdict · real income</p>
        <SplitHeading className="display mt-4 text-5xl text-paper sm:text-6xl">Did income outrun prices?</SplitHeading>
        <Reveal>
          <p className="lede on-stage mt-5">
            Income per head is in US dollars; prices are in each country&apos;s own currency. Line the years up three ways and see whether the answer changes.
          </p>
        </Reveal>

        <Reveal className="mt-8 space-y-5" delay={80}>
          <Segmented label="Framing" value={mode} onChange={setMode} options={MODES.map((m) => ({ value: m.id, label: m.label }))} />
          <p className="border-l border-rule pl-4 text-sm leading-relaxed text-paper-2">{describe(mode)}</p>
          <Segmented
            label="Balance scale shows"
            size="sm"
            value={sel}
            onChange={setSel}
            options={ORDER.map((iso) => ({
              value: iso,
              label: (
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: COUNTRIES[iso].color }} />
                  {COUNTRIES[iso].short}
                </span>
              ),
            }))}
          />
        </Reveal>

        <Reveal className="mt-8" delay={140}>
          <ChartFrame
            title="Income per head against prices"
            subtitle={`Income ${s.incomeFrom}→2024, prices ${s.priceFrom}–2024. Sorted by real change.`}
            legend={LEGEND}
            table={table}
            source="Source: World Bank, World Development Indicators. All bars use one scale. Real change = (1 + income change) ÷ (1 + price change) − 1."
          >
            <ul className="divide-y divide-rule">
              {rows.map((r) => (
                <li key={r.iso} className={`py-4 ${r.iso === sel ? "bg-paper/[0.04]" : ""}`} aria-current={r.iso === sel ? "true" : undefined}>
                  <div className="flex flex-col gap-1.5 px-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <h3 className="flex min-w-0 items-center gap-2 text-sm font-medium text-paper">
                      <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: COUNTRIES[r.iso].color }} />
                      <Flag iso={r.iso} className="h-3 w-auto shrink-0" />
                      <span className="truncate">{COUNTRIES[r.iso].short}</span>
                    </h3>
                    <p className="flex shrink-0 items-baseline gap-2">
                      <Odometer value={pct(r.real, 1, true)} className={`denom text-3xl ${r.real < 0 ? "text-paper-2" : "text-paper"}`} />
                      <span className="eyebrow">real, {r.real < 0 ? "behind prices" : "ahead of prices"}</span>
                    </p>
                  </div>
                  <div className="mt-3 space-y-2 px-2">
                    <PairBar label="Income per head" value={r.income} color={COUNTRIES[r.iso].color} />
                    <PairBar label="Consumer prices" value={r.prices} color="var(--color-paper-2)" outlined />
                  </div>
                </li>
              ))}
            </ul>
          </ChartFrame>
        </Reveal>

        <Reveal className="mt-6 space-y-4" delay={80}>
          <p className="text-base leading-relaxed text-paper" aria-live="polite">
            {story(rows)}
          </p>
          <p className="text-sm leading-relaxed text-paper-2">
            On the scale: {nameOf(chosen.iso)}, income {pct(chosen.income, 1, true)} against prices {pct(chosen.prices, 1, true)}.
          </p>
          <p className="text-sm leading-relaxed text-paper-2">
            Bosnia across the three framings: {listOf(BIH_ACROSS.map((m) => `${pct(m.real, 1, true)} (${m.label.toLowerCase()})`))}. The framing alone moves it from {pct(Math.min(...BIH_ACROSS.map((m) => m.real)), 1, true)}{" "}
            to {pct(Math.max(...BIH_ACROSS.map((m) => m.real)), 1, true)}.
          </p>
          <p className="border-t border-rule pt-4 text-xs leading-relaxed text-muted">
            Caveat: Atlas income is measured in US dollars while consumer prices are in local currency, so this shows direction, not an exact real-income series. Prices compound the annual
            inflation rates for the years shown. Bosnia&apos;s 2024 inflation ({pct(val("BIH", "cpi", 2024), 2)}) comes from Trading Economics&apos; republication of the World Bank series
            because the API cell was empty.
          </p>
        </Reveal>
      </div>
    </Slide>
  );
}
