"use client";

import { useMemo, useState } from "react";
import { Slide } from "@/components/motion/Slide";
import { Reveal, SplitHeading } from "@/components/motion/Reveal";
import { ChartFrame, type LegendItem } from "@/components/charts/ChartFrame";
import { LineChart, type LineSeries } from "@/components/charts/LineChart";
import { specs } from "@/components/scene/specs";
import { COUNTRIES } from "@/lib/countries";
import { INDICATORS, ISOS, YEARS, points, val, type IndicatorKey, type Region } from "@/lib/data";
import { formatter, num, type FormatKey } from "@/lib/format";
import { NameOf, listOf, nameOf } from "./prose";
import { SOLID_FRAME, Segmented, SelectField } from "./controls";

type Curated = {
  key: IndicatorKey;
  label: string;
  /** Lower-case phrase for the summary sentence. */
  noun: string;
  fk: FormatKey;
  group: string;
  log?: boolean;
  zero?: boolean;
  /** False for totals, where a World line is not comparable. */
  world?: boolean;
};

const CURATED: Curated[] = [
  { key: "gniPc", label: "Income per head, Atlas method", noun: "income per head (Atlas)", fk: "usd", group: "Income" },
  { key: "gniPcPpp", label: "Income per head, PPP", noun: "income per head at PPP", fk: "intl", group: "Income" },
  { key: "gniAtlas", label: "National income (GNI), Atlas method", noun: "national income", fk: "usd", group: "Income", log: true, world: false },
  { key: "gdpPc", label: "GDP per head", noun: "GDP per head", fk: "usd", group: "Income" },
  { key: "gdpGrowth", label: "GDP growth", noun: "GDP growth", fk: "pct", group: "Growth and prices", zero: true },
  { key: "cpi", label: "Inflation, consumer prices", noun: "consumer price inflation", fk: "pct", group: "Growth and prices", zero: true },
  { key: "deflator", label: "Inflation, GDP deflator", noun: "GDP deflator inflation", fk: "pct", group: "Growth and prices", zero: true },
  { key: "pop", label: "Population", noun: "population", fk: "people", group: "People", log: true, world: false },
  { key: "popGrowth", label: "Population growth", noun: "population growth", fk: "pct", group: "People", zero: true },
  { key: "lifeExp", label: "Life expectancy at birth", noun: "life expectancy", fk: "years", group: "People" },
  { key: "unemployment", label: "Unemployment", noun: "unemployment rate", fk: "pct", group: "People" },
  { key: "remitPct", label: "Remittances received, % of GDP", noun: "remittances as a share of GDP", fk: "pct", group: "Openness" },
  { key: "exportsPct", label: "Exports, % of GDP", noun: "exports as a share of GDP", fk: "pct", group: "Openness" },
  { key: "importsPct", label: "Imports, % of GDP", noun: "imports as a share of GDP", fk: "pct", group: "Openness" },
  { key: "fdiPct", label: "Foreign direct investment, % of GDP", noun: "net FDI inflows as a share of GDP", fk: "pct", group: "Openness" },
  { key: "currentAccount", label: "Current account balance, % of GDP", noun: "current account balance", fk: "pct", group: "Money and balance", zero: true },
  { key: "reservesMonths", label: "Reserves, months of imports", noun: "reserve cover", fk: "months", group: "Money and balance" },
  { key: "investPct", label: "Investment, % of GDP", noun: "investment as a share of GDP", fk: "pct", group: "Money and balance" },
];
const GROUPS = [...new Set(CURATED.map((c) => c.group))];

const FIRST = YEARS[0];
const LAST = YEARS[YEARS.length - 1];
const RANGES: { id: string; from: number; to: number }[] = [
  { id: `${FIRST}–${LAST}`, from: FIRST, to: LAST },
  { id: `2015–${LAST}`, from: 2015, to: LAST },
  { id: "2022–2024", from: 2022, to: 2024 },
];

/** Formatter with the unit spelled out where the axis format leaves it off. */
function spoken(fk: FormatKey) {
  const f = formatter(fk);
  if (fk === "months") return (v: number) => `${num(v, 1)} months`;
  if (fk === "years") return (v: number) => `${num(v, 1)} years`;
  return f;
}

function summarise(c: Curated, from: number, to: number) {
  const say = spoken(c.fk);
  for (let y = to; y >= from; y--) {
    const have = ISOS.filter((i) => val(i, c.key, y) != null);
    if (have.length < 2) continue;
    const sorted = [...have].sort((p, q) => (val(q, c.key, y) ?? 0) - (val(p, c.key, y) ?? 0));
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const missing = ISOS.filter((i) => !have.includes(i));
    const w = c.world === false ? null : val("WLD", c.key, y);
    let text = `In ${y}, ${nameOf(top)} had the highest ${c.noun} (${say(val(top, c.key, y)!)}) and ${nameOf(bottom)} the lowest (${say(val(bottom, c.key, y)!)}).`;
    if (w != null) text += ` The world figure was ${say(w)}.`;
    if (missing.length) text += ` ${listOf(missing.map((i, k) => (k ? nameOf(i) : NameOf(i))))} ${missing.length > 1 ? "do" : "does"} not report it for ${y}.`;
    return { year: y, text };
  }
  return { year: to, text: "Too few of the four report this series in the chosen range to compare them." };
}

/** Section 2: eighteen curated indicators, three ranges, the world as a benchmark. */
export function IndicatorExplorer() {
  const [key, setKey] = useState<IndicatorKey>("gniPcPpp");
  const [range, setRange] = useState(RANGES[0].id);
  const c = CURATED.find((x) => x.key === key) ?? CURATED[0];
  const { from, to } = RANGES.find((r) => r.id === range) ?? RANGES[0];

  const { series, legend, table, summary, missingAll, lastYear } = useMemo(() => {
    const regions: Region[] = c.world === false ? [...ISOS] : [...ISOS, "WLD"];
    const all: LineSeries[] = regions.map((r) => ({
      id: r,
      label: r === "WLD" ? "World" : COUNTRIES[r as keyof typeof COUNTRIES].short,
      color: r === "WLD" ? "var(--color-world)" : COUNTRIES[r as keyof typeof COUNTRIES].color,
      data: points(r, c.key, from, to),
      dashed: r === "WLD",
    }));
    const series = all.filter((s) => s.data.length > 0);
    const legend: LegendItem[] = series.map((s) => ({ label: s.label, color: s.color, dashed: s.dashed }));
    const fmt = formatter(c.fk);
    const years = YEARS.filter((y) => y >= from && y <= to && series.some((s) => s.data.some((d) => d.year === y)));
    const table = {
      columns: ["Year", ...series.map((s) => s.label)],
      rows: years.map((y) => [String(y), ...series.map((s) => {
        const d = s.data.find((p) => p.year === y);
        return d ? fmt(d.value) : "—";
      })]),
    };
    const missingAll = all.filter((s) => s.data.length === 0).map((s) => s.label);
    return { series, legend, table, summary: summarise(c, from, to), missingAll, lastYear: years[years.length - 1] ?? to };
  }, [c, from, to]);

  const spec = useMemo(() => {
    const say = spoken(c.fk);
    return specs.indicatorBars(c.key, summary.year, (x) => (x == null ? "—" : say(x)));
  }, [c, summary.year]);

  const shade = from <= 2022 && to >= 2024 && to - from > 2;
  const subtitle = [
    `${INDICATORS[c.key].name}, ${from}–${lastYear}.`,
    c.log ? "Log scale." : "",
    c.world === false ? "World omitted: a world total is not comparable." : "World shown dashed.",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Slide spec={spec} align="center" dim={0.4} label="Explorer" id="explorer" className="slide-pad flex min-h-svh items-center">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-12">
          <div>
            <p className="eyebrow on-stage">Indicator explorer</p>
            <SplitHeading className="display mt-4 text-5xl text-paper sm:text-6xl">Any series, any span</SplitHeading>
            <Reveal>
              <p className="lede on-stage mt-5">
                {CURATED.length} World Bank series for the four economies, with the world average as a dashed benchmark where one exists.
              </p>
            </Reveal>
            <Reveal className="mt-8 space-y-6" delay={80}>
              <SelectField id="explorer-indicator" label="Indicator" value={key} onChange={(v) => setKey(v as IndicatorKey)}>
                {GROUPS.map((g) => (
                  <optgroup key={g} label={g}>
                    {CURATED.filter((x) => x.group === g).map((x) => (
                      <option key={x.key} value={x.key}>
                        {x.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </SelectField>
              <Segmented label="Range" size="sm" value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r.id, label: r.id }))} />
              <p className="border-l border-rule pl-4 text-sm leading-relaxed text-paper-2" aria-live="polite">
                {summary.text}
              </p>
            </Reveal>
          </div>
          <Reveal delay={140} className="min-w-0">
            <ChartFrame title={c.label} subtitle={subtitle} legend={legend} table={table} className={SOLID_FRAME}>
              <LineChart series={series} format={c.fk} height={340} log={c.log} zero={c.zero} window={shade ? [2022, 2024] : undefined} />
            </ChartFrame>
            {missingAll.length > 0 && (
              <p className="mt-3 text-xs text-muted">
                Not reported for these years: {listOf(missingAll)}.
              </p>
            )}
          </Reveal>
        </div>
      </div>
    </Slide>
  );
}
