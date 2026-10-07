import { specs } from "@/components/scene/specs";
import { Reveal } from "@/components/motion/Reveal";
import type { Country } from "@/lib/countries";
import { change, latest, rankOf, v, val, type IndicatorKey } from "@/lib/data";
import { pct, people, usd } from "@/lib/format";
import { Head, Note, Plate, Plates, Section } from "./parts";
import { ordinal } from "./helpers";

const Y = 2024;

/** Grid of banknote "denomination plates": the country's headline figures for 2024. */
export function Denominations({ c }: { c: Country }) {
  const iso = c.iso;
  const rank = (key: IndicatorKey) => `Ranks ${ordinal(rankOf(iso, key, Y))} of the four`;
  const gdpGrowth = val(iso, "gdpGrowth", Y);
  const newest = latest(iso, "gniPc");
  const pop = v(iso, "pop", Y);

  // The rosette is drawn from the same numbers: petals = GNI per head ÷ $1,000, rounded.
  const rosette = specs.rosette(iso);
  const petals = rosette.kind === "rosette" ? rosette.petals : Math.max(3, Math.round(v(iso, "gniPc", Y) / 1000));

  const cpiYears = [2022, 2023, 2024];
  const worldCpi = (y: number) => `World ${pct(val("WLD", "cpi", y), 1)}`;
  const cpiNote = (y: number, r: number) => {
    const bits = [worldCpi(y)];
    if (r < 0) bits.unshift("Prices fell");
    if (iso === "BIH" && y === 2024) bits.push("patched cell, see below");
    return bits.join(" · ");
  };

  return (
    <Section spec={rosette} id="figures" label="The figures">
      <Head
        serial="01"
        eyebrow="Denominations"
        title="The figures, 2024"
        color={c.color}
        lede={`${c.name} on one sheet: income per head, national income, people, growth and three years of consumer-price inflation.`}
      />

      <Plates className="mt-10 grid-cols-1 sm:grid-cols-2">
        <Plate
          label="GNI per head · Atlas"
          tag={String(Y)}
          value={usd(v(iso, "gniPc", Y))}
          size="lg"
          color={c.color}
          className="sm:col-span-2"
          note={`${rank("gniPc")} · current US$, Atlas method`}
        />
        <Plate
          label="GNI per head · PPP"
          tag={String(Y)}
          value={usd(v(iso, "gniPcPpp", Y), { intl: true })}
          delay={80}
          note={`${(v(iso, "gniPcPpp", Y) / v(iso, "gniPc", Y)).toFixed(1)}× the Atlas figure · ${rank("gniPcPpp").toLowerCase()}`}
        />
        <Plate label="GNI · Atlas" tag={String(Y)} value={usd(v(iso, "gniAtlas", Y))} delay={140} note={`${rank("gniAtlas")} · total national income`} />
        <Plate
          label="Population"
          tag={String(Y)}
          value={people(pop)}
          delay={80}
          note={
            iso === "SYC"
              ? `The series breaks in 2022 after the census · ${pct(change(v(iso, "pop", 2022), pop), 1, true)} since 2022`
              : `${pct(change(v(iso, "pop", 2022), pop), 1, true)} since 2022`
          }
        />
        <Plate
          label="GDP growth"
          tag={String(Y)}
          value={pct(gdpGrowth, 1)}
          delay={140}
          note={`Real, annual · World ${pct(val("WLD", "gdpGrowth", Y), 1)}`}
        />
        {newest && newest.year > Y && (
          <Plate
            label="GNI per head · Atlas"
            tag={`${newest.year} · newest`}
            value={usd(newest.value)}
            delay={80}
            className="sm:col-span-2"
            note={`The newest year the World Bank has published, outside the 2022–24 window · ${pct(change(v(iso, "gniPc", Y), newest.value), 1, true)} on ${Y}`}
          />
        )}
      </Plates>

      <h3 className="eyebrow mb-3 mt-10">Consumer-price inflation, annual</h3>
      <Plates className="grid-cols-1 sm:grid-cols-3">
        {cpiYears.map((y, k) => (
          <Plate key={y} label="Inflation" tag={String(y)} value={pct(v(iso, "cpi", y), 2)} size="sm" delay={k * 80} color={c.color} note={cpiNote(y, v(iso, "cpi", y))} />
        ))}
      </Plates>

      <Reveal delay={100}>
        <Note className="mt-8">
          The particle rosette on the right draws these figures. It has <span className="num text-paper-2">{petals}</span> petals: GNI per head divided by $1,000, rounded. Its three rings are
          income per head in 2022, 2023 and 2024, and each ring&apos;s wobble grows with that year&apos;s inflation.
        </Note>
      </Reveal>
    </Section>
  );
}
