import { specs } from "@/components/scene/specs";
import { Reveal } from "@/components/motion/Reveal";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { LineChart } from "@/components/charts/LineChart";
import type { Country } from "@/lib/countries";
import { change, rankOf, v } from "@/lib/data";
import { pct, usd } from "@/lib/format";
import { B, Head, Note, Section, Stats } from "./parts";
import { PAPER, WORLD, lineOf, ordinal, source, yearTable } from "./helpers";

/** GNI per head, Atlas against PPP, with the World as a benchmark. */
export function Income({ c }: { c: Country }) {
  const iso = c.iso;
  const atlas = lineOf(iso, "gniPc", "Atlas", c.color);
  const ppp = lineOf(iso, "gniPcPpp", "PPP", PAPER);
  const world = lineOf("WLD", "gniPc", "World", WORLD, { dashed: true });

  const now = v(iso, "gniPc", 2024);
  const g2224 = change(v(iso, "gniPc", 2022), now);
  const fold = now / v(iso, "gniPc", 2000);
  const rank = rankOf(iso, "gniPc", 2024);
  const rankPpp = rankOf(iso, "gniPcPpp", 2024);
  const vsWorld = change(v("WLD", "gniPc", 2024), now);
  const ratio = v(iso, "gniPcPpp", 2024) / now;
  const gniGrowth = change(v(iso, "gniAtlas", 2022), v(iso, "gniAtlas", 2024));

  return (
    <Section spec={specs.gniPc(iso)} id="income" label="Income per head">
      <Head
        serial="02"
        eyebrow="Income per head"
        color={c.color}
        title={`${pct(Math.abs(g2224), 1)} ${g2224 >= 0 ? "more" : "less"} per head in two years`}
        lede={
          <>
            GNI per head {g2224 >= 0 ? "rose" : "fell"} <B>{pct(Math.abs(g2224), 1)}</B> from 2022 to 2024, to <B>{usd(now)}</B> on the Atlas method. That ranks {ordinal(rank)} of the four,
            and {ordinal(rankPpp)} once prices at home are counted (PPP).
          </>
        }
      />

      <Reveal delay={150} className="mt-8">
        <ChartFrame
          title="GNI per head: Atlas against PPP"
          subtitle={`${c.name}, ${atlas.data[0].year}–${atlas.data[atlas.data.length - 1].year}. Atlas in current US$, PPP in current international $. Shaded: the 2022–24 window.`}
          legend={[
            { label: "Atlas (current US$)", color: c.color },
            { label: "PPP (current international $)", color: PAPER },
            { label: "World, Atlas", color: WORLD, dashed: true },
          ]}
          table={yearTable(
            [
              { label: `${c.short} · Atlas`, data: atlas.data },
              { label: `${c.short} · PPP`, data: ppp.data, fmt: (x) => usd(x, { intl: true }) },
              { label: "World · Atlas", data: world.data },
            ],
            (x) => usd(x)
          )}
          source={source("gniPc", "gniPcPpp")}
        >
          <LineChart series={[atlas, ppp, world]} format="usd" height={300} window={[2022, 2024]} />
        </ChartFrame>
      </Reveal>

      <Stats
        className="mt-3"
        items={[
          { k: "2022 → 2024", v: pct(g2224, 1, true), note: `${usd(v(iso, "gniPc", 2022))} → ${usd(now)}` },
          { k: "2000 → 2024", v: `${fold.toFixed(1)}×`, note: `${usd(v(iso, "gniPc", 2000))} → ${usd(now)}` },
          { k: "Rank of four, 2024", v: `${rank} of 4`, note: `Atlas · PPP rank ${rankPpp} of 4` },
        ]}
      />

      <Reveal delay={100}>
        <Note className="mt-5">
          At the World Bank&apos;s Atlas rate the world averages {usd(v("WLD", "gniPc", 2024))} per head; {c.short} sits {pct(Math.abs(vsWorld), 0)} {vsWorld >= 0 ? "above" : "below"} it. At PPP the
          same income is {usd(v(iso, "gniPcPpp", 2024), { intl: true })}, {ratio.toFixed(1)}× the Atlas figure, so{" "}
          {ratio >= 1 ? "a dollar of income buys more at home than in the United States" : "a dollar of income buys less at home than in the United States"}. Atlas GNI itself grew{" "}
          {pct(gniGrowth, 1)} over 2022–24; the gap to the per-head figure is population change.
        </Note>
      </Reveal>
    </Section>
  );
}
