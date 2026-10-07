import type { Iso } from "./data";

export type Country = {
  iso: Iso;
  iso2: string;
  slug: string;
  name: string;
  short: string;
  local: { text: string; script?: "thaana"; alt?: string };
  color: string;
  glow: [number, number, number];
  centroid: [number, number];
  capital: string;
  languages: string;
  currency: { name: string; code: string };
  regime: string;
  regimeShort: string;
  centralBank: string;
  incomeGroup: string;
  artifact: { name: string; caption: string };
  thesis: string;
  story: {
    title: string;
    points: { lead: string; body: string }[];
    figure: { label: string; value: string; note: string };
    sources: string;
  };
  leftOut: string;
  events: { date: string; text: string }[];
};

export const COUNTRIES: Record<Iso, Country> = {
  BIH: {
    iso: "BIH",
    iso2: "BA",
    slug: "bosnia-and-herzegovina",
    name: "Bosnia & Herzegovina",
    short: "Bosnia",
    local: { text: "Bosna i Hercegovina", alt: "Босна и Херцеговина" },
    color: "#c98422",
    glow: [1.0, 0.66, 0.24],
    centroid: [44.2, 17.8],
    capital: "Sarajevo",
    languages: "Bosnian, Croatian, Serbian",
    currency: { name: "Convertible mark", code: "BAM" },
    regime: "Currency board — €1 = KM 1.95583, fixed since 1997",
    regimeShort: "Currency board",
    centralBank: "Central Bank of Bosnia and Herzegovina",
    incomeGroup: "Upper-middle income",
    artifact: { name: "Stari Most, Mostar", caption: "The Old Bridge, rebuilt in 2004 after its destruction in 1993." },
    thesis: "A currency board that imported the whole shock, and an income per head that rises partly because people leave.",
    story: {
      title: "Why Bosnia took the full hit",
      points: [
        { lead: "A currency board since 1997.", body: "One euro is fixed at 1.95583 marks. The central bank cannot set interest rates — it imports the ECB's stance and is left with reserve requirements." },
        { lead: "Imports its energy and its wheat.", body: "Russia's invasion of Ukraine in February 2022 passed straight through to food and fuel." },
        { lead: "The answer was fiscal, not monetary.", body: "Entity-level caps on retail margins for basic foods, excise relief, and electricity prices held down by domestic lignite and hydro." },
        { lead: "Politics pulled both ways.", body: "EU candidate status in December 2022 and agreement to open accession talks on 21 March 2024, against secession rhetoric from Republika Srpska and repeated budget deadlock." },
      ],
      figure: { label: "Inflation, 2022 → 2024", value: "14.02% → 1.69%", note: "Brought under control in two years — but the price level is permanently 23% higher." },
      sources: "Inflation: World Bank. Events: European Council, March 2024; Central Bank of Bosnia and Herzegovina.",
    },
    leftOut:
      "The Dayton settlement gives the country two entities and a three-member presidency. Reform needs a consensus that rarely arrives — so emigration has become economic policy by default.",
    events: [
      { date: "2022-02", text: "Russia invades Ukraine. Energy and grain prices jump; Bosnian inflation reaches 14.0% for the year." },
      { date: "2022-12", text: "The EU grants Bosnia & Herzegovina candidate status." },
      { date: "2024-03-21", text: "The European Council agrees to open accession talks." },
      { date: "2024", text: "Inflation falls to 1.69%." },
    ],
  },
  SYC: {
    iso: "SYC",
    iso2: "SC",
    slug: "seychelles",
    name: "Seychelles",
    short: "Seychelles",
    local: { text: "Repiblik Sesel" },
    color: "#1e9c8f",
    glow: [0.2, 0.86, 0.76],
    centroid: [-4.68, 55.48],
    capital: "Victoria",
    languages: "Seychellois Creole, English, French",
    currency: { name: "Seychelles rupee", code: "SCR" },
    regime: "Free float since the November 2008 reform",
    regimeShort: "Floating rupee",
    centralBank: "Central Bank of Seychelles",
    incomeGroup: "High income",
    artifact: { name: "Coco de mer", caption: "The double coconut of the Vallée de Mai — the heaviest seed in the plant kingdom." },
    thesis: "A floating rupee that turned a tourism rebound into falling prices.",
    story: {
      title: "Why Seychelles had deflation",
      points: [
        { lead: "A floating rupee since the 2008 reform.", body: "Tourism is about two-thirds of the economy, so returning visitors flood the islands with foreign exchange and the rupee appreciates." },
        { lead: "Roughly 90% of what it consumes is imported.", body: "A stronger rupee therefore cuts almost every price at once. Here the exchange rate is monetary policy." },
        { lead: "The central bank barely moved.", body: "The policy rate stayed at 2% through 2023, with a single quarter-point cut to 1.75% in 2024. By mid-2023 electricity was down 1.4% and transport down 4.7% year on year." },
        { lead: "It did not close to Russian visitors.", body: "A record 27,000-plus arrived in 2023 on Aeroflot, replacing lost Western European demand. In December 2023 an explosion and flash floods forced a state of emergency." },
      ],
      figure: { label: "Inflation in 2023", value: "−1.04%", note: "The only deflation in the group, and the only country whose people clearly gained." },
      sources: "Inflation: World Bank. Events: Central Bank of Seychelles; Seychelles Nation, 2023.",
    },
    leftOut:
      "A Creole blue-economy identity, with 30% of its waters protected and a pioneering debt-for-nature swap. Tuna and tourism are the only two pillars it has.",
    events: [
      { date: "2023", text: "The rupee appreciates on the tourism rebound; prices fall 1.04% over the year." },
      { date: "2023", text: "A record 27,000-plus Russian visitors arrive, many on Aeroflot." },
      { date: "2023-12-07", text: "An explosion at Providence and flash floods force a state of emergency." },
    ],
  },
  VNM: {
    iso: "VNM",
    iso2: "VN",
    slug: "viet-nam",
    name: "Viet Nam",
    short: "Viet Nam",
    local: { text: "Việt Nam" },
    color: "#5a8bec",
    glow: [0.45, 0.62, 1.0],
    centroid: [16.0, 107.0],
    capital: "Hanoi",
    languages: "Vietnamese",
    currency: { name: "Đồng", code: "VND" },
    regime: "Managed crawl around a daily central rate set by the State Bank",
    regimeShort: "Administered target",
    centralBank: "State Bank of Viet Nam",
    incomeGroup: "Lower-middle income (upper-middle from July 2026)",
    artifact: { name: "Lotus", caption: "Nelumbo nucifera, the flower most often named as Viet Nam's national symbol." },
    thesis: "An inflation ceiling written into law, met by administered prices — while output grew by 7%.",
    story: {
      title: "Why Viet Nam barely moved",
      points: [
        { lead: "A 4% ceiling set by the National Assembly each year", body: "and treated as a hard political commitment, not a forecast." },
        { lead: "Administered prices do the work.", body: "Electricity, fuel, tuition and health tariffs rise on a deliberate schedule; a fuel price stabilisation fund and a cut to the environmental protection tax absorbed the 2022 spike." },
        { lead: "VAT cut from 10% to 8% in 2022", body: "and extended repeatedly — supporting demand without adding to prices." },
        { lead: "Rates up, then down.", body: "The State Bank hiked twice in late 2022 after the Van Thinh Phat bank run, then cut four times through 2023. Meanwhile “China plus one” relocation and new strategic partnerships with the US and Japan kept investment flowing." },
      ],
      figure: { label: "Inflation, 2022 → 2024", value: "3.16% → 3.62%", note: "Under the ceiling every year, while GDP still grew 7.09% in 2024 (GSO)." },
      sources: "Inflation: World Bank. Events: State Bank of Viet Nam; General Statistics Office, January 2025.",
    },
    leftOut:
      "Đổi Mới opened a party-led market economy in 1986. A young workforce and a state that can hold an industrial policy for decades — and suppress prices when it wants to.",
    events: [
      { date: "2022-10", text: "Van Thinh Phat collapse sets off a bank run; the State Bank hikes twice." },
      { date: "2023-09", text: "Four rate cuts through 2023; a comprehensive strategic partnership with the United States." },
      { date: "2024-09", text: "Typhoon Yagi, the costliest on record in Viet Nam; GDP still grows 7.09%." },
      { date: "2026-07-01", text: "The World Bank reclassifies Viet Nam as upper-middle income: $4,970 per head against a $4,636 threshold." },
    ],
  },
  MDV: {
    iso: "MDV",
    iso2: "MV",
    slug: "maldives",
    name: "Maldives",
    short: "Maldives",
    local: { text: "ދިވެހިރާއްޖެ", script: "thaana", alt: "Dhivehi Raajje" },
    color: "#d2558e",
    glow: [0.96, 0.42, 0.68],
    centroid: [3.2, 73.2],
    capital: "Malé",
    languages: "Dhivehi",
    currency: { name: "Rufiyaa", code: "MVR" },
    regime: "Peg to the US dollar inside a narrow band",
    regimeShort: "Peg + subsidies",
    centralBank: "Maldives Monetary Authority",
    incomeGroup: "Upper-middle income",
    artifact: { name: "Atoll", caption: "A ring of coral islands around a lagoon — the Maldives is 26 of them." },
    thesis: "Calm prices bought with subsidies, and paid for in reserves.",
    story: {
      title: "Why the Maldives only looks calm",
      points: [
        { lead: "The rufiyaa is pegged in a narrow band to the US dollar,", body: "so imported prices stay stable in local money." },
        { lead: "The 2022 fuel shock never reached households.", body: "Blanket subsidies on staple food, electricity and fuel moved it onto the budget instead of into the price index." },
        { lead: "Taxes rose anyway.", body: "GST went 6%→8% and tourism GST 12%→16% on 1 January 2023, worth about $194m a year — yet CPI stayed near 2.9%, because tourists pay most of it." },
        { lead: "The bill arrived elsewhere.", body: "Reserves fell sharply through 2024 and ratings were cut, until a $400m currency swap from India in October 2024 steadied them." },
      ],
      figure: { label: "Inflation in 2024", value: "1.41%", note: "Low inflation here is a fiscal choice, not price stability." },
      sources: "Inflation: World Bank. Events: Maldives Ministry of Finance; Maldives Monetary Authority; East Asia Forum, May 2024.",
    },
    leftOut:
      "One island, one resort. Tourism is physically separated from society — alcohol is legal only on resort islands — so the local multiplier is thin and income concentrates in Malé.",
    events: [
      { date: "2022", text: "Fuel-subsidy costs overshoot the budget as oil spikes." },
      { date: "2023-01-01", text: "GST rises to 8% and tourism GST to 16%." },
      { date: "2023-11", text: "Mohamed Muizzu wins the presidency on an “India Out” platform." },
      { date: "2024-05", text: "Indian personnel leave; Indian arrivals are down about a third after the January row." },
      { date: "2024-10", text: "India provides a $400m currency swap as reserves run low." },
    ],
  },
};

export const ORDER: Iso[] = ["BIH", "SYC", "VNM", "MDV"];
export const bySlug = (slug: string) => ORDER.map((i) => COUNTRIES[i]).find((c) => c.slug === slug);
export const colorOf = (iso: string) => (COUNTRIES as Record<string, Country>)[iso]?.color ?? "var(--color-world)";
