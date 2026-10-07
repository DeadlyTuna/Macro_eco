import wb from "@/data/wb.json";

export type Iso = "BIH" | "SYC" | "VNM" | "MDV";
export type Region = Iso | "WLD" | "UMC";
export type IndicatorKey = keyof typeof wb.indicators;
export type Unit = "usd" | "intl" | "pct" | "pctgdp" | "pctgni" | "index" | "people" | "lcu" | "months" | "years" | "perkm2" | "km2";

export const ISOS: Iso[] = ["BIH", "SYC", "VNM", "MDV"];
export const YEARS: number[] = wb.years;
export const FIRST_YEAR = YEARS[0];
export const WINDOW = [2022, 2023, 2024] as const;
export const META = wb.meta;

type Series = (number | null)[];
const DATA = wb.data as unknown as Record<Region, Record<IndicatorKey, Series>>;

export const INDICATORS = wb.indicators as Record<IndicatorKey, { code: string; name: string; unit: Unit }>;

export function series(region: Region, key: IndicatorKey): Series {
  return DATA[region]?.[key] ?? YEARS.map(() => null);
}

export function val(region: Region, key: IndicatorKey, year: number): number | null {
  return series(region, key)[year - FIRST_YEAR] ?? null;
}

/** Same as val() but never null — for figures the deck quotes, which all exist. */
export function v(region: Region, key: IndicatorKey, year: number): number {
  return val(region, key, year) ?? NaN;
}

export function latest(region: Region, key: IndicatorKey): { year: number; value: number } | null {
  const s = series(region, key);
  for (let i = s.length - 1; i >= 0; i--) if (s[i] != null) return { year: YEARS[i], value: s[i] as number };
  return null;
}

export function points(region: Region, key: IndicatorKey, from = FIRST_YEAR, to = YEARS[YEARS.length - 1]) {
  return YEARS.map((y, i) => ({ year: y, value: series(region, key)[i] }))
    .filter((p): p is { year: number; value: number } => p.value != null && p.year >= from && p.year <= to);
}

export const change = (a: number, b: number) => (b / a - 1) * 100;
export const logPoints = (a: number, b: number) => Math.log(b / a) * 100;

/** Cumulative price-level change from the end of `from - 1` through `to`, compounding annual CPI inflation. */
export function priceChange(region: Region, from: number, to: number) {
  let f = 1;
  for (let y = from; y <= to; y++) f *= 1 + (val(region, "cpi", y) ?? 0) / 100;
  return (f - 1) * 100;
}

/**
 * The deck's living-standards verdict: GNI per head 2022→2024 against prices over
 * the three window years. `base` lets the reader re-run it like-for-like.
 */
export function verdict(iso: Iso, mode: "deck" | "matched" | "twoYear") {
  const incomeFrom = mode === "matched" ? 2021 : 2022;
  const priceFrom = mode === "twoYear" ? 2023 : 2022;
  const income = change(v(iso, "gniPc", incomeFrom), v(iso, "gniPc", 2024));
  const prices = priceChange(iso, priceFrom, 2024);
  const real = ((1 + income / 100) / (1 + prices / 100) - 1) * 100;
  return { income, prices, real, incomeFrom, priceFrom };
}

/** Share of GDP kept as national income (GNI / GDP, current US$). */
export function keptShare(iso: Iso, year = 2024) {
  return (v(iso, "gni", year) / v(iso, "gdp", year)) * 100;
}

export function rankOf(iso: Iso, key: IndicatorKey, year: number, desc = true) {
  const sorted = [...ISOS].sort((a, b) => ((val(b, key, year) ?? -Infinity) - (val(a, key, year) ?? -Infinity)) * (desc ? 1 : -1));
  return sorted.indexOf(iso) + 1;
}
