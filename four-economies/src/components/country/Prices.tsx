import { specs } from "@/components/scene/specs";
import { Reveal } from "@/components/motion/Reveal";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { LineChart } from "@/components/charts/LineChart";
import type { Country } from "@/lib/countries";
import { latest, priceChange, v } from "@/lib/data";
import { pct } from "@/lib/format";
import { B, Head, Note, Section, Stats } from "./parts";
import { WORLD, lineOf, peak, source, span, yearTable } from "./helpers";

const WINDOW = [2022, 2023, 2024];

/** "rose 14.02% in 2022, 6.11% in 2023 and 1.69% in 2024" — the verb repeats only when the direction changes. */
function moves(rates: number[], years: number[]) {
  const parts = rates.map((r, i) => {
    const verb = r < 0 ? "fell" : "rose";
    const same = i > 0 && rates[i - 1] < 0 === r < 0;
    return `${same ? "" : `${verb} `}${pct(Math.abs(r), 2)} in ${years[i]}`;
  });
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
}

/** Consumer-price inflation, the window's three rates and the compounded price level. */
export function Prices({ c }: { c: Country }) {
  const iso = c.iso;
  const cpi = lineOf(iso, "cpi", c.short, c.color);
  const world = lineOf("WLD", "cpi", "World", WORLD, { dashed: true });
  const rates = WINDOW.map((y) => v(iso, "cpi", y));
  const cum = priceChange(iso, 2022, 2024);
  const cumWorld = priceChange("WLD", 2022, 2024);
  const high = peak(cpi.data);
  const newest = latest(iso, "cpi");

  return (
    <Section spec={specs.inflation([iso], [2020, 2021, 2022, 2023, 2024])} id="prices" label="Prices">
      <Head
        serial="03"
        eyebrow="Consumer prices"
        color={c.color}
        title={`Prices ${cum >= 0 ? "up" : "down"} ${pct(Math.abs(cum), 1)} over three years`}
        lede={
          <>
            Consumer prices {moves(rates, WINDOW)}. Compounded, the price level ended 2024 <B>{pct(Math.abs(cum), 1)}</B> {cum >= 0 ? "above" : "below"} its level at the end of 2021. For the world as a whole the figure is{" "}
            <B>{pct(cumWorld, 1, true)}</B>.
          </>
        }
      />

      <Reveal delay={150} className="mt-8">
        <ChartFrame
          title="Inflation, consumer prices"
          subtitle={`${c.name}, ${span(cpi.data)}. Annual %, local prices. Shaded: the 2022–24 window.`}
          legend={[
            { label: c.short, color: c.color },
            { label: "World", color: WORLD, dashed: true },
          ]}
          table={yearTable(
            [
              { label: c.short, data: cpi.data },
              { label: "World", data: world.data },
            ],
            (x) => pct(x, 2)
          )}
          source={source("cpi")}
        >
          <LineChart series={[cpi, world]} format="pct" height={300} window={[2022, 2024]} zero />
        </ChartFrame>
      </Reveal>

      <Stats
        className="mt-3"
        items={[
          { k: "Price level, 2022–24", v: pct(cum, 1, true), note: "Annual rates compounded" },
          { k: "World, same years", v: pct(cumWorld, 1, true), note: "World Bank aggregate" },
          ...(high ? [{ k: "Highest year on chart", v: pct(high.value, 1), note: `${high.year} · series starts ${cpi.data[0].year}` }] : []),
        ]}
      />

      <Reveal delay={100} className="mt-5 space-y-2">
        {iso === "BIH" && (
          <Note>
            The 2024 rate, {pct(v(iso, "cpi", 2024), 2)}, is patched. The World Bank API cell was empty when the data were retrieved, so it comes from Trading Economics&apos; republication of the
            same series. The file has no 2025 value for Bosnia.
          </Note>
        )}
        {newest && newest.year > 2024 && (
          <Note>
            The World Bank has since published {newest.year}: {pct(newest.value, 2)}. It sits outside the 2022–24 window and is shown on the chart only.
          </Note>
        )}
        <Note>Inflation is measured in local prices, while Atlas income is in US dollars, so the two are best read side by side rather than netted off against each other.</Note>
      </Reveal>
    </Section>
  );
}
