import { specs } from "@/components/scene/specs";
import { Reveal } from "@/components/motion/Reveal";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { LineChart } from "@/components/charts/LineChart";
import { HBars } from "@/components/charts/Bars";
import type { Country } from "@/lib/countries";
import { keptShare, latest, v, val } from "@/lib/data";
import { pct, usd } from "@/lib/format";
import { B, Head, Note, Section, Stats } from "./parts";
import { PAPER, lineOf, poss, source, yearTable } from "./helpers";

const YEARS = [2022, 2023, 2024];

/** GDP against GNI: what is produced inside the borders against what residents keep. */
export function Produced({ c }: { c: Country }) {
  const iso = c.iso;
  const gdp = lineOf(iso, "gdp", "GDP", PAPER);
  const gni = lineOf(iso, "gni", "GNI", c.color);
  const kept = keptShare(iso, 2024);
  const net = v(iso, "netPrimary", 2024);
  const remit = val(iso, "remitPct", 2024);
  const remitUsd = val(iso, "remitUsd", 2024);
  const remitLast = latest(iso, "remitPct");

  return (
    <Section spec={specs.leak(iso)} id="produced" label="Produced vs earned">
      <Head
        serial="05"
        eyebrow="Produced against earned"
        color={c.color}
        title={`${pct(kept, 1)} of output is kept`}
        lede={
          <>
            GDP counts what is produced inside the borders; GNI counts what residents earn. In 2024 {poss(c.short)} GNI was <B>{usd(v(iso, "gni", 2024), { digits: 2 })}</B> against a GDP of{" "}
            <B>{usd(v(iso, "gdp", 2024), { digits: 2 })}</B>, a net primary income of <B>{usd(net)}</B>.
          </>
        }
      />

      <Reveal delay={150}>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-paper-2">
          Primary income is what crosses a border as pay for work or capital: wages, interest, dividends and profits. It is the whole gap between GDP and GNI. Remittances from emigrants are
          mostly secondary income, a transfer, so they lift household spending but never enter GNI.
        </p>
      </Reveal>

      <Reveal delay={150} className="mt-8">
        <ChartFrame
          title="GDP against GNI"
          subtitle={`${c.name}, ${gdp.data[0].year}–${gdp.data[gdp.data.length - 1].year}, current US$. The two lines sit close together; the gap is net primary income.`}
          legend={[
            { label: "GDP", color: PAPER },
            { label: "GNI", color: c.color },
          ]}
          table={yearTable(
            [
              { label: "GDP", data: gdp.data },
              { label: "GNI", data: gni.data },
            ],
            (x) => usd(x, { digits: 2 })
          )}
          source={source("gdp", "gni")}
        >
          <LineChart series={[gdp, gni]} format="usd" height={280} window={[2022, 2024]} />
        </ChartFrame>
      </Reveal>

      <Reveal delay={100} className="mt-3">
        <ChartFrame
          title="Share of GDP kept as national income"
          subtitle="GNI ÷ GDP, both in current US$. A full bar is 100%."
          table={{
            columns: ["Year", "GDP", "GNI", "Net primary income", "Kept"],
            rows: YEARS.map((y) => [String(y), usd(v(iso, "gdp", y)), usd(v(iso, "gni", y)), usd(v(iso, "netPrimary", y)), pct(keptShare(iso, y), 1)]),
          }}
          source={source("gni", "gdp")}
        >
          <HBars format="pct" domain={[0, 100]} rows={YEARS.map((y) => ({ id: String(y), label: String(y), color: c.color, value: keptShare(iso, y) }))} />
        </ChartFrame>
      </Reveal>

      <Stats
        className="mt-3"
        items={[
          {
            k: "Net primary income, 2024",
            v: usd(net),
            note: net < 0 ? "Residents pay more to the rest of the world than they receive" : "Residents receive more from the rest of the world than they pay",
          },
          remit != null
            ? { k: "Remittances, 2024", v: pct(remit, 1), note: `of GDP${remitUsd != null ? ` · ${usd(remitUsd)}` : ""} · secondary income, outside GNI` }
            : {
                k: "Remittances, 2024",
                v: "—",
                note: remitLast ? `WDI reports no value after ${remitLast.year} (${pct(remitLast.value, 1)} of GDP)` : "WDI does not report this series",
              },
        ]}
      />

      <Reveal delay={100}>
        <Note className="mt-5">
          The World Bank&apos;s personal-remittances series also counts compensation of employees, which is primary income and does enter GNI; the transfers part does not.
        </Note>
      </Reveal>
    </Section>
  );
}
