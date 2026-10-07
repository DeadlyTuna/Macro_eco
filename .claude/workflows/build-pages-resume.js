export const meta = {
  name: 'build-site-pages-resume',
  description: 'Build country, compare and method pages in parallel, each followed by an independent review-and-fix pass',
  phases: [
    { title: 'Build', detail: 'one agent per page group finishes its files', model: 'sonnet' },
    { title: 'Review', detail: 'independent reviewer checks each page group against its brief and fixes defects', model: 'sonnet' },
  ],
}

const ROOT = 'D:\\clg\\projects sem3\\Macro eco\\four-economies'

const SHARED = `
You are working in an existing Next.js project at ${ROOT} (Next.js 16.4 App Router, React 19.3, Tailwind CSS v4, TypeScript, cacheComponents enabled). It is an interactive macroeconomics site ("Four Economies") comparing Bosnia & Herzegovina (BIH), Seychelles (SYC), Viet Nam (VNM) and the Maldives (MDV): GNI, income per head and inflation, 2022–2024, from World Bank data. A student's seminar deck is the source of the narrative.

IMPORTANT Next.js 16 notes: this version has breaking changes. params in pages/layouts is a Promise (await it). Docs live in node_modules/next/dist/docs/ — read the relevant guide before using an API you are unsure of (e.g. generateStaticParams, generateMetadata, opengraph-image, sitemap, robots, icon). With cacheComponents on, avoid Date.now()/new Date()/Math.random() in server components.

READ THESE EXISTING FILES FIRST (they define the APIs you must use):
- src/lib/data.ts — ISOS, YEARS, series(), val(), v(), latest(), points(region,key,from,to), change(), logPoints(), priceChange(region,from,to), verdict(iso,mode), keptShare(iso,year), rankOf(), INDICATORS (41 WDI indicators with code/name/unit), META (retrieved date, notes). Regions include "WLD" (World) for benchmark lines.
- src/lib/format.ts — usd(), pct(), people(), num(), byUnit(), unitLabel, FormatKey + formatter(), unitFormat.
- src/lib/countries.ts — COUNTRIES[iso] (name, short, slug, local name, color, capital, currency, regime, regimeShort, centralBank, incomeGroup, artifact, thesis, story {title, points, figure, sources}, leftOut, events), ORDER, bySlug(), colorOf().
- src/components/scene/specs.ts and formations.ts — specs.* return plain-data Spec objects for the persistent 3D particle field (globe(focus), population(), gniLog(), gniPc(highlight), indicatorBars(key, year, fmtFn, highlight), ppp(), emigration(iso), leak(only), inflation(isos, years), coins(only), sculpture(iso), rosette(iso), helix(beads), verdict(iso, mode), sectors(iso), text(str, iso)).
- src/components/motion/Slide.tsx — <Slide spec={...} align="right"|"left"|"center" dim={0..1} label="Short label" id="..." className="...">. Every page section MUST be a Slide: while it holds the middle of the viewport it sets the 3D formation. Convention: text content sits in the LEFT column (max-w-xl or ~560px on lg screens) so the particle formation fills the right side; on mobile content is full width (the field dims itself behind). Use className like "slide-pad flex min-h-svh items-center".
- src/components/motion/Reveal.tsx — SplitHeading (as, className, delay, immediate), Reveal (delay, as), Odometer (value: formatted string). 
- src/components/motion/Transition.tsx — TLink (drop-in for next/link that plays the page-transition shutter; props label and color name the destination).
- src/components/charts/ChartFrame.tsx (ChartFrame with title, subtitle, legend items, table {columns, rows}, source; Legend; useWidth; useInView; Tooltip; TipRow), LineChart.tsx (series [{id,label,color,data:[{year,value}],dashed}], format: FormatKey, height, window:[from,to], log, zero, yDomain, endLabels), Bars.tsx (GroupedBars, HBars rows [{id,label,color,value,display?}], Dumbbell).
- src/components/ui/Flag.tsx (Flag iso className), Guilloche.tsx (decorative rosette: petals, rings, strands, size, color, spin).
- src/app/globals.css — design tokens and classes: .display (Bodoni Moda display), .eyebrow (Martian Mono label), .lede, .num (tabular numbers), .denom (engraved denomination numerals), .frame (banknote double-hairline panel), .microprint, .on-stage, .link-underline, .slide-pad, .reveal; Tailwind colours text-paper, text-paper-2, text-muted, bg-ink, bg-ink-2, bg-ink-3, border-rule, text-bih/syc/vnm/mdv etc.; font-display, font-mono, font-thaana.
- src/app/layout.tsx — root layout already provides Nav, Footer, persistent 3D scene, smooth scroll and transitions. Do not modify it.

DESIGN SYSTEM (follow exactly): "banknote / security print" aesthetic on a deep ink background. Display type is Bodoni Moda via .display (use restraint: big headlines, denomination figures). Eyebrows in .eyebrow. Panels use .frame. Country identity = COUNTRIES[iso].color (never use colour alone: always pair with a label). Key figures can roll in with <Odometer value={formatted}/>. Motion: SplitHeading for section headlines, Reveal for paragraphs/panels. Keep it disciplined: hairline rules, generous spacing, no glassmorphism blobs, no emoji.

CHART RULES: one y-axis only; legends for 2+ series (ChartFrame legend prop) plus direct end labels; every chart gets a table view via ChartFrame's table prop; text stays in ink colours (series colour only on marks); World benchmark series uses color "var(--color-world)" and dashed: true; highlight the deck window with window={[2022, 2024]} where relevant.

SERVER/CLIENT BOUNDARY: page.tsx files are server components. Charts, Slide, Reveal, TLink are client components — pass them only serializable props (FormatKey strings, plain arrays/objects). NEVER pass a function prop from a server component into a client component. If you need interactivity (state, selects, buttons), put it in a "use client" component file.

DATA INTEGRITY: compute every number from src/lib/data.ts — never hard-code a World Bank figure. Deck quotes already in countries.ts are fine. Do not invent facts, dates or numbers. Known caveats to state precisely where relevant: Seychelles' population series jumps ~21% between 2021 and 2022 (a break after the 2022 census, not real growth); Bosnia's 2024 CPI inflation (1.69%) is patched from Trading Economics' republication because the API cell was empty (META.notes); Atlas GNI is in US dollars while CPI is in local prices. Copy: plain, specific, sentence case, active voice, no filler.

ACCESSIBILITY: exactly one h1 per page; logical h2/h3; visible focus; buttons are <button type="button">; form controls labelled; respect reduced motion (existing components already do).


CONTINUATION NOTE (read carefully): an earlier attempt at this task was cut off by an account usage limit. Some files in your scope ALREADY EXIST from that attempt (see the per-task list). Read them first, keep what is correct and on-brief, fix what is broken, and finish everything that is missing. src/data/research.json now contains REAL researched data for all four countries in the shape src/lib/research.ts expects — do NOT overwrite or empty it; use it via getResearch(). Work efficiently: avoid re-reading large files you have already read, prefer targeted edits, and keep your final report short.

PROCESS RULES: Do NOT run npm run build, next build or next dev (other agents are working concurrently). DO run \`npx tsc --noEmit -p .\` and \`npx eslint <your files>\` from ${ROOT} and fix every error in YOUR files. Only create/edit the files in your scope; if a shared file needs a change, say so in your final report instead of editing it. Final answer: a concise report listing files created, sections built, any shared-file changes you need, and anything you could not finish.
`

const TASKS = [
  {
    key: 'country',
    brief: `
ALREADY EXISTS from the earlier attempt: src/lib/research.ts, src/components/country/helpers.ts, Hero.tsx, parts.tsx. MISSING: src/app/countries/[slug]/page.tsx and most sections.

YOUR SCOPE: the per-country pages. Create src/app/countries/[slug]/page.tsx (server component; generateStaticParams over ORDER slugs; generateMetadata with title/description per country; notFound() for unknown slugs) and components under src/components/country/. Also create src/lib/research.ts and src/data/research.json (content: {} for now).

src/lib/research.ts: export a typed getResearch(iso) that reads src/data/research.json (keyed by ISO3) and returns a partial object or null. Shape (all optional): basics {local_name, capital, area_km2, languages, currency, regime_2024, central_bank, islands}, policy_rate {"2022","2023","2024", note}, tourism {"2022","2023","2024","2025", source}, exports {products, markets}, ratings [{agency, date, from, to}], events [{date, text, source}], since_2024 [{text, source}], did_you_know [{text, source}]. Components must render gracefully when research is null or fields are missing (hide those blocks).

The page for a country (iso from bySlug) has these Slides, in order (spec in brackets):
1. Hero [specs.sculpture(iso)]: eyebrow "Country file · {iso2} · 2022–2024"; h1 = country name in huge .display (fluid size, e.g. clamp(3.5rem, 11vw, 10rem)); local name below (for MDV render the Thaana text with className font-thaana and dir="rtl", plus local.alt transliteration; for BIH show local.alt Cyrillic in .font-mono small); Flag; thesis as .lede; a row of chips: capital, currency name + code, regimeShort, income group; small caption naming the particle landmark (artifact.name — artifact.caption).
2. Denominations [specs.rosette(iso)]: h2 like "The figures, 2024"; a grid of banknote "denomination plates" (.frame, .denom numerals, Odometer) for GNI per head (Atlas), GNI per head (PPP), GNI (Atlas), population, inflation 2022 / 2023 / 2024 (three small plates), GDP growth 2024, and GNI per head 2025 if available (clearly labelled as the newest year). Include a note explaining the particle rosette: petals = GNI per head ÷ $1,000 (rounded), three rings = income per head 2022, 2023, 2024, and each ring's wobble grows with that year's inflation.
3. Income [specs.gniPc(iso)]: LineChart GNI per capita Atlas vs PPP 2000–latest plus World Atlas (dashed), window 2022–2024, table view. Copy computed from data: change 2022→2024, change 2000→2024, rank among the four in 2024 (rankOf).
4. Prices [specs.inflation([iso], [2020, 2021, 2022, 2023, 2024])]: LineChart of CPI inflation 2000–latest with World dashed, zero line, window. Copy: the window's three rates, cumulative price-level change 2022–2024 via priceChange(iso, 2022, 2024), and for BIH the patched-2024 note.
5. Why [specs.coins(iso)]: h2 = story.title; story.points as a list (lead in semibold paper colour, body in paper-2); story.figure as a featured plate; story.sources small. Plus a LineChart of the exchange rate (fx, local currency per US$, 2000–latest) with a short, accurate explanation of the regime (COUNTRIES[iso].regime) and what the line shows (BIH moves with EUR/USD because the mark is fixed to the euro; MVR flat at the peg; SCR floats; VND crawls up gradually).
6. Produced vs earned [specs.leak(iso)]: LineChart GDP vs GNI (current US$) 2000–latest; HBars of the kept share (GNI/GDP) for 2022, 2023, 2024; net primary income 2024 (netPrimary, usd); remittances % of GDP 2024 if present (VNM has none recently — say WDI does not report it). Explain primary vs secondary income in one or two sentences (remittances are secondary income so they never enter GNI).
7. People [specs.emigration(iso)]: population line 2000–latest; net migration by year (2015–latest) as GroupedBars or HBars; life expectancy and urban share plates; for SYC the census-break caveat; for BIH note population change since 2000 and over the window (−1.3% 2022→2024 per the deck — compute it).
8. Structure [specs.sectors(iso)]: HBars sector shares 2024 (agriculture, industry, services; note they need not sum to 100 because taxes/subsidies sit outside); LineChart exports and imports % of GDP 2000–latest (two series, use country colour and paper colour, legend); plates for investment % GDP, FDI % GDP, current account % GDP, reserves (months of imports) — latest available year labelled.
9. Timeline [specs.helix(beads)] where beads = events mapped to u in [0,1] across 2022-01..2024-12 (clamp) with iso: a vertical timeline of COUNTRIES[iso].events merged with research events (sorted by date), each with date label and source link when present.
10. Beyond the numbers [specs.globe(iso)]: COUNTRIES[iso].leftOut as a pull quote; research did_you_know and since_2024 lists if present; tourism arrivals and policy rates from research as small tables if present.
11. Next [specs.globe(null), align center]: big TLink cards to the previous and next country (wrap around ORDER, with label and color props) and a link to /compare.
Use realistic, data-derived copy throughout. Keep each section's text column readable (max-w-xl) and charts within the left ~45–50% on lg screens (e.g. lg:max-w-[46rem]) so the 3D formation remains visible on the right.`,
  },
  {
    key: 'compare',
    brief: `
ALREADY EXISTS from the earlier attempt: src/components/compare/controls.tsx, HeadToHead.tsx, IndicatorExplorer.tsx, prose.ts. MISSING: src/app/compare/page.tsx, src/components/charts/Bubble.tsx, the Gapminder, Scoreboard, Verdict and Closing sections.

YOUR SCOPE: the comparison page. Create src/app/compare/page.tsx (server; metadata export with title "Compare" and a description) and client components under src/components/compare/, plus src/components/charts/Bubble.tsx.

Sections (each a Slide; interactive sections are client components that render their own <Slide spec={stateDependentSpec}>; Slide re-observes when its spec changes, so the 3D field updates when the selection changes while visible):
1. Head to head [spec specs.gniPc(A) highlighting A]: h1 "Side by side" (.display). Two labelled <select>s (country A, country B; defaults BIH and SYC; prevent picking the same country twice by swapping). A year toggle 2022/2023/2024 (+2025 where available for that metric). For ~10 metrics (GNI per head Atlas, GNI per head PPP, GNI Atlas, population, inflation, GDP growth, kept share GNI/GDP, remittances % GDP, exports % GDP, unemployment, life expectancy) show A and B values in .denom-style figures with mini proportional bars in their colours and a plain ratio or gap sentence ("Seychelles earns 2.0× Bosnia per head at PPP"). Handle null data with an em dash and "not reported".
2. Indicator explorer [spec specs.indicatorBars(key, latestYear, formatterFn) — created client-side so a function is fine]: a labelled select of ~18 curated indicators (key, human label, FormatKey, optional log), range presets as a button group (2000–2025, 2015–2025, 2022–2024), LineChart of the four countries + World (dashed) with window 2022–2024 shaded when in range, table view. Under the chart, one auto-generated sentence naming the leader and laggard in the latest year with values.
3. Gapminder [spec specs.globe(null), align "center", dim 0.45]: src/components/charts/Bubble.tsx — x = GNI per capita PPP (log scale, roughly $5k–$40k), y = CPI inflation (%; clamp display range about −3% to 16%, show clamped points at the edge with a marker), bubble area ∝ population (sqrt scale, Viet Nam largest), colour = country, labelled. Year slider (2000–latest with data), Play/Pause button that animates through the years (~700ms per year; stops at the end), the year shown huge in the background (.display, faint). Trails: faint polyline of each country's path up to the current year. Smooth movement: position bubbles with <g transform> and CSS transition on transform. Tooltip on hover/focus with the year's values. Keyboard accessible slider (native input range, labelled). Respect prefers-reduced-motion (no autoplay transitions). Include a ChartFrame table view of the current year.
4. Scoreboard [spec specs.population(), align "right"]: a sortable table for 2024 (rows = countries, columns: GNI per head Atlas, PPP, GNI, population, inflation 2024, cumulative prices 2022–24, GDP growth, kept share, unemployment, life expectancy). Click a column header button to sort (aria-sort). Mark the best value in each column subtly. On small screens the table scrolls horizontally inside its container (data-lenis-prevent on the scroll container).
5. Verdict [spec specs.verdict(selected, mode)]: h2 about real income. Mode buttons (aria-pressed): "Deck framing" (verdict mode "deck": income per head 2022→2024 against prices over 2022–2024), "Like-for-like" (mode "matched": income 2021→2024 against prices 2022–2024, i.e. both over the same three years), "Two years" (mode "twoYear": income 2022→2024 against prices 2023–2024). For each country show income change vs price change (paired HBars or a small chart) and the implied real change, sorted. Copy must be honest and computed: in the deck framing Bosnia's income per head rose ~14.3% while prices rose ~23.0% (went backwards); like-for-like Bosnia is roughly +2.7% real — still by far the weakest of the four. Add the caveat that Atlas income is in US dollars while CPI is in local prices, so this shows direction, not an exact real-income series. A country selector chooses which country the 3D balance scale shows.
6. Closing [spec specs.globe(null), align center]: four TLink cards to the country pages (name, colour dot, thesis) and a link to /method.
Make it data-dense but calm; the left-column convention applies to narrative sections, but data-heavy sections (explorer, gapminder, scoreboard) may use a wider container (max-w-6xl) with align "center" and a lower dim (0.35–0.5) so the field becomes ambient behind them.`,
  },
  {
    key: 'method',
    brief: `
ALREADY EXISTS from the earlier attempt: src/app/method/page.tsx (534 lines), src/components/method/IndicatorTable.tsx, RankBand.tsx, src/app/icon.svg, opengraph-image.tsx, robots.ts, sitemap.ts. Verify each against the brief, complete anything missing (e.g. not-found.tsx, deleting favicon.ico, JSON-LD), and fix errors.

YOUR SCOPE: method page, error page and site metadata files. Create src/app/method/page.tsx (server), src/app/not-found.tsx, src/app/icon.svg (a static guilloche-rosette favicon in the paper colour #ece5d3 on #0a0f1c, small and crisp), delete src/app/favicon.ico (so icon.svg is used), src/app/sitemap.ts, src/app/robots.ts, src/app/opengraph-image.tsx (read the Next 16 docs in node_modules/next/dist/docs for opengraph-image/ImageResponse; render a 1200×630 dark card with the title "Four economies, three years, one question: who is actually better off?" and four colour bars; avoid custom font fetching), and components under src/components/method/ if needed. You may invoke the searchfit-seo skills (e.g. searchfit-seo:schema-markup or searchfit-seo:on-page-seo) via the Skill tool for SEO guidance if available; keep the output practical.

Method page Slides:
1. Hero [specs.text("GNI")]: h1 "Method, glossary and sources"; one-paragraph summary of what the site measures and where the data comes from (World Bank WDI API; retrieved date from META.retrieved formatted deterministically, e.g. by splitting the ISO string, not with new Date()).
2. The draw [specs.globe("BIH")]: registration 25BEC0374 ends in 74 → rank 74 on the World Bank GNI-per-capita ranking gives the anchor, Bosnia & Herzegovina; the brief asks for a second country within ±20 ranks; three sat in that band (Seychelles, Maldives, Viet Nam) and all three were kept as comparators — one anchor against three mirrors separates what is specific to Bosnia from what is common to small, open, import-dependent economies. A simple visual of a ±20 band (54 ← 74 → 94) without inventing the comparators' exact ranks.
3. Three measures [specs.text("PPP")]: glossary cards for GDP, GNI, GNI per head, the Atlas method (three-year smoothed exchange rate), purchasing power parity — plain definitions (the deck's wording: GDP is what is produced inside the borders whoever owns it; GNI is what residents earn wherever produced = GDP plus net primary income from abroad; etc.).
4. Glossary [specs.coins()]: currency board, conventional peg, free float, managed crawl / administered prices, CPI inflation and deflation, primary vs secondary income (remittances), log points, real vs nominal, income groups (World Bank thresholds, with the deck's footnote that on 1 July 2026 Viet Nam crossed into upper-middle income at $4,970 against a $4,636 threshold).
5. Indicators [specs.globe(null), align center, dim 0.4]: a table generated from INDICATORS listing every indicator's key code, name and unit (unitLabel), plus which countries have data for the latest year (from series()). Wide container OK.
6. Data notes [specs.text("2024")]: META.notes; Seychelles population series break 2021→2022 (2022 census); Atlas US$ vs local CPI caveat; the verdict's window choice (deck framing compares income growth 2022→2024 with three years of inflation 2022–2024; a like-for-like 2021→2024 comparison is shown on the Compare page); World Bank 2025 values exist for several series and are shown as the newest year but the analysis window remains 2022–2024 as in the deck.
7. Sources [specs.globe(null)]: the deck's source list — World Bank indicators (NY.GNP.ATLS.CD, NY.GNP.PCAP.CD, NY.GNP.PCAP.PP.CD, NY.GNP.MKTP.CD / NY.GDP.MKTP.CD, FP.CPI.TOTL.ZG, SP.POP.TOTL); events and policy: European Commission and European Council accession decisions (2022, March 2024); Central Bank of Bosnia and Herzegovina on the currency board; Central Bank of Seychelles and Seychelles Nation (2023) on the rupee and arrivals; State Bank of Viet Nam and General Statistics Office (January 2025); Maldives Ministry of Finance on the 2023 tax changes and Maldives Monetary Authority on reserves; East Asia Forum (May 2024) on India–Maldives tourism; World Bank income classifications (July 2026 update). Credits: Harsh · 25BEC0374 · BAHUM107 Macroeconomics, B.Tech ECE, VIT Vellore.
Add JSON-LD (schema.org Dataset) describing the data used, rendered via a <script type="application/ld+json"> in the method page. not-found.tsx: a short, on-brand 404 with a TLink home (no Slide needed but may use one with specs.text("404")). sitemap.ts: /, /compare, /method and the four /countries/<slug> URLs using metadataBase https://four-economies.vercel.app. robots.ts: allow all, reference the sitemap.`,
  },
]

const REVIEW = (t) => `
${SHARED}

You are an independent, skeptical REVIEWER for the "${t.key}" page group, which another agent just built. The original brief is below. Your job: find and FIX real defects in that agent's files (not elsewhere unless trivially necessary for compilation — report any shared-file change).

Check, in this order:
1. Run \`npx tsc --noEmit -p .\` and \`npx eslint src/app src/components src/lib\` (from ${ROOT}). Fix every error in this page group's files.
2. Server/client boundary: any function passed from a server component to a client component (e.g. format callbacks, onClick handlers in server files), hooks used in files without "use client", browser APIs at module scope in server-rendered code, Date.now()/new Date()/Math.random() in server components. Fix them.
3. Brief coverage: every section listed in the brief exists, in order, as a Slide with the specified spec; nothing silently omitted. Implement anything missing.
4. Data integrity: every World Bank number is computed from src/lib/data.ts (no hard-coded WDI values); null handling never prints "NaN", "undefined" or "Infinity"; claims in copy match the computed values (spot-check a few by running small node scripts against src/data/wb.json); caveats are accurate.
5. Chart rules and accessibility from the shared rules (legends, table views, one h1, labelled controls, aria-pressed/aria-sort where relevant, keyboard reachability).
6. Layout sanity: content constrained to the left column on lg for narrative slides; no obvious overflow on narrow screens (e.g. wide tables wrapped in overflow-x-auto containers with data-lenis-prevent).
Do NOT run npm run build or next dev. Final answer: a concise list of defects found and fixed, and any remaining issues or shared-file changes needed.

ORIGINAL BRIEF:
${t.brief}`

const results = await pipeline(
  TASKS,
  (t) => agent(`${SHARED}\n${t.brief}`, { label: `build:${t.key}`, phase: 'Build', model: 'sonnet' }),
  (built, t) => agent(`${REVIEW(t)}\n\nBUILDER'S REPORT:\n${built}`, { label: `review:${t.key}`, phase: 'Review', model: 'sonnet' }).then((rev) => ({ key: t.key, built, rev })),
)
return results.filter(Boolean).map((r) => `## ${r.key}\n### Builder\n${r.built}\n### Reviewer\n${r.rev}`).join('\n\n')
