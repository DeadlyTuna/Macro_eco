import type { ReactNode } from "react";
import { specs } from "@/components/scene/specs";
import { Reveal } from "@/components/motion/Reveal";
import type { Country } from "@/lib/countries";
import type { Cell, Research, Sourced } from "@/lib/research";
import { num, pct } from "@/lib/format";
import { Chips, Head, MiniTable, Section, SourceRef } from "./parts";
import { dateKey, dateLabel } from "./helpers";

const cellNum = (x: Cell) => (typeof x === "number" ? num(x) : x);
const rate = (x: Cell) => {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? pct(n, Number.isInteger(n * 10) ? 1 : 2) : String(x);
};

/** A bulleted list of researched facts, each with its source link. */
function Facts({ title, items, color }: { title: string; items: Sourced[]; color: string }) {
  return (
    <Reveal as="div" className="mt-10">
      <h3 className="eyebrow mb-4 text-paper-2">{title}</h3>
      <ul className="space-y-3.5">
        {items.map((it, k) => (
          <li key={k} className="flex gap-3 text-[15px] leading-relaxed text-paper-2">
            <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full" style={{ background: color }} />
            <span>
              {it.text}
              {it.source && (
                <span className="ml-2 whitespace-nowrap text-xs">
                  <SourceRef source={it.source} />
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

function ListBlock({ title, items, foot }: { title: string; items: string[]; foot?: ReactNode }) {
  return (
    <Reveal className="frame p-4 sm:p-5">
      <h4 className="eyebrow relative pb-3">{title}</h4>
      <ul className="relative text-sm">
        {items.map((it) => (
          <li key={it} className="border-t border-rule py-2 text-paper-2">
            {it}
          </li>
        ))}
      </ul>
      {foot && <p className="relative mt-3 text-[11px] leading-snug text-muted">{foot}</p>}
    </Reveal>
  );
}

/** The pull quote, what has happened since, and the researched reference tables. Everything from research is optional. */
export function Beyond({ c, research }: { c: Country; research: Research | null }) {
  const r = research;
  const tourism = r?.tourism;
  const tourismRows = (["2022", "2023", "2024", "2025"] as const).flatMap((y) => (tourism?.[y] != null ? [[y, cellNum(tourism[y] as Cell)]] : []));
  const policy = r?.policy_rate;
  const policyRows = (["2022", "2023", "2024"] as const).flatMap((y) => (policy?.[y] != null ? [[y, rate(policy[y] as Cell)]] : []));
  const ratings = [...(r?.ratings ?? [])].sort((a, b) => dateKey(a.date ?? "") - dateKey(b.date ?? ""));
  const area = r?.basics?.area_km2;
  const basics = [
    ...(area != null ? [{ k: "Area", v: `${typeof area === "number" ? num(area) : area} km²` }] : []),
    { k: "Languages", v: c.languages },
    { k: "Central bank", v: c.centralBank },
  ];
  const hasTables = tourismRows.length > 0 || policyRows.length > 0 || !!policy?.note || !!r?.exports || ratings.length > 0;

  return (
    <Section spec={specs.globe(c.iso)} id="beyond" label="Beyond the numbers">
      <Head serial="09" eyebrow="Beyond the numbers" color={c.color} title="What the statistics leave out" />

      <Reveal delay={150}>
        <blockquote className="mt-8 border-l-2 pl-6" style={{ borderColor: c.color }}>
          <p className="display on-stage text-[clamp(1.35rem,2.4vw,1.9rem)] italic leading-[1.25] text-paper">{c.leftOut}</p>
        </blockquote>
      </Reveal>

      <Reveal delay={200}>
        <Chips items={basics} className="mt-6" />
      </Reveal>

      {r?.since_2024 && <Facts title="Since 2024" items={r.since_2024} color={c.color} />}
      {r?.did_you_know && <Facts title="Did you know" items={r.did_you_know} color={c.color} />}

      {hasTables && (
        <div className="mt-12">
          <h3 className="eyebrow mb-4 text-paper-2">Reference tables</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {tourismRows.length > 0 && (
              <MiniTable
                caption="International tourist arrivals"
                head={["Year", "Arrivals"]}
                rows={tourismRows}
                foot={
                  tourism?.source ? (
                    <>
                      Source: <SourceRef source={tourism.source} />
                    </>
                  ) : undefined
                }
              />
            )}
            {policyRows.length > 0 && <MiniTable caption="Policy rate" head={["Year", "Rate"]} rows={policyRows} foot={policy?.note} />}
            {policyRows.length === 0 && policy?.note && (
              <Reveal className="frame p-4 sm:p-5">
                <h4 className="eyebrow relative pb-3">Policy rate</h4>
                <p className="relative text-sm leading-relaxed text-paper-2">{policy.note}</p>
              </Reveal>
            )}
            {r?.exports?.products && <ListBlock title="Leading exports" items={r.exports.products} foot="Dollar values as given in the research notes." />}
            {r?.exports?.markets && <ListBlock title="Leading export markets" items={r.exports.markets} foot="Dollar values as given in the research notes." />}
            {ratings.length > 0 && (
              <MiniTable
                caption="Sovereign credit ratings"
                head={["Agency", "Date", "Change"]}
                rows={ratings.map((x) => [x.agency, x.date ? dateLabel(x.date) : "—", x.from && x.to ? `${x.from} → ${x.to}` : (x.to ?? x.from ?? "—")])}
                className="sm:col-span-2"
              />
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
