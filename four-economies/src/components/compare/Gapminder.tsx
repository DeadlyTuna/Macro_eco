"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Slide } from "@/components/motion/Slide";
import { Reveal, SplitHeading } from "@/components/motion/Reveal";
import { ChartFrame, type LegendItem } from "@/components/charts/ChartFrame";
import { Bubble, type BubbleSeries } from "@/components/charts/Bubble";
import { specs } from "@/components/scene/specs";
import { COUNTRIES } from "@/lib/countries";
import { ISOS, YEARS, change, v, val, type Iso } from "@/lib/data";
import { pct, people, usd } from "@/lib/format";
import { NameOf, listOf, nameOf, times } from "./prose";
import { SOLID_FRAME } from "./controls";

const FIRST = YEARS[0];
const LAST = YEARS[YEARS.length - 1];
const WINDOW_FROM = 2022;
const WINDOW_TO = 2024;

const X_DOMAIN: [number, number] = [2000, 40000];
const X_TICKS = [2000, 5000, 10000, 20000, 40000].map((value) => ({ value, label: `$${value / 1000}k` }));
const Y_DOMAIN: [number, number] = [-3, 16];
const Y_TICKS = [-3, 0, 4, 8, 12, 16];

const SERIES: BubbleSeries[] = ISOS.map((iso) => ({
  id: iso,
  label: COUNTRIES[iso].short,
  color: COUNTRIES[iso].color,
  data: YEARS.map((year) => ({ year, x: val(iso, "gniPcPpp", year), y: val(iso, "cpi", year), r: val(iso, "pop", year) })),
}));
const LEGEND: LegendItem[] = ISOS.map((iso) => ({ label: COUNTRIES[iso].short, color: COUNTRIES[iso].color }));

/** "2000–2005 and 2025". */
function spans(years: number[]) {
  const out: string[] = [];
  for (let i = 0; i < years.length; ) {
    let j = i;
    while (j + 1 < years.length && years[j + 1] === years[j] + 1) j++;
    out.push(j > i ? `${years[i]}–${years[j]}` : String(years[i]));
    i = j + 1;
  }
  return listOf(out);
}

/* Everything the copy says is worked out from the World Bank series. */
const growth = ISOS.map((iso) => ({ iso, r: v(iso, "gniPcPpp", LAST) / v(iso, "gniPcPpp", FIRST) })).sort((a, b) => b.r - a.r);
const fastest = growth[0];
const slowest = growth[growth.length - 1];

const offScale = ISOS.map((iso) => ({
  iso,
  hits: YEARS.map((y) => ({ y, c: val(iso, "cpi", y) })).filter((d): d is { y: number; c: number } => d.c != null && (d.c > Y_DOMAIN[1] || d.c < Y_DOMAIN[0])),
})).filter((o) => o.hits.length > 0);
const offCount = offScale.reduce((n, o) => n + o.hits.length, 0);
const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const offText = offScale.map((o) => `${NameOf(o.iso)} in ${listOf(o.hits.map((h) => `${h.y} (${pct(h.c, 1)})`))}`).join("; ");

const gaps = ISOS.map((iso) => ({
  iso,
  years: YEARS.filter((y) => val(iso, "cpi", y) == null),
})).filter((g) => g.years.length > 0);
const gapText = gaps.map((g) => `${NameOf(g.iso)} has no inflation figure for ${spans(g.years)}, so it is not plotted in ${g.years.length > 1 ? "those years" : "that year"}.`).join(" ");

const SYC_POP_JUMP = pct(change(v("SYC", "pop", 2021), v("SYC", "pop", 2022)), 0);

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

const PlayIcon = () => (
  <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 fill-current">
    <path d="M1.5 0.8v8.4L9 5z" />
  </svg>
);
const PauseIcon = () => (
  <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 fill-current">
    <path d="M1.5 1h2.4v8H1.5zM6.1 1h2.4v8H6.1z" />
  </svg>
);

/** Section 3: income against inflation, bubble size for population, one frame per year. */
export function Gapminder() {
  const [year, setYear] = useState(FIRST);
  const [playing, setPlaying] = useState(false);
  const yearRef = useRef(year);
  const reduced = useReducedMotion();
  // Without tweening each year is a still frame, so give it longer on screen.
  const stepMs = reduced ? 1400 : 700;

  const goTo = (y: number) => {
    yearRef.current = y;
    setYear(y);
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = yearRef.current + 1;
      if (next > LAST) {
        setPlaying(false);
        return;
      }
      yearRef.current = next;
      setYear(next);
    }, stepMs);
    return () => clearInterval(id);
  }, [playing, stepMs]);

  const toggle = () => {
    if (playing) return setPlaying(false);
    if (yearRef.current >= LAST) goTo(FIRST);
    setPlaying(true);
  };

  const rows = ISOS.map((iso: Iso) => ({ iso, x: val(iso, "gniPcPpp", year), y: val(iso, "cpi", year), r: val(iso, "pop", year) }));
  const table = {
    columns: ["Country", "Income per head, PPP", "Inflation", "Population"],
    rows: rows.map((d) => [COUNTRIES[d.iso].short, usd(d.x, { intl: true }), d.y == null ? "not reported" : pct(d.y, 2), people(d.r)]),
  };
  const inWindow = year >= WINDOW_FROM && year <= WINDOW_TO;

  return (
    <Slide spec={specs.globe(null)} align="center" dim={0.45} label="Over time" id="gapminder" className="slide-pad flex min-h-svh items-center">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <p className="eyebrow on-stage">
            {FIRST}–{LAST} · income, prices and people
          </p>
          <SplitHeading className="display mt-4 text-5xl text-paper sm:text-6xl">Income and prices, year by year</SplitHeading>
          <Reveal>
            <p className="lede on-stage mt-5">
              Between {FIRST} and {LAST}, income per head at PPP, in current international dollars, rose {times(fastest.r)} in {nameOf(fastest.iso)}, the most of the four, and {times(slowest.r)} in{" "}
              {nameOf(slowest.iso)}, the least. Press play to watch each economy&apos;s path, or drag the year.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-10" delay={80}>
          <ChartFrame
            title="Income per head against inflation"
            subtitle="Income is PPP, on a log scale. Bubble area is population. Faint lines are each country's path so far."
            legend={LEGEND}
            table={table}
            source="Source: World Bank, World Development Indicators"
            className={SOLID_FRAME}
          >
            <Bubble
              series={SERIES}
              year={year}
              xDomain={X_DOMAIN}
              yDomain={Y_DOMAIN}
              xTicks={X_TICKS}
              yTicks={Y_TICKS}
              xFormat="intl"
              yFormat="pct2"
              yTickFormat="pct0"
              rFormat="people"
              xLabel="Income per head, PPP (current international $, log scale)"
              yLabel="Inflation, consumer prices (% a year)"
              xName="Income per head, PPP"
              yName="Inflation"
              rName="population"
              playing={playing}
              stepMs={stepMs}
            />
          </ChartFrame>

          <div className="frame mt-4 p-4 sm:p-5">
            <div className="relative flex flex-wrap items-center gap-x-5 gap-y-4">
              <button
                type="button"
                onClick={toggle}
                className="eyebrow inline-flex min-w-[7rem] items-center justify-center gap-2.5 border border-rule px-4 py-2.5 text-paper transition-colors hover:border-paper/40 hover:bg-ink-3"
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
                {playing ? "Pause" : year >= LAST ? "Replay" : "Play"}
              </button>

              <div className="flex min-w-[13rem] flex-1 items-center gap-3">
                <label htmlFor="gapminder-year" className="eyebrow">
                  Year
                </label>
                <span className="num text-xs text-muted" aria-hidden>
                  {FIRST}
                </span>
                <input
                  id="gapminder-year"
                  type="range"
                  min={FIRST}
                  max={LAST}
                  step={1}
                  value={year}
                  onChange={(e) => {
                    setPlaying(false);
                    goTo(Number(e.target.value));
                  }}
                  aria-valuetext={inWindow ? `${year}, inside the 2022 to 2024 window` : String(year)}
                  className="h-6 min-w-0 flex-1 cursor-pointer accent-paper"
                />
                <span className="num text-xs text-muted" aria-hidden>
                  {LAST}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <p className="denom text-4xl text-paper" aria-hidden>
                  {year}
                </p>
                {inWindow && <span className="eyebrow border border-rule px-2 py-1 text-paper-2">Deck window</span>}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  goTo(WINDOW_TO);
                }}
                className="eyebrow border border-rule px-3 py-2.5 text-paper-2 transition-colors hover:border-paper/40 hover:text-paper"
              >
                Go to {WINDOW_TO}
              </button>
            </div>

            <dl className="relative mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4 lg:grid-cols-4">
              {rows.map((d) => (
                <div key={d.iso} className="min-w-0">
                  <dt className="flex items-center gap-2 text-sm text-paper">
                    <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: COUNTRIES[d.iso].color }} />
                    {COUNTRIES[d.iso].short}
                  </dt>
                  <dd className="num mt-1.5 space-y-0.5 text-xs text-paper-2">
                    <span className="block">{usd(d.x, { intl: true })} per head</span>
                    <span className="block">{d.y == null ? "no inflation figure" : `${pct(d.y, 2)} inflation`}</span>
                    <span className="block">{people(d.r)} people</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-4 max-w-3xl space-y-2 text-[11px] leading-relaxed text-muted">
            <p>
              {offCount > 0 && (
                <>
                  The inflation axis runs from {pct(Y_DOMAIN[0], 0)} to {pct(Y_DOMAIN[1], 0)}. {COUNT_WORDS[offCount] ?? offCount} {offCount === 1 ? "reading falls" : "readings fall"} outside that range and are drawn on the edge with a marker: {offText}.{" "}
                </>
              )}
              {gapText}
            </p>
            <p>
              Bubble area is proportional to population; Seychelles and the Maldives are drawn at a minimum size so they stay visible. Seychelles&apos; population series jumps {SYC_POP_JUMP} between
              2021 and 2022, a break after the 2022 census, so its bubble steps up that year without real growth. Bosnia&apos;s 2024 inflation ({pct(val("BIH", "cpi", 2024), 2)}) comes from Trading
              Economics&apos; republication of the World Bank series because the API cell was empty.
            </p>
          </div>
        </Reveal>
      </div>
    </Slide>
  );
}
