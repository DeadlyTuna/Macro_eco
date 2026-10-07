import { specs } from "@/components/scene/specs";
import { Reveal } from "@/components/motion/Reveal";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { LineChart } from "@/components/charts/LineChart";
import { HBars } from "@/components/charts/Bars";
import type { Country } from "@/lib/countries";
import { latest, val, type IndicatorKey } from "@/lib/data";
import { num, pct } from "@/lib/format";
import { B, Head, Note, Plate, Plates, Section } from "./parts";
import { PAPER, lineOf, source, yearTable } from "./helpers";

const SECTORS = [
  { key: "agriPct", label: "Agriculture" },
  { key: "industryPct", label: "Industry" },
  { key: "servicesPct", label: "Services" },
] as const;

/** One plate per balance-sheet ratio: the newest year the World Bank has, labelled, with the World alongside where it exists. */
const RATIOS: { key: IndicatorKey; label: string; note: string; unit?: string }[] = [
  { key: "investPct", label: "Investment", note: "Gross capital formation, % of GDP" },
  { key: "fdiPct", label: "FDI inflows", note: "Net inflows, % of GDP" },
  { key: "currentAccount", label: "Current account", note: "Balance, % of GDP" },
  { key: "reservesMonths", label: "Reserves", note: "Months of imports", unit: "months" },
];

/** Sector shares, openness to trade, and the external ratios. */
export function Structure({ c }: { c: Country }) {
  const iso = c.iso;
  const exp = lineOf(iso, "exportsPct", "Exports", c.color);
  const imp = lineOf(iso, "importsPct", "Imports", PAPER);
  const shares = SECTORS.map((s) => ({ ...s, value: val(iso, s.key, 2024) ?? 0 }));
  const lead = shares.reduce((m, s) => (s.value > m.value ? s : m), shares[0]);
  const sum = shares.reduce((a, s) => a + s.value, 0);
  const trade = val(iso, "tradePct", 2024);
  const net = (val(iso, "exportsPct", 2024) ?? 0) - (val(iso, "importsPct", 2024) ?? 0);
  const [a, i, s] = shares;

  const plates = RATIOS.map((r) => {
    const l = latest(iso, r.key);
    if (!l) return null;
    const w = val("WLD", r.key, l.year);
    const fmt = (x: number) => (r.unit ? num(x, 1) : pct(x, 1));
    return { ...r, year: l.year, value: fmt(l.value), world: w != null ? `World ${fmt(w)}${r.unit ? ` ${r.unit}` : ""}` : null };
  }).filter((p): p is NonNullable<typeof p> => p != null);

  return (
    <Section spec={specs.sectors(iso)} id="structure" label="Structure">
      <Head
        serial="07"
        eyebrow="Structure"
        color={c.color}
        title={`The largest sector is ${lead.label.toLowerCase()}, at ${pct(lead.value, 0)} of GDP`}
        lede={
          <>
            In 2024 services made up <B>{pct(s.value, 1)}</B> of GDP, industry <B>{pct(i.value, 1)}</B> and agriculture <B>{pct(a.value, 1)}</B>.
            {trade != null && (
              <>
                {" "}
                Trade in goods and services equalled <B>{pct(trade, 0)}</B> of GDP, {pct(Math.abs(net), 1) === "0.0%" ? "with exports and imports about equal." : `with exports ${net >= 0 ? "above" : "below"} imports by ${pct(Math.abs(net), 1)} of GDP.`}
              </>
            )}
          </>
        }
      />

      <Reveal delay={150} className="mt-8">
        <ChartFrame
          title="Sector shares of GDP, 2024"
          subtitle="Value added, % of GDP"
          table={{
            columns: ["Sector", "2022", "2023", "2024"],
            rows: SECTORS.map((x) => [x.label, ...[2022, 2023, 2024].map((y) => pct(val(iso, x.key, y), 1))]),
          }}
          source={source("agriPct", "industryPct", "servicesPct")}
        >
          <HBars format="pct" domain={[0, 100]} rows={shares.map((x) => ({ id: x.key, label: x.label, color: c.color, value: x.value }))} />
        </ChartFrame>
        <Note className="mt-3">
          The three shares add up to {pct(sum, 1)}, not 100%. Taxes less subsidies on products sit outside sector value added, and that is the remainder.
        </Note>
      </Reveal>

      <Reveal delay={100} className="mt-4">
        <ChartFrame
          title="Exports and imports of goods and services"
          subtitle={`${c.name}, ${exp.data[0]?.year}–${exp.data[exp.data.length - 1]?.year}, % of GDP. Shaded: the 2022–24 window.`}
          legend={[
            { label: "Exports", color: c.color },
            { label: "Imports", color: PAPER },
          ]}
          table={yearTable(
            [
              { label: "Exports", data: exp.data },
              { label: "Imports", data: imp.data },
            ],
            (x) => pct(x, 1)
          )}
          source={source("exportsPct", "importsPct")}
        >
          <LineChart series={[exp, imp]} format="pct" height={260} window={[2022, 2024]} />
        </ChartFrame>
        {exp.data[0] && exp.data[0].year > 2000 && (
          <Note className="mt-3">
            The World Bank series for {c.short} starts in {exp.data[0].year}.
          </Note>
        )}
      </Reveal>

      <Plates className="mt-4 grid-cols-2">
        {plates.map((p, k) => (
          <Plate key={p.key} label={p.label} tag={String(p.year)} value={p.value} unit={p.unit} size="sm" delay={k * 70} color={c.color} note={[p.note, p.world].filter(Boolean).join(" · ")} />
        ))}
      </Plates>
      <Reveal>
        <Note className="mt-3">
          Each plate shows the newest year the World Bank has published for that series; the year is printed on the plate. Reserves in months of imports say how long official holdings would
          pay for imports with no other inflow.
        </Note>
      </Reveal>
    </Section>
  );
}
