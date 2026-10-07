import type { ReactNode } from "react";
import { specs } from "@/components/scene/specs";
import { Reveal } from "@/components/motion/Reveal";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { LineChart } from "@/components/charts/LineChart";
import { HBars } from "@/components/charts/Bars";
import type { Country } from "@/lib/countries";
import { change, points, rankOf, v, val } from "@/lib/data";
import { num, pct, people } from "@/lib/format";
import { B, Head, Note, Plate, Plates, Section } from "./parts";
import { lineOf, ordinal, source, span, yearTable } from "./helpers";

const MIG_FROM = 2015;

/** Population, migration, life expectancy and urbanisation, with each country's own caveat. */
export function People({ c }: { c: Country }) {
  const iso = c.iso;
  const pop = lineOf(iso, "pop", c.short, c.color);
  const mig = points(iso, "netMigration", MIG_FROM);
  const pop2022 = v(iso, "pop", 2022);
  const pop2024 = v(iso, "pop", 2024);
  const ch2224 = change(pop2022, pop2024);
  const ch2000 = change(v(iso, "pop", 2000), pop2024);
  const jump = change(v(iso, "pop", 2021), pop2022);
  const net = [2022, 2023, 2024].reduce((a, y) => a + (val(iso, "netMigration", y) ?? 0), 0);
  const migText = net < 0 ? `net emigration of ${people(Math.abs(net))}` : `net immigration of ${people(net)}`;
  // A big jump into the window means the 2022–24 figure is not comparable with the years before it.
  const m21 = val(iso, "netMigration", 2021);
  const m22 = val(iso, "netMigration", 2022);
  const step = m21 != null && m22 != null && Math.abs(m22 - m21) >= 5000 ? { from: m21, to: m22 } : null;
  const gniG = change(v(iso, "gniAtlas", 2022), v(iso, "gniAtlas", 2024));
  const pcG = change(v(iso, "gniPc", 2022), v(iso, "gniPc", 2024));

  const title = iso === "SYC" ? "A census reset the count" : `${pct(Math.abs(ch2224), 1)} ${ch2224 >= 0 ? "more" : "fewer"} people in two years`;

  let lede: ReactNode;
  if (iso === "SYC") {
    lede = (
      <>
        The population series jumps <B>{pct(jump, 1)}</B> between 2021 and 2022, from {num(v(iso, "pop", 2021))} to {num(pop2022)}. That is a break after the 2022 census, not growth. From
        2022 to 2024 the count rose {pct(ch2224, 1)}, to {num(pop2024)}.
      </>
    );
  } else {
    lede = (
      <>
        The population {ch2224 >= 0 ? "grew" : "fell"} <B>{pct(Math.abs(ch2224), 1)}</B> between 2022 and 2024, to {people(pop2024)}.{" "}
        {iso === "BIH" && (
          <>
            Since 2000 the country has lost <B>{pct(Math.abs(ch2000), 1)}</B> of its residents, from {people(v(iso, "pop", 2000))}.{" "}
          </>
        )}
        The World Bank&apos;s net-migration estimate for 2022–24 is {migText}.
      </>
    );
  }

  const world = (key: "lifeExp" | "urbanPct") => val("WLD", key, 2024);

  return (
    <Section spec={specs.emigration(iso)} id="people" label="People">
      <Head serial="06" eyebrow="People" color={c.color} title={title} lede={lede} />

      <Reveal delay={150} className="mt-8">
        <ChartFrame
          title="Population"
          subtitle={`${c.name}, ${span(pop.data)}. Shaded: the 2022–24 window.${iso === "SYC" ? " The step in 2022 is a census break." : ""}`}
          table={yearTable([{ label: "Population", data: pop.data }], (x) => num(x))}
          source={source("pop")}
        >
          <LineChart series={[pop]} format="people" height={260} window={[2022, 2024]} />
        </ChartFrame>
      </Reveal>

      <Reveal delay={100} className="mt-3">
        <ChartFrame
          title="Net migration"
          subtitle={`People a year, ${span(mig)}. ${mig.some((d) => d.value < 0) ? "Below zero: more people leave than arrive." : "Above zero: more people arrive than leave."}`}
          table={{ columns: ["Year", "Net migration"], rows: mig.map((d) => [String(d.year), num(d.value)]) }}
          source={source("netMigration")}
        >
          <HBars format="people" rows={mig.map((d) => ({ id: String(d.year), label: String(d.year), color: c.color, value: d.value }))} />
        </ChartFrame>
      </Reveal>

      <Plates className="mt-3 grid-cols-1 sm:grid-cols-3">
        <Plate
          label="Life expectancy"
          tag="2024"
          value={num(v(iso, "lifeExp", 2024), 1)}
          unit="years"
          size="sm"
          color={c.color}
          note={`Ranks ${ordinal(rankOf(iso, "lifeExp", 2024))} of the four · World ${num(world("lifeExp"), 1)}`}
        />
        <Plate
          label="Urban share"
          tag="2024"
          value={pct(v(iso, "urbanPct", 2024), 1)}
          size="sm"
          delay={80}
          color={c.color}
          note={`Of the population · World ${pct(world("urbanPct"), 1)}`}
        />
        {iso === "SYC" ? (
          <Plate label="Census break" tag="2021→22" value={pct(jump, 1, true)} size="sm" delay={160} color={c.color} note="Re-count, not growth" />
        ) : (
          <Plate label="Residents vs 2000" tag="2024" value={pct(ch2000, 1, true)} size="sm" delay={160} color={c.color} note={`${people(v(iso, "pop", 2000))} → ${people(pop2024)}`} />
        )}
      </Plates>

      <Reveal delay={100} className="mt-5 space-y-2">
        {iso === "BIH" && (
          <Note>
            Income per head divides by population. Atlas GNI grew {pct(gniG, 1)} over 2022–24 and GNI per head {pct(pcG, 1)}; the gap is a shrinking denominator, not extra output.
          </Note>
        )}
        {step && (
          <Note>
            The net-migration series steps from {num(step.from)} in 2021 to {num(step.to)} in 2022, the first year of the window. It is a modelled estimate, not a count, so read the step with
            care.
          </Note>
        )}
        {iso === "SYC" && (
          <Note>
            Any per-person ratio built from this population series across 2021 and 2022 mixes two different counts. The World Bank&apos;s own GNI-per-head figures are used as published.
          </Note>
        )}
        {!step && <Note>Net migration is a World Bank estimate, not a head count.</Note>}
      </Reveal>
    </Section>
  );
}
