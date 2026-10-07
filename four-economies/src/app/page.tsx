import { Slide } from "@/components/motion/Slide";
import { Reveal, Odometer } from "@/components/motion/Reveal";
import { TLink } from "@/components/motion/Transition";
import { specs } from "@/components/scene/specs";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { GroupedBars, HBars, Dumbbell } from "@/components/charts/Bars";
import { LineChart } from "@/components/charts/LineChart";
import { SlideRail } from "@/components/ui/SlideRail";
import { Stage, Head, Note, B } from "@/components/story/parts";
import { StoryStack, type StoryCard } from "@/components/story/StoryStack";
import { YearTrack, type YearEvents } from "@/components/story/YearTrack";
import { InflationPanel } from "@/components/story/InflationPanel";
import { ExploreCards } from "@/components/story/ExploreCards";
import { COUNTRIES, ORDER } from "@/lib/countries";
import { v, val, change, logPoints, keptShare, verdict, priceChange, ISOS, type Iso } from "@/lib/data";
import { usd, pct, people } from "@/lib/format";

const W = [2022, 2023, 2024];
const C = COUNTRIES;
const name = (i: Iso) => C[i].short;

// ── Figures the story quotes, all computed ─────────────────────────
const gniRatio = v("VNM", "gniAtlas", 2024) / v("SYC", "gniAtlas", 2024);
const gniGrowth = ISOS.map((i) => ({ i, g: change(v(i, "gniAtlas", 2022), v(i, "gniAtlas", 2024)) })).sort((a, b) => b.g - a.g);
const pcRatio = v("SYC", "gniPc", 2024) / v("VNM", "gniPc", 2024);
const pppRatio = v("SYC", "gniPcPpp", 2024) / v("VNM", "gniPcPpp", 2024);
const bihPop = change(v("BIH", "pop", 2022), v("BIH", "pop", 2024));
const bihPop2000 = change(v("BIH", "pop", 2000), v("BIH", "pop", 2024));
const bihGniLp = logPoints(v("BIH", "gniAtlas", 2022), v("BIH", "gniAtlas", 2024));
const bihPcLp = logPoints(v("BIH", "gniPc", 2022), v("BIH", "gniPc", 2024));
const vnmOutflow = v("VNM", "gdp", 2024) - v("VNM", "gni", 2024);
const deck = verdict("BIH", "deck");
const matched = ISOS.map((i) => ({ i, ...verdict(i, "matched") }));
const groups2024: Record<Iso, string> = { BIH: "Upper-middle", SYC: "High income", VNM: "Lower-middle", MDV: "Upper-middle" };

const stories: StoryCard[] = ORDER.map((i) => ({
  iso: i,
  name: C[i].name,
  short: C[i].short,
  slug: C[i].slug,
  color: C[i].color,
  regime: C[i].regimeShort,
  title: C[i].story.title,
  points: C[i].story.points,
  figure: C[i].story.figure,
  sources: C[i].story.sources,
}));

const timeline: YearEvents[] = [
  {
    year: 2022,
    items: [
      { when: "Feb", iso: "BIH", text: `Russia invades Ukraine. Energy and grain prices jump; Bosnian inflation reaches ${pct(v("BIH", "cpi", 2022), 1)}.` },
      { when: "Oct", iso: "VNM", text: "The Van Thinh Phat collapse sets off a bank run in Viet Nam; the State Bank hikes twice." },
      { when: "2022", iso: "MDV", text: "Maldivian fuel-subsidy costs overshoot the budget as oil spikes." },
      { when: "Dec", iso: "BIH", text: "The EU grants Bosnia & Herzegovina candidate status." },
    ],
  },
  {
    year: 2023,
    items: [
      { when: "1 Jan", iso: "MDV", text: "The Maldives raises GST to 8% and tourism GST to 16%." },
      { when: "2023", iso: "SYC", text: `The Seychelles rupee appreciates on the tourism rebound; prices fall ${pct(Math.abs(v("SYC", "cpi", 2023)), 2)} over the year.` },
      { when: "Sept", iso: "VNM", text: "Four rate cuts in Viet Nam through the year; a comprehensive strategic partnership with the United States." },
      { when: "Nov", iso: "MDV", text: "Mohamed Muizzu wins the Maldivian presidency on an “India Out” platform." },
      { when: "7 Dec", iso: "SYC", text: "An explosion and flash floods in Seychelles; a state of emergency is declared." },
    ],
  },
  {
    year: 2024,
    items: [
      { when: "21 Mar", iso: "BIH", text: "The European Council agrees to open accession talks with Bosnia & Herzegovina." },
      { when: "May", iso: "MDV", text: "Indian personnel leave the Maldives; Indian arrivals are down about a third after the January row." },
      { when: "Sept", iso: "VNM", text: "Typhoon Yagi, the costliest on record in Viet Nam; GDP still grows 7.09% (GSO)." },
      { when: "Oct", iso: "MDV", text: "India provides a $400m currency swap as Maldivian reserves run low." },
      { when: "2024", iso: "BIH", text: `Bosnian inflation falls to ${pct(v("BIH", "cpi", 2024), 2)}.` },
    ],
  },
];
const monthOf: Record<string, number> = { Jan: 0, "1 Jan": 0, Feb: 1, "21 Mar": 2, May: 4, Sept: 8, Oct: 9, Nov: 10, Dec: 11, "7 Dec": 11 };
const beads = timeline.flatMap((y, yi) => y.items.map((it) => ({ u: Math.min(0.99, (yi + (monthOf[it.when] ?? 6) / 12) / 3), iso: it.iso })));

const conclusions = [
  {
    lead: "Size is not prosperity.",
    body: `Viet Nam's national income is ${Math.round(gniRatio)} times the Seychelles', and its income per head is a quarter of it.`,
    spec: specs.text(`${Math.round(gniRatio)}×`, "VNM"),
  },
  {
    lead: "The denominator matters as much as the numerator.",
    body: "Part of Bosnia's convergence is people leaving, not output arriving.",
    spec: specs.text(pct(bihPop, 1, true), "BIH"),
  },
  {
    lead: "The exchange-rate regime decided the inflation.",
    body: "A currency board imported the shock, a float exported it, a peg plus subsidies buried it in the budget, an administered target staged it.",
    spec: specs.coins(),
  },
  {
    lead: "Income produced is not income kept.",
    body: `The Maldives surrenders ${pct(100 - keptShare("MDV"), 1)} of its output to the rest of the world every year.`,
    spec: specs.text(pct(100 - keptShare("MDV"), 1), "MDV"),
  },
];

export default function Home() {
  return (
    <>
      <SlideRail />

      {/* 01 · Title */}
      <Slide spec={specs.globe(null)} label="Title">
        <Stage>
          <p className="eyebrow mb-6 text-paper-2">BAHUM107 · Macroeconomics seminar</p>
          <Head
            as="h1"
            eyebrow="Gross national income · income per head · inflation"
            title={
              <>
                Four economies, three years, <em className="italic text-paper-2">one question:</em> who is actually better off?
              </>
            }
            lede="Bosnia & Herzegovina, Seychelles, Viet Nam and the Maldives, read through World Bank data for 2022–2024 — and what happened since."
          />
          <Reveal delay={350} className="mt-9 flex flex-wrap gap-2">
            {ORDER.map((i) => (
              <TLink key={i} href={`/countries/${C[i].slug}`} label={C[i].name} color={C[i].color} className="flex items-center gap-2 rounded-full border border-rule px-3.5 py-1.5 text-sm text-paper-2 transition-colors hover:border-paper/50 hover:text-paper">
                <span className="size-2 rounded-full" style={{ background: C[i].color }} aria-hidden />
                {C[i].name}
              </TLink>
            ))}
          </Reveal>
          <Reveal delay={500} className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3">
            <p className="eyebrow">Harsh · 25BEC0374 · B.Tech ECE, VIT Vellore</p>
            <p className="eyebrow">Scroll, or press ↓</p>
          </Reveal>
        </Stage>
      </Slide>

      {/* 02 · The draw */}
      <Slide spec={specs.globe("BIH")} label="The draw">
        <Stage>
          <Head
            eyebrow="How the four were drawn"
            title="Rank 74 picked the anchor"
            lede={
              <>
                Registration 25BEC0374 ends in 74, so rank 74 on the World Bank&apos;s GNI-per-capita ranking gives the anchor: <B>Bosnia &amp; Herzegovina</B>. The brief asks for a second country within twenty ranks. Three sit in that band — so rather than discard two, all three stay as comparators.
              </>
            }
          />
          <Reveal delay={250} className="frame mt-8 p-5">
            <div className="relative h-14">
              <div className="absolute inset-x-0 top-7 h-px bg-rule" />
              <div className="absolute top-[22px] h-3 rounded-full" style={{ left: "10%", right: "10%", background: "linear-gradient(90deg, transparent, rgb(236 229 211 / .16), transparent)" }} />
              {[54, 64, 74, 84, 94].map((r, k) => (
                <div key={r} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${10 + k * 20}%` }}>
                  <span className={`num block text-xs ${r === 74 ? "text-paper" : "text-muted"}`}>{r}</span>
                  <span className="mx-auto mt-2 block size-2.5 rounded-full" style={{ background: r === 74 ? C.BIH.color : "rgb(236 229 211 / .25)" }} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-paper-2">
              The ±20 band around rank 74. <span className="text-paper">Seychelles</span>, <span className="text-paper">the Maldives</span> and <span className="text-paper">Viet Nam</span> all fall inside it.
            </p>
          </Reveal>
          <Reveal delay={350}>
            <p className="lede mt-6">One anchor against three mirrors isolates what is specific to Bosnia from what is common to any small, open, import-dependent economy.</p>
            <Note>The latest three complete years in the series are 2022, 2023 and 2024, so that is the window throughout. The World Bank has since published 2025 for most series; where it adds something, it is shown as the newest year.</Note>
          </Reveal>
        </Stage>
      </Slide>

      {/* 03 · At a glance */}
      <Slide spec={specs.population()} label="At a glance">
        <Stage>
          <Head
            eyebrow="Four economies, 2024"
            title="Almost nothing in common"
            lede={`A country of ${people(v("VNM", "pop", 2024))} sits beside one of ${Math.round(v("SYC", "pop", 2024) / 1000)} thousand. Their incomes per head run the other way.`}
          />
          <Reveal delay={250} className="frame mt-8 overflow-x-auto">
            <table className="num w-full min-w-[30rem] text-left text-sm">
              <caption className="sr-only">Population, GNI, GNI per head and income group, 2024</caption>
              <thead className="text-muted">
                <tr className="eyebrow">
                  <th scope="col" className="px-4 py-3 font-normal">Country</th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">Population</th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">GNI</th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">Per head</th>
                  <th scope="col" className="px-4 py-3 font-normal">Group</th>
                </tr>
              </thead>
              <tbody>
                {ORDER.map((i) => (
                  <tr key={i} className="border-t border-rule">
                    <th scope="row" className="px-4 py-3 font-medium text-paper">
                      <span className="mr-2 inline-block size-2 rounded-full" style={{ background: C[i].color }} aria-hidden />
                      {C[i].name}
                    </th>
                    <td className="px-4 py-3 text-right text-paper-2">{v(i, "pop", 2024).toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 text-right text-paper-2">{usd(v(i, "gniAtlas", 2024))}</td>
                    <td className="px-4 py-3 text-right text-paper">{usd(v(i, "gniPc", 2024))}</td>
                    <td className="px-4 py-3 text-paper-2">{groups2024[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <Note>GNI and GNI per head, Atlas method (current US$); income group as classified for 2024. The particle spheres are to scale: each one&apos;s volume is its population.</Note>
        </Stage>
      </Slide>

      {/* 04 · Three measures */}
      <Slide spec={specs.text("GNI")} label="Three measures">
        <Stage>
          <Head eyebrow="Definitions" title="Three measures that disagree with each other" />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["GDP", "What is produced inside the borders, whoever owns the factory."],
              ["GNI", "What residents earn, wherever it is produced: GDP plus net primary income from abroad."],
              ["GNI per head", "GNI divided by population — the usual proxy for a living standard, and the most easily misread."],
            ].map(([t, d], k) => (
              <Reveal key={t} delay={k * 90} className="frame p-4">
                <p className="display text-2xl text-paper">{t}</p>
                <p className="mt-2 text-sm leading-relaxed text-paper-2">{d}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Reveal delay={280} className="frame p-4">
              <p className="eyebrow text-paper">The Atlas method</p>
              <p className="mt-2 text-sm leading-relaxed text-paper-2">Converts local currency at a three-year smoothed exchange rate, so one bad currency year does not move a country&apos;s income. It is why these figures drift rather than jump.</p>
            </Reveal>
            <Reveal delay={360} className="frame p-4">
              <p className="eyebrow text-paper">Purchasing power parity</p>
              <p className="mt-2 text-sm leading-relaxed text-paper-2">Re-prices income at what it actually buys locally. Cheap countries gain, expensive ones lose. The gap between the two is itself a finding.</p>
            </Reveal>
          </div>
          <Reveal delay={420}>
            <p className="lede mt-6">Which measure you choose changes who looks richest — so every one of them is here.</p>
          </Reveal>
        </Stage>
      </Slide>

      {/* 05 · Aggregate */}
      <Slide spec={specs.gniLog()} label="National income">
        <Stage>
          <Head
            eyebrow="GNI, Atlas method"
            title="The aggregate: a different weight class"
            lede={
              <>
                Viet Nam&apos;s national income is <B>{Math.round(gniRatio)}×</B> the Seychelles&apos;. Yet {name(gniGrowth[0].i)} grew fastest of the four, adding <B>{pct(gniGrowth[0].g, 1)}</B> in two years.
              </>
            }
          />
          <Reveal delay={250} className="mt-8">
            <ChartFrame
              title="GNI, Atlas method"
              subtitle="Current US$, log scale — each gridline is ten times the one before"
              table={{ columns: ["Country", ...W.map(String), "Change"], rows: ORDER.map((i) => [C[i].name, ...W.map((y) => usd(v(i, "gniAtlas", y))), pct(change(v(i, "gniAtlas", 2022), v(i, "gniAtlas", 2024)), 1, true)]) }}
              source="Source: World Bank (NY.GNP.ATLS.CD)"
            >
              <GroupedBars log format="usd" height={280} groups={ORDER.map((i) => ({ id: i, label: C[i].short, color: C[i].color, values: W.map((y) => ({ key: String(y), value: v(i, "gniAtlas", y) })) }))} />
            </ChartFrame>
          </Reveal>
        </Stage>
      </Slide>

      {/* 06 · Per head */}
      <Slide spec={specs.gniPc()} label="Per head">
        <Stage>
          <Head
            eyebrow="GNI per head, Atlas method"
            title="Per head, the ranking inverts"
            lede={
              <>
                Seychelles earns <B>{pcRatio.toFixed(1)}×</B> Viet Nam per person. The largest economy in the group has the smallest income per head.
              </>
            }
          />
          <Reveal delay={250} className="mt-8">
            <ChartFrame
              title="GNI per capita, Atlas method"
              subtitle="Current US$"
              table={{ columns: ["Country", ...W.map(String), "2025"], rows: ORDER.map((i) => [C[i].name, ...W.map((y) => usd(v(i, "gniPc", y))), usd(val(i, "gniPc", 2025))]) }}
              source="Source: World Bank (NY.GNP.PCAP.CD)"
            >
              <GroupedBars format="usd" height={280} groups={ORDER.map((i) => ({ id: i, label: C[i].short, color: C[i].color, values: W.map((y) => ({ key: String(y), value: v(i, "gniPc", y) })) }))} />
            </ChartFrame>
          </Reveal>
          <Note>
            Published in July 2026, the 2025 figures keep the order: {ORDER.map((i) => `${name(i)} ${usd(val(i, "gniPc", 2025))}`).join(" · ")}.
          </Note>
        </Stage>
      </Slide>

      {/* 07 · Population */}
      <Slide spec={specs.emigration("BIH")} label="Population">
        <Stage>
          <Head
            eyebrow="Total population"
            title="The denominator does half the work"
            lede={
              <>
                Bosnia&apos;s population fell <B>{pct(Math.abs(bihPop), 1)}</B> in two years, so its income per head rose faster than its economy did. Part of the convergence is emigration, not growth.
              </>
            }
          />
          <Reveal delay={200} className="mt-8 grid grid-cols-2 gap-3">
            <div className="frame p-4">
              <p className="eyebrow">Bosnia&apos;s GNI, 2022→24</p>
              <p className="denom mt-2 text-4xl text-paper">
                <Odometer value={`+${bihGniLp.toFixed(1)}`} />
              </p>
              <p className="mt-1 text-xs text-muted">log points</p>
            </div>
            <div className="frame p-4">
              <p className="eyebrow">GNI per head, 2022→24</p>
              <p className="denom mt-2 text-4xl text-paper">
                <Odometer value={`+${bihPcLp.toFixed(1)}`} />
              </p>
              <p className="mt-1 text-xs text-muted">log points</p>
            </div>
          </Reveal>
          <Reveal delay={300} className="mt-3">
            <ChartFrame
              title="Population, indexed"
              subtitle="2022 = 100"
              legend={ORDER.map((i) => ({ label: C[i].short, color: C[i].color }))}
              table={{ columns: ["Country", "2022", "2023", "2024", "2025"], rows: ORDER.map((i) => [C[i].name, ...[2022, 2023, 2024, 2025].map((y) => people(val(i, "pop", y)))]) }}
              source="Source: World Bank (SP.POP.TOTL)"
            >
              <LineChart
                height={200}
                format="num1"
                series={ORDER.map((i) => ({ id: i, label: C[i].short, color: C[i].color, data: [2022, 2023, 2024, 2025].map((y) => ({ year: y, value: (v(i, "pop", y) / v(i, "pop", 2022)) * 100 })) }))}
              />
            </ChartFrame>
          </Reveal>
          <Note>Over the longer run the World Bank series records {pct(Math.abs(bihPop2000), 0)} fewer residents in Bosnia than in 2000 — the stream of particles leaving the crowd.</Note>
        </Stage>
      </Slide>

      {/* 08 · PPP */}
      <Slide spec={specs.ppp()} label="Purchasing power">
        <Stage>
          <Head
            eyebrow="Atlas against PPP, 2024"
            title="What the money actually buys"
            lede={
              <>
                In Atlas dollars Seychelles earns <B>{pcRatio.toFixed(1)}×</B> Viet Nam. Priced at what money buys at home, only <B>{pppRatio.toFixed(1)}×</B>. The gap between the two measures closes by half.
              </>
            }
          />
          <Reveal delay={250} className="mt-8">
            <ChartFrame
              title="GNI per capita, 2024"
              subtitle="Atlas (current US$) against PPP (current international $)"
              table={{ columns: ["Country", "Atlas", "PPP", "PPP ÷ Atlas"], rows: ORDER.map((i) => [C[i].name, usd(v(i, "gniPc", 2024)), usd(v(i, "gniPcPpp", 2024)), `${(v(i, "gniPcPpp", 2024) / v(i, "gniPc", 2024)).toFixed(2)}×`]) }}
              source="Source: World Bank (NY.GNP.PCAP.CD, NY.GNP.PCAP.PP.CD)"
            >
              <Dumbbell format="usd" aLabel="Atlas" bLabel="PPP" rows={ORDER.map((i) => ({ id: i, label: C[i].short, color: C[i].color, a: v(i, "gniPc", 2024), b: v(i, "gniPcPpp", 2024) }))} />
            </ChartFrame>
          </Reveal>
          <Note>
            Prices at home stretch Viet Nam&apos;s income {(v("VNM", "gniPcPpp", 2024) / v("VNM", "gniPc", 2024)).toFixed(1)}-fold; Seychelles&apos; only {(v("SYC", "gniPcPpp", 2024) / v("SYC", "gniPc", 2024)).toFixed(1)}-fold. In the particles, solid towers are Atlas, outlined towers PPP.
          </Note>
        </Stage>
      </Slide>

      {/* 09 · GNI vs GDP */}
      <Slide spec={specs.leak()} label="Kept at home">
        <Stage>
          <Head
            eyebrow="GNI against GDP, 2024"
            title="Produced here, earned elsewhere"
            lede={
              <>
                The Maldives keeps only <B>{pct(keptShare("MDV"), 1)}</B> of what it produces. Viet Nam sends <B>{usd(vnmOutflow)}</B> abroad every year. Bosnia keeps almost all of it.
              </>
            }
          />
          <Reveal delay={250} className="mt-8">
            <ChartFrame
              title="Share of GDP kept as national income"
              subtitle="GNI ÷ GDP, both current US$, 2024"
              table={{ columns: ["Country", "GDP", "GNI", "Kept", "Paid abroad"], rows: ORDER.map((i) => [C[i].name, usd(v(i, "gdp", 2024)), usd(v(i, "gni", 2024)), pct(keptShare(i), 1), usd(v(i, "gdp", 2024) - v(i, "gni", 2024))]) }}
              source="Source: World Bank (NY.GNP.MKTP.CD, NY.GDP.MKTP.CD). The shortfall is net primary income paid abroad."
            >
              <HBars format="pct" domain={[80, 100]} rows={ORDER.map((i) => ({ id: i, label: C[i].short, color: C[i].color, value: keptShare(i) }))} />
            </ChartFrame>
          </Reveal>
          <Note>
            Bosnia&apos;s remittances — {pct(v("BIH", "remitPct", 2024), 1)} of GDP — are secondary income, so they lift disposable income but never appear in GNI at all. Each ring in the particles is 100% of GDP; the stream leaving it is the share paid abroad.
          </Note>
        </Stage>
      </Slide>

      {/* 10 · Inflation */}
      <Slide spec={specs.inflation()} label="Inflation">
        <Stage>
          <Head
            eyebrow="Inflation, consumer prices"
            title="One shock, four price stories"
            lede={
              <>
                The same war, the same energy and grain markets. Bosnia took <B>{pct(v("BIH", "cpi", 2022), 0)}</B>; Seychelles had deflation. The difference is institutional, not geographic.
              </>
            }
          />
          <Reveal delay={250} className="mt-8">
            <InflationPanel />
          </Reveal>
        </Stage>
      </Slide>

      {/* 11–14 · Four price stories */}
      <StoryStack cards={stories} />

      {/* 15 · Timeline */}
      <Slide spec={specs.helix(beads)} align="center" dim={0.45} label="2022–2024" className="pt-24 lg:pt-0">
        <YearTrack years={timeline} />
      </Slide>

      {/* 16 · Beyond the numbers */}
      <Slide spec={specs.globe(null)} label="Beyond the numbers">
        <Stage>
          <Head eyebrow="What the numbers leave out" title="Each economy runs on an arrangement no statistic records" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {ORDER.map((i, k) => (
              <Reveal key={i} delay={k * 90} className="frame p-5" as="article">
                <h3 className="eyebrow flex items-center gap-2 text-paper">
                  <span className="size-2 rounded-full" style={{ background: C[i].color }} aria-hidden />
                  {C[i].name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-2">{C[i].leftOut}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={400}>
            <p className="lede mt-6">Structure and politics decide how a shock travels. The price index only records where it lands.</p>
          </Reveal>
        </Stage>
      </Slide>

      {/* 17 · Verdict */}
      <Slide spec={specs.verdict("BIH", "deck")} label="The verdict">
        <Stage>
          <Head
            eyebrow="Living standards, 2022–2024"
            title="The verdict on living standards"
            lede={
              <>
                Bosnia&apos;s income per head rose <B>{pct(deck.income, 1)}</B>. Its prices rose <B>{pct(deck.prices, 1)}</B>. On the measure that matters to a household, Bosnians went backwards.
              </>
            }
          />
          <Reveal delay={250} className="mt-8">
            <ChartFrame
              title="Income per head against prices"
              subtitle="GNI per head 2022→2024 (Atlas US$) against consumer prices over 2022–2024"
              legend={[
                { label: "Income per head", color: "var(--color-paper)" },
                { label: "Consumer prices", color: "var(--color-world)" },
              ]}
              table={{ columns: ["Country", "Income", "Prices", "Real"], rows: ORDER.map((i) => { const r = verdict(i, "deck"); return [C[i].name, pct(r.income, 1, true), pct(r.prices, 1, true), pct(r.real, 1, true)]; }) }}
              source="Atlas income is in US dollars and CPI in local prices, so this shows direction rather than an exact real-income series. Source: World Bank."
            >
              <HBars
                format="pctSigned"
                rows={ORDER.flatMap((i) => {
                  const r = verdict(i, "deck");
                  return [
                    { id: `${i}-inc`, label: `${C[i].short} · income`, color: C[i].color, value: r.income },
                    { id: `${i}-px`, label: `${C[i].short} · prices`, color: "var(--color-world)", value: r.prices },
                  ];
                })}
              />
            </ChartFrame>
          </Reveal>
          <Reveal delay={350} className="frame mt-3 p-4">
            <p className="eyebrow text-paper">Check the base year</p>
            <p className="mt-2 text-sm leading-relaxed text-paper-2">
              The deck compares two years of income growth with three years of inflation. Measured like-for-like — income from 2021, over the same three years as prices — Bosnia comes out at <B>{pct(matched[0].real, 1, true)}</B> in real terms, against{" "}
              {matched.slice(1).map((m, k) => (
                <span key={m.i}>
                  {k > 0 && (k === 2 ? " and " : ", ")}
                  {name(m.i)} {pct(m.real, 1, true)}
                </span>
              ))}
              . Either way, Bosnia gained least.{" "}
              <TLink href="/compare" label="Compare" className="link-underline text-paper">
                Run both on the Compare page
              </TLink>
              .
            </p>
          </Reveal>
        </Stage>
      </Slide>

      {/* 18 · Conclusions */}
      <div className="relative z-10">
        <div className="slide-pad pb-0">
          <p className="eyebrow">Four conclusions</p>
        </div>
        {conclusions.map((c, k) => (
          <Slide key={k} spec={c.spec} label={`Conclusion ${k + 1}`}>
            <div className="slide-pad flex min-h-[85svh] items-center">
              <div className="max-w-xl lg:max-w-[40rem]">
                <p className="denom num text-6xl text-paper/30">{String(k + 1).padStart(2, "0")}</p>
                <Head eyebrow={`Conclusion ${k + 1} of 4`} title={c.lead} lede={c.body} />
                {k === 3 && (
                  <Reveal delay={300} className="frame mt-8 p-4">
                    <p className="text-sm leading-relaxed text-paper-2">
                      And the footnote that dates this deck: on 1 July 2026 Viet Nam crossed into upper-middle income — <B>{usd(val("VNM", "gniPc", 2025))}</B> per head against a $4,636 threshold.
                    </p>
                  </Reveal>
                )}
              </div>
            </div>
          </Slide>
        ))}
      </div>

      {/* 19 · Explore */}
      <Slide spec={specs.globe(null)} label="Explore">
        <Stage>
          <Head eyebrow="Go deeper" title="Open a country file" lede="Each file carries 25 years of data, the policy story behind the inflation, the people, the structure of the economy and a timeline." />
          <Reveal delay={200} className="mt-8">
            <ExploreCards
              cards={ORDER.map((i) => ({
                iso: i,
                name: C[i].name,
                slug: C[i].slug,
                color: C[i].color,
                thesis: C[i].thesis,
                stat: usd(v(i, "gniPc", 2024)),
                statLabel: `GNI per head 2024 · prices ${pct(priceChange(i, 2022, 2024), 1, true)} over 2022–24`,
              }))}
            />
          </Reveal>
          <Reveal delay={300} className="mt-6 flex flex-wrap gap-3">
            <TLink href="/compare" label="Compare" className="eyebrow rounded-full bg-paper px-5 py-3 text-ink transition-opacity hover:opacity-85">
              Compare side by side →
            </TLink>
            <TLink href="/method" label="Method" className="eyebrow rounded-full border border-rule px-5 py-3 text-paper transition-colors hover:border-paper">
              Method &amp; sources
            </TLink>
          </Reveal>
        </Stage>
      </Slide>
    </>
  );
}
