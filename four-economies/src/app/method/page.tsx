import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Slide } from "@/components/motion/Slide";
import { SplitHeading, Reveal, Odometer } from "@/components/motion/Reveal";
import { TLink } from "@/components/motion/Transition";
import { SlideRail } from "@/components/ui/SlideRail";
import { specs } from "@/components/scene/specs";
import { RankBand } from "@/components/method/RankBand";
import { IndicatorTable, INDICATOR_KEYS, coverage } from "@/components/method/IndicatorTable";
import { COUNTRIES, ORDER } from "@/lib/countries";
import { INDICATORS, ISOS, META, YEARS, change, keptShare, logPoints, v, val, verdict, type Iso } from "@/lib/data";
import { num, pct, people, unitLabel, usd } from "@/lib/format";

const BASE = "https://four-economies.vercel.app";
const FIRST = YEARS[0];
const LAST = YEARS[YEARS.length - 1];
const N = INDICATOR_KEYS.length;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2026-10-06" → "6 October 2026", without touching Date (deterministic under cacheComponents). */
const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const RETRIEVED = longDate(META.retrieved);

export const metadata: Metadata = {
  title: "Method, glossary and sources",
  description: `Definitions, a glossary, all ${N} World Bank indicators, data caveats and sources behind Four Economies' comparison of GNI, income per head and inflation.`,
  alternates: { canonical: "/method" },
};

/* ── Figures quoted in the copy, all computed from the World Bank file ─────────── */
const Y = 2024;
const fig = {
  vnmGdp: usd(v("VNM", "gdp", Y)),
  mdvGdp: usd(v("MDV", "gdp", Y)),
  mdvNet: usd(v("MDV", "netPrimary", Y)),
  mdvGni: usd(v("MDV", "gni", Y)),
  mdvKept: pct(keptShare("MDV", Y), 1),
  bihGniPc: usd(v("BIH", "gniPc", Y)),
  bihAtlas: usd(v("BIH", "gniAtlas", Y)),
  bihGni: usd(v("BIH", "gni", Y)),
  vnmPpp: usd(v("VNM", "gniPcPpp", Y), { intl: true }),
  vnmPc: usd(v("VNM", "gniPc", Y)),
  vnmRatio: num(v("VNM", "gniPcPpp", Y) / v("VNM", "gniPc", Y), 1),
  sycDeflation: pct(val("SYC", "cpi", 2023), 2),
  bihRemit: pct(val("BIH", "remitPct", Y), 1),
  bihPcChange: pct(change(v("BIH", "gniPc", 2022), v("BIH", "gniPc", Y)), 1, true),
  bihPcLog: num(logPoints(v("BIH", "gniPc", 2022), v("BIH", "gniPc", Y)), 1),
  vnmPc2025: usd(v("VNM", "gniPc", 2025)),
  sycPop21: people(v("SYC", "pop", 2021)),
  sycPop22: people(v("SYC", "pop", 2022)),
  sycPopJump: pct(change(v("SYC", "pop", 2021), v("SYC", "pop", 2022)), 1, true),
};
const deck = verdict("BIH", "deck");
const matched = verdict("BIH", "matched");
const latestAny = INDICATOR_KEYS.filter((k) => ISOS.some((i) => val(i, k, LAST) != null)).length;
const latestAll = INDICATOR_KEYS.filter((k) => ISOS.every((i) => val(i, k, LAST) != null)).length;
const fullCoverage = INDICATOR_KEYS.filter((k) => {
  const c = coverage(k);
  return c.byIso.every((x) => x.year === c.newest);
}).length;
const SOURCE_CODES = ["NY.GNP.ATLS.CD", "NY.GNP.PCAP.CD", "NY.GNP.PCAP.PP.CD", "NY.GNP.MKTP.CD", "NY.GDP.MKTP.CD", "FP.CPI.TOTL.ZG", "SP.POP.TOTL"];
const sourceIndicators = SOURCE_CODES.map((code) => INDICATOR_KEYS.map((k) => INDICATORS[k]).find((i) => i.code === code)).filter((i) => i != null);

/* ── Structured data: the dataset behind the site ───────────────────────────── */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Four Economies: GNI, income per head and inflation in Bosnia and Herzegovina, Seychelles, Viet Nam and the Maldives",
  description: `${N} World Development Indicators for Bosnia and Herzegovina, Seychelles, Viet Nam, the Maldives and the World aggregate, ${FIRST}–${LAST}, retrieved from the World Bank API on ${RETRIEVED}. Used to compare gross national income, GNI per capita (Atlas method and PPP) and consumer price inflation over 2022–2024.`,
  url: `${BASE}/method`,
  keywords: ["GNI", "GNI per capita", "Atlas method", "purchasing power parity", "inflation", "consumer prices", ...ORDER.map((i) => COUNTRIES[i].name)],
  creator: { "@type": "Person", name: "Harsh", affiliation: { "@type": "CollegeOrUniversity", name: "VIT Vellore" } },
  isAccessibleForFree: true,
  dateModified: META.retrieved,
  temporalCoverage: `${FIRST}/${LAST}`,
  spatialCoverage: [...ORDER.map((i) => ({ "@type": "Country", name: COUNTRIES[i].name })), { "@type": "Place", name: "World" }],
  variableMeasured: INDICATOR_KEYS.map((k) => ({
    "@type": "PropertyValue",
    name: INDICATORS[k].name,
    propertyID: INDICATORS[k].code,
    unitText: unitLabel[INDICATORS[k].unit],
  })),
  isBasedOn: {
    "@type": "Dataset",
    name: "World Development Indicators",
    url: "https://datatopics.worldbank.org/world-development-indicators/",
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Organization", name: "World Bank", url: "https://www.worldbank.org" },
  },
};

/* ── Small pieces ─────────────────────────────────────────────────────────── */
const col = "w-full max-w-xl lg:max-w-[580px]";

function Eyebrow({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="eyebrow flex items-center gap-3">
      <span className="num text-paper">{n}</span>
      <span className="h-px w-8 bg-rule" aria-hidden />
      {children}
    </p>
  );
}

function Swatch({ iso }: { iso: Iso }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-paper">
      <span className="size-2 rounded-full" style={{ background: COUNTRIES[iso].color }} aria-hidden />
      {COUNTRIES[iso].short}
    </span>
  );
}

function Measure({ term, code, formula, children, example, delay = 0 }: { term: string; code?: string; formula?: string; children: ReactNode; example: ReactNode; delay?: number }) {
  return (
    <Reveal as="article" delay={delay} className="frame p-5">
      <div className="relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="display text-3xl text-paper">{term}</h3>
        {code && <span className="font-mono text-[11px] text-muted">{code}</span>}
      </div>
      <p className="relative mt-3 text-[15px] leading-relaxed text-paper-2">{children}</p>
      {formula && <p className="relative mt-3 border-l border-paper/30 pl-3 font-mono text-xs leading-relaxed text-paper">{formula}</p>}
      <p className="relative mt-4 border-t border-rule pt-3 text-sm leading-relaxed text-paper-2">
        <span className="eyebrow mr-2">In the data</span>
        {example}
      </p>
    </Reveal>
  );
}

function Term({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="border-t border-rule py-4 first:border-t-0 first:pt-0">
      <dt className="text-base font-semibold text-paper">{term}</dt>
      <dd className="mt-1.5 text-[15px] leading-relaxed text-paper-2">{children}</dd>
    </div>
  );
}

function Note({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <Reveal as="li" className="frame p-5">
      <div className="relative flex gap-5">
        <span className="denom text-3xl text-paper/50" aria-hidden>
          {String(n).padStart(2, "0")}
        </span>
        <div>
          <h3 className="text-base font-semibold text-paper">{title}</h3>
          <div className="mt-1.5 space-y-2 text-[15px] leading-relaxed text-paper-2">{children}</div>
        </div>
      </div>
    </Reveal>
  );
}

const CONTENTS = [
  { id: "draw", label: "The draw" },
  { id: "measures", label: "Three measures" },
  { id: "glossary", label: "Glossary" },
  { id: "indicators", label: "Indicators" },
  { id: "notes", label: "Data notes" },
  { id: "sources", label: "Sources" },
];

const EVENT_SOURCES: { who: string; what: string; iso?: Iso }[] = [
  { who: "European Commission and European Council", what: "Accession decisions on Bosnia & Herzegovina: candidate status (2022) and the opening of talks (March 2024).", iso: "BIH" },
  { who: "Central Bank of Bosnia and Herzegovina", what: "The currency board and the fixed rate to the euro.", iso: "BIH" },
  { who: "Central Bank of Seychelles; Seychelles Nation (2023)", what: "The rupee and visitor arrivals.", iso: "SYC" },
  { who: "State Bank of Viet Nam; General Statistics Office (January 2025)", what: "Rates, the exchange-rate regime and 2024 growth.", iso: "VNM" },
  { who: "Maldives Ministry of Finance", what: "The 2023 changes to GST and tourism GST.", iso: "MDV" },
  { who: "Maldives Monetary Authority", what: "Official reserves.", iso: "MDV" },
  { who: "East Asia Forum (May 2024)", what: "India–Maldives tourism after the January 2024 row.", iso: "MDV" },
  { who: "World Bank income classifications (July 2026 update)", what: "Income groups and Viet Nam’s move to upper-middle income." },
];

export default function MethodPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SlideRail />

      {/* 1 · Hero */}
      <Slide spec={specs.text("GNI")} label="Method" id="top" className="slide-pad flex min-h-svh items-center">
        <div className={`${col} on-stage`}>
          <p className="eyebrow">Four Economies · how it works</p>
          <SplitHeading as="h1" immediate className="display mt-5 text-6xl text-paper sm:text-7xl xl:text-8xl">
            Method, glossary and sources
          </SplitHeading>
          <Reveal delay={200}>
            <p className="lede mt-8">
              The site compares four small, open economies on the three things the brief asks about: how large national income is (GNI), how much of it there is per person, and how fast
              consumer prices rose from 2022 to 2024. Every data series is read from the World Bank&apos;s World Development Indicators through its public API (api.worldbank.org/v2), retrieved on{" "}
              {RETRIEVED}. No series value is typed in by hand except one patched cell, explained under data notes.
            </p>
          </Reveal>
          <Reveal delay={320}>
            <dl className="mt-10 grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4">
              {[
                { k: "Countries", val: String(ISOS.length) },
                { k: "Indicators", val: String(N) },
                { k: "Years", val: `${FIRST}–${String(LAST).slice(2)}` },
                { k: "Window", val: "2022–24" },
              ].map((f) => (
                <div key={f.k} className="bg-ink px-4 py-4">
                  <dt className="eyebrow">{f.k}</dt>
                  <dd className="denom mt-2 text-3xl text-paper">
                    <Odometer value={f.val} />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={420}>
            <nav aria-label="On this page" className="mt-10">
              <p className="eyebrow mb-3">On this page</p>
              <ol className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {CONTENTS.map((c, i) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} className="link-underline text-paper-2 hover:text-paper">
                      <span className="num mr-1.5 text-muted">{String(i + 1).padStart(2, "0")}</span>
                      {c.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>
        </div>
      </Slide>

      {/* 2 · The draw */}
      <Slide spec={specs.globe("BIH")} label="The draw" id="draw" className="slide-pad flex min-h-svh items-center">
        <div className={col}>
          <Eyebrow n="01">The draw</Eyebrow>
          <SplitHeading className="display mt-5 text-5xl text-paper sm:text-6xl">One anchor, three mirrors</SplitHeading>
          <Reveal>
            <p className="lede mt-6">
              The brief turns the last two digits of a registration number into a rank on the World Bank&apos;s GNI-per-capita ranking. Registration 25BEC0374 ends in 74, and rank 74 is{" "}
              {COUNTRIES.BIH.name}: the anchor. The brief then asks for a second country within 20 ranks either side.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p className="lede mt-4">
              Three sat in that band — {COUNTRIES.SYC.name}, the {COUNTRIES.MDV.name} and {COUNTRIES.VNM.name} — and all three were kept. One anchor against three mirrors separates what is
              specific to Bosnia from what is common to small, open, import-dependent economies.
            </p>
          </Reveal>
          <Reveal delay={200} className="mt-10">
            <RankBand />
          </Reveal>
        </div>
      </Slide>

      {/* 3 · Three measures */}
      <Slide spec={specs.text("PPP")} label="Three measures" id="measures" className="slide-pad flex min-h-svh items-center">
        <div className={col}>
          <Eyebrow n="02">Three measures</Eyebrow>
          <SplitHeading className="display mt-5 text-5xl text-paper sm:text-6xl">Three measures, two exchange rates</SplitHeading>
          <Reveal>
            <p className="lede mt-6">
              GDP, GNI and GNI per head answer different questions. Turning any of them into US dollars needs an exchange rate, and the World Bank offers two: the Atlas method and purchasing
              power parity.
            </p>
          </Reveal>
          <div className="mt-10 space-y-4">
            <Measure term="GDP" code="NY.GDP.MKTP.CD" example={<>Viet Nam produced {fig.vnmGdp} of output in {Y}.</>}>
              Gross domestic product: the value of everything produced inside a country&apos;s borders in a year, whoever owns it.
            </Measure>
            <Measure
              term="GNI"
              code="NY.GNP.MKTP.CD"
              formula="GNI = GDP + net primary income from abroad"
              example={
                <>
                  Maldives, {Y}: GDP is {fig.mdvGdp} and net primary income is {fig.mdvNet}, so GNI is {fig.mdvGni}. Residents keep {fig.mdvKept} of what is produced on the islands.
                </>
              }
            >
              Gross national income: what residents earn, wherever it is produced. It adds the wages, interest, dividends and profits residents receive from abroad and subtracts what flows out
              to foreign owners and workers.
            </Measure>
            <Measure
              term="GNI per head"
              code="NY.GNP.PCAP.CD"
              formula="GNI per head = GNI ÷ mid-year population"
              example={<>Bosnia &amp; Herzegovina, {Y}: {fig.bihGniPc} per person on the Atlas method.</>}
            >
              The deck&apos;s yardstick for living standards. Because population is the denominator, a shrinking population lifts it even when total income stands still.
            </Measure>
            <Measure
              term="Atlas method"
              code="NY.GNP.ATLS.CD"
              formula="Atlas rate = three-year average exchange rate, adjusted for inflation differences"
              example={
                <>
                  Bosnia &amp; Herzegovina, {Y}: GNI is {fig.bihAtlas} on the Atlas method and {fig.bihGni} at that year&apos;s exchange rate.
                </>
              }
            >
              The World Bank converts local-currency GNI to US dollars with a smoothed rate: the average of this year&apos;s exchange rate and the two before, adjusted for the gap between
              domestic and international inflation. Smoothing keeps one year&apos;s currency swing from reshuffling the rankings, which is why the income groups use it.
            </Measure>
            <Measure
              term="Purchasing power parity"
              code="NY.GNP.PCAP.PP.CD"
              formula="PPP rate = local price of a common basket ÷ its US price"
              example={
                <>
                  Viet Nam, {Y}: {fig.vnmPpp} per head at PPP against {fig.vnmPc} on the Atlas method, {fig.vnmRatio} times as much.
                </>
              }
            >
              PPP converts at the rate that buys the same basket of goods and services in every country, measured in international dollars. Where prices are low, PPP income sits well above
              the dollar figure; it is the better guide to what an income buys at home.
            </Measure>
          </div>
        </div>
      </Slide>

      {/* 4 · Glossary */}
      <Slide spec={specs.coins()} label="Glossary" id="glossary" className="slide-pad flex min-h-svh items-center">
        <div className={col}>
          <Eyebrow n="03">Glossary</Eyebrow>
          <SplitHeading className="display mt-5 text-5xl text-paper sm:text-6xl">Regimes, prices and income, defined</SplitHeading>

          <Reveal className="mt-10">
            <h3 className="eyebrow mb-4 text-paper-2">Exchange-rate regimes</h3>
            <dl>
              <Term term="Currency board">
                A law fixes the currency to an anchor and requires base money to be fully backed by reserves in that anchor. The central bank cannot set its own interest rate.{" "}
                <Swatch iso="BIH" />: {COUNTRIES.BIH.regime}.
              </Term>
              <Term term="Conventional peg">
                The central bank holds the exchange rate at a fixed level, or inside a narrow band, against another currency and intervenes to defend it, keeping discretion a currency board
                does not have. <Swatch iso="MDV" />: {COUNTRIES.MDV.regime}.
              </Term>
              <Term term="Free float">
                The market sets the exchange rate and the central bank does not target a level. <Swatch iso="SYC" />: {COUNTRIES.SYC.regime}. Tourism inflows move the rupee, and with it
                import prices.
              </Term>
              <Term term="Managed crawl and administered prices">
                The central bank sets a reference rate and lets the currency trade in a band around it, moving it gradually. Administered prices are set by the state rather than the market.{" "}
                <Swatch iso="VNM" />: the State Bank sets a daily central rate; electricity, fuel, tuition and health tariffs rise on a schedule.
              </Term>
            </dl>
          </Reveal>

          <Reveal className="mt-10">
            <h3 className="eyebrow mb-4 text-paper-2">Prices</h3>
            <dl>
              <Term term="CPI inflation and deflation">
                CPI inflation is the annual percentage change in the consumer price index, the cost of a fixed basket of goods and services that households buy (FP.CPI.TOTL.ZG). Deflation is
                negative inflation: prices falling on average. <Swatch iso="SYC" />, 2023: {fig.sycDeflation}.
              </Term>
              <Term term="Real and nominal">
                Nominal figures are in current prices; real figures take price change out. Real growth = (1 + income growth) ÷ (1 + price change) − 1, which is how the verdict is computed.{" "}
                <Swatch iso="BIH" />, deck framing: income per head {pct(deck.income, 1, true)}, prices {pct(deck.prices, 1, true)}, real {pct(deck.real, 1, true)}.
              </Term>
              <Term term="Log points">
                100 × ln(later ÷ earlier). Log points add up across years and treat rises and falls symmetrically: up 10 log points and down 10 returns to the start, which percentages do not.{" "}
                <Swatch iso="BIH" />, GNI per head 2022→{Y}: {fig.bihPcChange}, or {fig.bihPcLog} log points.
              </Term>
            </dl>
          </Reveal>

          <Reveal className="mt-10">
            <h3 className="eyebrow mb-4 text-paper-2">Income</h3>
            <dl>
              <Term term="Primary and secondary income">
                Primary income is earned across borders: wages, interest, dividends and profits. It is the difference between GDP and GNI. Secondary income is transfers, such as money
                emigrants send home; it is not part of GNI. The World Bank&apos;s personal remittances series combines personal transfers (secondary) with compensation of employees (primary).{" "}
                <Swatch iso="BIH" />, {Y}: personal remittances worth {fig.bihRemit} of GDP.
              </Term>
              <Term term="Income groups">
                Every 1 July the World Bank sorts economies into low, lower-middle, upper-middle and high income by GNI per head on the Atlas method. On 1 July 2026 Viet Nam crossed into
                upper-middle income, with {fig.vnmPc2025} per head against a $4,636 threshold (deck footnote).
                <span className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {ORDER.map((iso) => (
                    <span key={iso} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <Swatch iso={iso} />
                      <span className="text-muted">{COUNTRIES[iso].incomeGroup}</span>
                    </span>
                  ))}
                </span>
              </Term>
            </dl>
          </Reveal>
        </div>
      </Slide>

      {/* 5 · Indicators */}
      <Slide spec={specs.globe(null)} align="center" dim={0.4} label="Indicators" id="indicators" className="slide-pad flex min-h-svh items-center justify-center">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <Eyebrow n="04">Indicators</Eyebrow>
            <SplitHeading className="display mt-5 text-5xl text-paper sm:text-6xl">{`${N} indicators, one source`}</SplitHeading>
            <Reveal>
              <p className="lede mt-6">
                Each series is loaded for the four countries and the World aggregate, {FIRST}–{LAST}. The table lists every one with its World Bank code and unit, the newest year any of the
                four reports, and each country&apos;s own newest year. {fullCoverage} of {N} have all four countries reporting that newest year.
              </p>
            </Reveal>
          </div>
          <Reveal delay={150} className="mt-10">
            <IndicatorTable />
            <p className="mt-3 text-xs text-muted">
              Source: World Bank, World Development Indicators, retrieved {RETRIEVED}. A dot marks a country that reports the newest year; a dash means no data at all.
            </p>
          </Reveal>
        </div>
      </Slide>

      {/* 6 · Data notes */}
      <Slide spec={specs.text("2024")} label="Data notes" id="notes" className="slide-pad flex min-h-svh items-center">
        <div className={col}>
          <Eyebrow n="05">Data notes</Eyebrow>
          <SplitHeading className="display mt-5 text-5xl text-paper sm:text-6xl">Caveats, stated once and precisely</SplitHeading>
          <ol className="mt-10 space-y-4">
            {META.notes.map((note, i) => (
              <Note key={i} n={i + 1} title="A patched cell">
                <p>{note}</p>
              </Note>
            ))}
            <Note n={META.notes.length + 1} title="Seychelles’ population series breaks in 2022">
              <p>
                The series goes from {fig.sycPop21} in 2021 to {fig.sycPop22} in 2022, {fig.sycPopJump}. That is a break after the 2022 census, not real growth. Read any per-person ratio built
                from it across those two years with care; the World Bank&apos;s own GNI-per-head figures are used as published.
              </p>
            </Note>
            <Note n={META.notes.length + 2} title="Dollar incomes, local prices">
              <p>
                GNI and GNI per head on the Atlas method are in US dollars; CPI inflation is measured in local currency. Setting one against the other puts exchange-rate movements inside the
                comparison: a currency that gains on the dollar lifts dollar income without anyone earning more at home. The Atlas method&apos;s three-year smoothing damps this but does not
                remove it.
              </p>
            </Note>
            <Note n={META.notes.length + 3} title="The verdict’s window">
              <p>
                The deck compares income growth from 2022 to 2024, two annual changes, with three years of inflation: 2022, 2023 and 2024. The verdict keeps that framing. A like-for-like
                version, income from 2021 to 2024 against the same three years of prices, is on the{" "}
                <TLink href="/compare" label="Compare" className="link-underline text-paper">
                  Compare page
                </TLink>
                .
              </p>
              <p>
                The choice matters. <Swatch iso="BIH" />: {pct(deck.real, 1, true)} in real terms on the deck&apos;s framing, {pct(matched.real, 1, true)} like for like.
              </p>
            </Note>
            <Note n={META.notes.length + 4} title={`${LAST} is shown, not analysed`}>
              <p>
                The World Bank already publishes {LAST} values for {latestAny} of the {N} indicators for at least one of the four countries ({latestAll} for all four). They appear as the newest
                year in charts and tables, but the analysis window stays 2022–2024, as in the deck.
              </p>
            </Note>
          </ol>
        </div>
      </Slide>

      {/* 7 · Sources */}
      <Slide spec={specs.globe(null)} label="Sources" id="sources" className="slide-pad flex min-h-svh items-center">
        <div className={col}>
          <Eyebrow n="06">Sources</Eyebrow>
          <SplitHeading className="display mt-5 text-5xl text-paper sm:text-6xl">Where every number comes from</SplitHeading>

          <Reveal className="mt-10">
            <h3 className="eyebrow mb-4 text-paper-2">World Bank indicators</h3>
            <ul className="divide-y divide-rule border-y border-rule">
              {sourceIndicators.map((ind) => (
                <li key={ind.code} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                  <span className="text-[15px] text-paper">{ind.name}</span>
                  <a
                    href={`https://data.worldbank.org/indicator/${ind.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline font-mono text-xs text-paper-2 hover:text-paper"
                  >
                    {ind.code}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {META.source}, retrieved {RETRIEVED}. Bosnia&apos;s 2024 CPI inflation comes from Trading Economics&apos; republication of the same World Bank series.
            </p>
          </Reveal>

          <Reveal className="mt-10">
            <h3 className="eyebrow mb-4 text-paper-2">Events and policy</h3>
            <ul className="space-y-3">
              {EVENT_SOURCES.map((s) => (
                <li key={s.who} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full" style={{ background: s.iso ? COUNTRIES[s.iso].color : "var(--color-world)" }} aria-hidden />
                  <span>
                    <span className="text-paper">{s.who}</span>
                    <span className="text-paper-2">
                      {" "}
                      — {s.what}
                      {s.iso && <span className="sr-only"> ({COUNTRIES[s.iso].name})</span>}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-12">
            <div className="frame p-5">
              <div className="microprint relative -mx-1 mb-4" aria-hidden>
                {"BAHUM107 · MACROECONOMICS · 25BEC0374 · ".repeat(8)}
              </div>
              <h3 className="eyebrow relative">Credits</h3>
              <p className="display relative mt-3 text-3xl text-paper">Harsh</p>
              <p className="relative mt-2 text-sm leading-relaxed text-paper-2">
                <span className="num">25BEC0374</span> · BAHUM107 Macroeconomics · B.Tech Electronics &amp; Communication Engineering, VIT Vellore
              </p>
              <div className="relative mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <TLink href="/" label="The story" className="link-underline text-paper">
                  Read the story
                </TLink>
                <TLink href="/compare" label="Compare" className="link-underline text-paper">
                  Compare side by side
                </TLink>
              </div>
            </div>
          </Reveal>
        </div>
      </Slide>
    </>
  );
}
