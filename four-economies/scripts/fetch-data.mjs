// Pulls every indicator the site uses from the World Bank WDI API and writes
// a compact, year-aligned JSON file to src/data/wb.json.
// Run: npm run data
import { writeFile, mkdir } from "node:fs/promises";

const COUNTRIES = ["BIH", "SYC", "VNM", "MDV", "WLD", "UMC"];
const FIRST = 2000;
const LAST = 2025;

// key -> [WDI code, unit]
const INDICATORS = {
  gniAtlas: ["NY.GNP.ATLS.CD", "usd"],
  gniPc: ["NY.GNP.PCAP.CD", "usd"],
  gniPcPpp: ["NY.GNP.PCAP.PP.CD", "intl"],
  gni: ["NY.GNP.MKTP.CD", "usd"],
  gdp: ["NY.GDP.MKTP.CD", "usd"],
  gdpPc: ["NY.GDP.PCAP.CD", "usd"],
  gdpGrowth: ["NY.GDP.MKTP.KD.ZG", "pct"],
  gdpPcGrowth: ["NY.GDP.PCAP.KD.ZG", "pct"],
  cpi: ["FP.CPI.TOTL.ZG", "pct"],
  cpiIndex: ["FP.CPI.TOTL", "index"],
  deflator: ["NY.GDP.DEFL.KD.ZG", "pct"],
  pop: ["SP.POP.TOTL", "people"],
  popGrowth: ["SP.POP.GROW", "pct"],
  netMigration: ["SM.POP.NETM", "people"],
  remitPct: ["BX.TRF.PWKR.DT.GD.ZS", "pctgdp"],
  remitUsd: ["BX.TRF.PWKR.CD.DT", "usd"],
  netPrimary: ["NY.GSR.NFCY.CD", "usd"],
  exportsPct: ["NE.EXP.GNFS.ZS", "pctgdp"],
  importsPct: ["NE.IMP.GNFS.ZS", "pctgdp"],
  tradePct: ["NE.TRD.GNFS.ZS", "pctgdp"],
  investPct: ["NE.GDI.TOTL.ZS", "pctgdp"],
  agriPct: ["NV.AGR.TOTL.ZS", "pctgdp"],
  industryPct: ["NV.IND.TOTL.ZS", "pctgdp"],
  servicesPct: ["NV.SRV.TOTL.ZS", "pctgdp"],
  unemployment: ["SL.UEM.TOTL.ZS", "pct"],
  lifeExp: ["SP.DYN.LE00.IN", "years"],
  urbanPct: ["SP.URB.TOTL.IN.ZS", "pct"],
  internetPct: ["IT.NET.USER.ZS", "pct"],
  fx: ["PA.NUS.FCRF", "lcu"],
  reserves: ["FI.RES.TOTL.CD", "usd"],
  reservesMonths: ["FI.RES.TOTL.MO", "months"],
  currentAccount: ["BN.CAB.XOKA.GD.ZS", "pctgdp"],
  fdiPct: ["BX.KLT.DINV.WD.GD.ZS", "pctgdp"],
  arrivals: ["ST.INT.ARVL", "people"],
  tourismReceipts: ["ST.INT.RCPT.CD", "usd"],
  lendingRate: ["FR.INR.LEND", "pct"],
  govDebt: ["GC.DOD.TOTL.GD.ZS", "pctgdp"],
  extDebtGni: ["DT.DOD.DECT.GN.ZS", "pctgni"],
  gini: ["SI.POV.GINI", "index"],
  density: ["EN.POP.DNST", "perkm2"],
  landArea: ["AG.LND.TOTL.K2", "km2"],
};

const years = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);

async function get(code) {
  const url = `https://api.worldbank.org/v2/country/${COUNTRIES.join(";")}/indicator/${code}?format=json&date=${FIRST}:${LAST}&per_page=1000`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!Array.isArray(json) || !json[1]) throw new Error(JSON.stringify(json).slice(0, 200));
      return { name: json[1][0]?.indicator?.value ?? code, rows: json[1] };
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
}

const out = {
  meta: {
    source: "World Bank, World Development Indicators (api.worldbank.org/v2)",
    retrieved: new Date().toISOString().slice(0, 10),
    notes: [],
  },
  years,
  indicators: {},
  data: Object.fromEntries(COUNTRIES.map((c) => [c, {}])),
};

for (const [key, [code, unit]] of Object.entries(INDICATORS)) {
  const { name, rows } = await get(code);
  out.indicators[key] = { code, name, unit };
  for (const c of COUNTRIES) out.data[c][key] = years.map(() => null);
  for (const r of rows) {
    const c = r.countryiso3code;
    const y = Number(r.date);
    if (!out.data[c] || r.value == null) continue;
    out.data[c][key][y - FIRST] = Number(r.value);
  }
  process.stdout.write(`${key} `);
}

// The deck's footnote: Bosnia's 2024 CPI cell was empty in the API at retrieval,
// so the deck used the same World Bank series as republished by Trading Economics.
const bihCpi = out.data.BIH.cpi;
if (bihCpi[2024 - FIRST] == null) {
  bihCpi[2024 - FIRST] = 1.69;
  out.meta.notes.push("BIH 2024 CPI inflation (1.69%) patched from Trading Economics' republication of the World Bank series; the API cell was empty at retrieval.");
}

await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await writeFile(new URL("../src/data/wb.json", import.meta.url), JSON.stringify(out));
console.log("\nwrote src/data/wb.json");
