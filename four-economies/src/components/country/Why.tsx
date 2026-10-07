import type { ReactNode } from "react";
import { specs } from "@/components/scene/specs";
import { Reveal } from "@/components/motion/Reveal";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { LineChart } from "@/components/charts/LineChart";
import type { Country } from "@/lib/countries";
import type { Research } from "@/lib/research";
import { change, v } from "@/lib/data";
import { formatter, num, pct } from "@/lib/format";
import { B, Head, Note, Plate, Plates, Section } from "./parts";
import { lineOf, peak, plateaus, source, span, yearTable } from "./helpers";

/** What the exchange-rate line shows for this regime, with every figure read from the series. */
function fxStory(c: Country, pts: { year: number; value: number }[]): ReactNode {
  const iso = c.iso;
  const first = pts[0];
  const last = pts[pts.length - 1];

  if (iso === "BIH") {
    const euro = (y: number) => 1.95583 / v(iso, "fx", y);
    return (
      <>
        The mark is fixed to the euro at KM 1.95583, so this line is the euro&apos;s mirror image against the dollar: KM per US$ equals 1.95583 ÷ US$ per euro. It implies{" "}
        <B>${euro(2022).toFixed(2)}</B> per euro in 2022 and <B>${euro(2024).toFixed(2)}</B> in 2024. When the euro strengthens, the line falls. The central bank does not steer it.
      </>
    );
  }

  if (iso === "MDV") {
    const flat = plateaus(pts);
    const a = flat[0];
    const b = flat[flat.length - 1];
    return (
      <>
        The line is flat because the rufiyaa is pegged to the dollar. {flat.length > 1 && a && b ? (
          <>
            It sat at about MVR {a.hi.toFixed(2)} from {a.from} to {a.to}, stepped up to about {b.lo.toFixed(2)} by {b.from}, and has stayed between {b.lo.toFixed(2)} and {b.hi.toFixed(2)} since.
          </>
        ) : b ? (
          <>
            Since {b.from} it has stayed between MVR {b.lo.toFixed(2)} and {b.hi.toFixed(2)} per dollar.
          </>
        ) : null}{" "}
        With the rate fixed, an import priced in dollars costs about the same in rufiyaa year after year.
      </>
    );
  }

  if (iso === "SYC") {
    const pk = peak(pts);
    const g23 = change(v(iso, "fx", 2022), v(iso, "fx", 2023));
    return (
      <>
        A free float moves with the market, and this line does. After the November 2008 reform the rate went from {v(iso, "fx", 2006).toFixed(2)} rupees per dollar in 2006 to{" "}
        {v(iso, "fx", 2009).toFixed(2)} in 2009, and it peaked at {pk?.value.toFixed(2)} in {pk?.year}. In 2023 it fell to <B>{v(iso, "fx", 2023).toFixed(2)}</B> from{" "}
        {v(iso, "fx", 2022).toFixed(2)} ({pct(g23, 1)}): fewer rupees per dollar. That stronger rupee is what the deck credits for the year&apos;s falling prices.
      </>
    );
  }

  // Viet Nam: a managed crawl
  const steps = pts.slice(1).map((d, i) => ({ year: d.year, g: change(pts[i].value, d.value) }));
  const weaker = steps.filter((s) => s.g > 0);
  const small = weaker.filter((s) => s.g < 3).length;
  // The two largest annual steps, in date order: 2010 and 2011 are close, so naming only one would mislead.
  const big = [...steps].sort((a, b) => b.g - a.g).slice(0, 2).sort((a, b) => a.year - b.year);
  const cagr = (Math.pow(last.value / first.value, 1 / (last.year - first.year)) - 1) * 100;
  return (
    <>
      The line climbs steadily, which is what a crawl looks like. The đồng weakened against the dollar in {weaker.length} of {steps.length} years, in {small} of them by less than 3%, from{" "}
      {num(first.value)} in {first.year} to <B>{num(last.value)}</B> in {last.year}, or {pct(cagr, 1)} a year compounded. The largest annual steps came in {big.map((s) => `${s.year} (${pct(s.g, 1, true)})`).join(" and ")}.
    </>
  );
}

/** Story title and points from the deck, the featured figure, and the exchange-rate chart that explains the regime. */
export function Why({ c, research }: { c: Country; research: Research | null }) {
  const s = c.story;
  const fx = lineOf(c.iso, "fx", c.currency.code, c.color);
  const fmt = formatter("lcu");
  const words = (t: string) => t.toLowerCase().match(/[a-z0-9.]+/g) ?? [];
  // Skip the researched line when the deck’s own regime text already says all of it.
  const known = new Set(words(c.regime));
  const r24 = research?.basics?.regime_2024;
  const regime2024 = r24 && !words(r24).every((w) => known.has(w)) ? r24 : undefined;

  return (
    <Section spec={specs.coins(c.iso)} id="why" label="Why">
      <Head serial="04" eyebrow="The policy story" color={c.color} title={s.title} />

      <ul className="mt-8 space-y-4">
        {s.points.map((p, i) => (
          <Reveal as="li" key={p.lead} delay={i * 70} className="flex gap-4">
            <span aria-hidden className="denom num mt-0.5 w-7 shrink-0 text-xl text-paper/35">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-[15px] leading-relaxed text-paper-2">
              <span className="font-semibold text-paper">{p.lead}</span> {p.body}
            </p>
          </Reveal>
        ))}
      </ul>

      <Plates className="mt-8 grid-cols-1">
        <Plate label={s.figure.label} value={s.figure.value} size={s.figure.value.length > 10 ? "sm" : "md"} color={c.color} note={s.figure.note} />
      </Plates>
      <Reveal>
        <Note className="mt-3">{s.sources}</Note>
      </Reveal>

      <Reveal delay={100} className="mt-10">
        <ChartFrame
          title={`Exchange rate: ${c.currency.code} per US$`}
          subtitle={`${c.currency.name}, annual average, ${span(fx.data)}. A rising line is a weaker ${c.currency.code}. Shaded: the 2022–24 window.`}
          table={yearTable([{ label: `${c.currency.code} per US$`, data: fx.data }], fmt)}
          source={source("fx")}
        >
          <LineChart series={[fx]} format="lcu" height={260} window={[2022, 2024]} />
        </ChartFrame>
      </Reveal>

      <Reveal delay={100} className="mt-4 max-w-xl space-y-3">
        <p className="eyebrow text-paper-2">
          Regime <span className="mx-1 text-muted">·</span> <span className="normal-case tracking-normal">{c.regime}</span>
        </p>
        <p className="text-[15px] leading-relaxed text-paper-2">{fxStory(c, fx.data)}</p>
        {regime2024 && (
          <p className="text-xs leading-relaxed text-muted">
            <span className="text-paper-2">In 2024:</span> {regime2024}.
          </p>
        )}
      </Reveal>
    </Section>
  );
}
