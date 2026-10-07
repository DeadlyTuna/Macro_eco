"use client";

import { useState } from "react";
import { Slide } from "@/components/motion/Slide";
import { Reveal, SplitHeading } from "@/components/motion/Reveal";
import { Flag } from "@/components/ui/Flag";
import { specs } from "@/components/scene/specs";
import { COUNTRIES } from "@/lib/countries";
import { ISOS, priceChange, val, type IndicatorKey, type Iso } from "@/lib/data";
import { num, pct, people, usd } from "@/lib/format";
import { NameOf, kept, listOf, nameOf } from "./prose";

const Y = 2024;

type Col = {
  id: string;
  label: string;
  unit: string;
  get: (iso: Iso) => number | null;
  show: (v: number) => string;
  /** Which end counts as best. Population has none: bigger is not better. */
  best?: "high" | "low";
};

const wb = (key: IndicatorKey) => (iso: Iso) => val(iso, key, Y);

const COLS: Col[] = [
  { id: "gniPc", label: "Income per head, Atlas", unit: "US$", get: wb("gniPc"), show: (v) => usd(v), best: "high" },
  { id: "gniPcPpp", label: "Income per head, PPP", unit: "international $", get: wb("gniPcPpp"), show: (v) => usd(v, { intl: true }), best: "high" },
  { id: "gniAtlas", label: "National income, Atlas", unit: "US$", get: wb("gniAtlas"), show: (v) => usd(v), best: "high" },
  { id: "pop", label: "Population", unit: "people", get: wb("pop"), show: (v) => people(v) },
  { id: "cpi", label: `Inflation ${Y}`, unit: "% a year", get: wb("cpi"), show: (v) => pct(v, 2), best: "low" },
  { id: "prices", label: "Prices, 2022–24", unit: "cumulative %", get: (iso) => priceChange(iso, 2022, 2024), show: (v) => pct(v, 1, true), best: "low" },
  { id: "gdpGrowth", label: "GDP growth", unit: "% in 2024", get: wb("gdpGrowth"), show: (v) => pct(v, 1), best: "high" },
  { id: "kept", label: "Kept share, GNI ÷ GDP", unit: "% of output", get: (iso) => kept(iso, Y), show: (v) => pct(v, 1), best: "high" },
  { id: "unemployment", label: "Unemployment", unit: "% of labour force", get: wb("unemployment"), show: (v) => pct(v, 1), best: "low" },
  { id: "lifeExp", label: "Life expectancy", unit: "years at birth", get: wb("lifeExp"), show: (v) => `${num(v, 1)} yrs`, best: "high" },
];

/** The country (or countries, on a tie) holding the best value in a column. */
function bestOf(c: Col): Iso[] {
  if (!c.best) return [];
  const have = ISOS.map((iso) => ({ iso, v: c.get(iso) })).filter((d): d is { iso: Iso; v: number } => d.v != null);
  if (!have.length) return [];
  const target = (c.best === "high" ? Math.max : Math.min)(...have.map((d) => d.v));
  return have.filter((d) => d.v === target).map((d) => d.iso);
}

const BEST = Object.fromEntries(COLS.map((c) => [c.id, bestOf(c)])) as Record<string, Iso[]>;
const RANKED = COLS.filter((c) => c.best);
const TALLY = ISOS.map((iso) => ({ iso, n: RANKED.filter((c) => BEST[c.id].includes(iso)).length }))
  .filter((t) => t.n > 0)
  .sort((a, b) => b.n - a.n);
const MISSING = COLS.flatMap((c) => ISOS.filter((iso) => c.get(iso) == null).map((iso) => ({ iso, col: c })));

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const word = (n: number) => WORDS[n] ?? String(n);

type Sort = { col: string; dir: "asc" | "desc" };

/** Section 4: every country on ten measures for 2024, sortable, with the best value in each column marked. */
export function Scoreboard() {
  const [sort, setSort] = useState<Sort>({ col: "gniPc", dir: "desc" });

  // A first click puts the best value on top: lowest first where lower is better, A to Z for names.
  const pick = (col: string) =>
    setSort((s) => {
      if (s.col === col) return { col, dir: s.dir === "desc" ? "asc" : "desc" };
      const lowFirst = col === "country" || COLS.find((c) => c.id === col)?.best === "low";
      return { col, dir: lowFirst ? "asc" : "desc" };
    });

  const col = COLS.find((c) => c.id === sort.col);
  const rows = [...ISOS].sort((a, b) => {
    if (sort.col === "country") return (sort.dir === "asc" ? 1 : -1) * COUNTRIES[a].short.localeCompare(COUNTRIES[b].short);
    const va = col?.get(a) ?? null;
    const vb = col?.get(b) ?? null;
    if (va == null && vb == null) return 0;
    if (va == null) return 1; // countries with no figure always sort last
    if (vb == null) return -1;
    return sort.dir === "asc" ? va - vb : vb - va;
  });

  const lead = TALLY[0];
  const ariaSort = (id: string) => (sort.col === id ? (sort.dir === "asc" ? "ascending" : "descending") : "none");

  return (
    <Slide spec={specs.population()} align="right" dim={0.5} label="Scoreboard" id="scoreboard" className="slide-pad flex min-h-svh items-center">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-xl lg:max-w-[600px]">
          <p className="eyebrow on-stage">Scoreboard · {Y}</p>
          <SplitHeading className="display mt-4 text-5xl text-paper sm:text-6xl">Ten measures, four economies</SplitHeading>
          <Reveal>
            <p className="lede on-stage mt-5">
              {lead.n < RANKED.length
                ? `No economy leads every column. ${NameOf(lead.iso)} has the best value in ${word(lead.n)} of the ${word(RANKED.length)} ranked ones; the rest go to ${listOf(TALLY.slice(1).map((t) => nameOf(t.iso)))}.`
                : `${NameOf(lead.iso)} has the best value in all ${word(RANKED.length)} ranked columns.`}{" "}
              Click a column heading to sort by it; the best value comes first.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-10" delay={80}>
          <div className="frame p-2 sm:p-3" style={{ background: "rgb(10 15 28 / 0.93)" }}>
            <div className="scroll-thin relative overflow-x-auto" data-lenis-prevent role="region" aria-label="Scoreboard table, scrolls sideways on narrow screens" tabIndex={0}>
              <table className="num w-full min-w-[1000px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Four economies compared on ten measures for {Y}. Use the column heading buttons to sort. A marker and the words &quot;best of the four&quot; flag the best value in each ranked column.
                </caption>
                <thead>
                  <tr className="border-b border-rule align-bottom">
                    <th scope="col" aria-sort={ariaSort("country")} className="sticky left-0 z-[1] bg-ink-2 px-3 py-3 font-normal">
                      <SortButton label="Country" unit="" on={sort.col === "country"} dir={sort.dir} onClick={() => pick("country")} />
                    </th>
                    {COLS.map((c) => (
                      <th key={c.id} scope="col" aria-sort={ariaSort(c.id)} className="px-3 py-3 font-normal">
                        <SortButton label={c.label} unit={c.unit} on={sort.col === c.id} dir={sort.dir} onClick={() => pick(c.id)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((iso) => (
                    <tr key={iso} className="border-b border-rule last:border-b-0">
                      <th scope="row" className="sticky left-0 z-[1] bg-ink-2 px-3 py-4 font-normal">
                        <span className="flex items-center gap-2.5 whitespace-nowrap text-paper">
                          <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: COUNTRIES[iso].color }} />
                          <Flag iso={iso} className="hidden h-3 w-auto shrink-0 sm:block" />
                          {COUNTRIES[iso].short}
                        </span>
                      </th>
                      {COLS.map((c) => {
                        const value = c.get(iso);
                        const best = BEST[c.id].includes(iso);
                        return (
                          <td key={c.id} className={`px-3 py-4 ${best ? "bg-paper/[0.05] text-paper" : "text-paper-2"}`}>
                            {value == null ? (
                              <span className="text-muted">
                                <span aria-hidden>—</span>
                                <span className="sr-only">not reported</span>
                              </span>
                            ) : (
                              <span className="whitespace-nowrap">
                                {best && <span aria-hidden className="mr-2 inline-block size-1.5 rounded-full bg-paper align-middle" />}
                                {c.show(value)}
                                {best && <span className="sr-only"> (best of the four)</span>}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 max-w-3xl space-y-2 text-[11px] leading-relaxed text-muted">
            <p>
              <span aria-hidden className="mr-1.5 inline-block size-1.5 rounded-full bg-paper align-middle" />
              Best of the four: highest for income, growth, kept share and life expectancy; lowest for inflation, cumulative prices and unemployment. Population is not ranked. Cumulative prices
              compound the annual inflation rates for 2022, 2023 and 2024. Kept share is GNI divided by GDP, both in current US$.
              {MISSING.length > 0 &&
                ` ${listOf(MISSING.map((m) => `${NameOf(m.iso)} does not report ${m.col.label.toLowerCase()} for ${Y}`))}. Missing figures are left out of the ranking.`}
            </p>
            <p>
              Atlas income is in US dollars while consumer prices are in local currency, so read the income and price columns as direction, not as one real-income series. Bosnia&apos;s {Y} inflation (
              {pct(val("BIH", "cpi", Y), 2)}) comes from Trading Economics&apos; republication of the World Bank series because the API cell was empty. Source: World Bank, World Development
              Indicators.
            </p>
          </div>
        </Reveal>
      </div>
    </Slide>
  );
}

function SortButton({ label, unit, on, dir, onClick }: { label: string; unit: string; on: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`group flex w-full min-w-[7rem] flex-col items-start gap-1 text-left transition-colors ${on ? "text-paper" : "text-paper-2 hover:text-paper"}`}>
      <span className="flex items-start gap-1.5 text-[13px] font-medium leading-tight">
        {label}
        <span aria-hidden className={`mt-px text-[10px] ${on ? "text-paper" : "text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
          {on ? (dir === "asc" ? "▲" : "▼") : "▼"}
        </span>
      </span>
      {unit && <span className="font-mono text-[10px] tracking-[0.04em] text-muted">{unit}</span>}
    </button>
  );
}
