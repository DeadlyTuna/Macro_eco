// Pure helpers for the country pages. Server-side only by convention: they touch
// the full World Bank dataset, which should never ship to the browser.
import { INDICATORS, latest, points, val, type IndicatorKey, type Region } from "@/lib/data";
import type { TableData } from "@/components/charts/ChartFrame";
import type { LineSeries } from "@/components/charts/LineChart";

export type Pt = { year: number; value: number };

/** Series colours: the World benchmark is grey and dashed, a second series is banknote paper. */
export const WORLD = "var(--color-world)";
export const PAPER = "var(--color-paper)";

/** A chart series built from the World Bank file; `from`/`to` default to the whole series. */
export function lineOf(region: Region, key: IndicatorKey, label: string, color: string, o: { from?: number; to?: number; dashed?: boolean } = {}): LineSeries {
  return { id: `${region}-${key}`, label, color, dashed: o.dashed, data: points(region, key, o.from, o.to) };
}

/** "Source: World Bank, WDI (NY.GNP.PCAP.CD, …)" for a chart footer. */
export const source = (...keys: IndicatorKey[]) => `Source: World Bank, World Development Indicators (${keys.map((k) => INDICATORS[k].code).join(", ")})`;

/** "2006–2024" for a series, or an empty string. */
export const span = (d: Pt[]) => (d.length ? `${d[0].year}–${d[d.length - 1].year}` : "");

/** Possessive of a short country name: Bosnia’s, Seychelles’. */
export const poss = (s: string) => (s.endsWith("s") ? `${s}’` : `${s}’s`);

/** Capitalise the first letter. */
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ORDINALS = ["first", "second", "third", "fourth"];
export const ordinal = (n: number) => ORDINALS[n - 1] ?? `${n}th`;

/** One row per year, one column per series; missing cells read "—". */
export function yearTable(cols: { label: string; data: Pt[]; fmt?: (v: number) => string }[], fmt: (v: number) => string): TableData {
  const years = [...new Set(cols.flatMap((c) => c.data.map((d) => d.year)))].sort((a, b) => a - b);
  return {
    columns: ["Year", ...cols.map((c) => c.label)],
    rows: years.map((y) => [
      String(y),
      ...cols.map((c) => {
        const d = c.data.find((p) => p.year === y);
        return d ? (c.fmt ?? fmt)(d.value) : "—";
      }),
    ]),
  };
}

/** The value for `year`, or the latest year that has one (with that year). */
export function at(region: Region, key: IndicatorKey, year: number): Pt | null {
  const x = val(region, key, year);
  return x != null ? { year, value: x } : latest(region, key);
}

/** Highest value in a series and the year it occurred. */
export function peak(data: Pt[]): Pt | null {
  return data.reduce<Pt | null>((m, d) => (m == null || d.value > m.value ? d : m), null);
}

/** Runs of at least `minLen` consecutive years that stay within `tol` of the run's first value. */
export function plateaus(data: Pt[], tol = 0.01, minLen = 3) {
  const out: { from: number; to: number; lo: number; hi: number }[] = [];
  let s = 0;
  for (let i = 1; i <= data.length; i++) {
    if (i === data.length || Math.abs(data[i].value / data[s].value - 1) > tol) {
      if (i - s >= minLen) {
        const run = data.slice(s, i).map((d) => d.value);
        out.push({ from: data[s].year, to: data[i - 1].year, lo: Math.min(...run), hi: Math.max(...run) });
      }
      s = i;
    }
  }
  return out;
}

// ── Dates ("2024", "2024-03", "2024-03-21") without Date objects ─────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseDate(s: string) {
  const m = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?/.exec(s.trim());
  if (!m) return null;
  const mo = m[2] ? Number(m[2]) : null;
  const d = m[3] ? Number(m[3]) : null;
  return { y: Number(m[1]), m: mo && mo >= 1 && mo <= 12 ? mo : null, d: d && d >= 1 && d <= 31 ? d : null };
}

export function dateLabel(s: string) {
  const p = parseDate(s);
  if (!p) return s;
  if (p.m == null) return String(p.y);
  return `${p.d != null ? `${p.d} ` : ""}${MONTHS[p.m - 1]} ${p.y}`;
}

/** A machine-readable value for <time dateTime>. */
export function dateTime(s: string) {
  const p = parseDate(s);
  if (!p) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return p.m == null ? String(p.y) : p.d == null ? `${p.y}-${pad(p.m)}` : `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

/** Sort key: a year-only date sits after the dated events of that year. */
export function dateKey(s: string) {
  const p = parseDate(s);
  if (!p) return Number.MAX_SAFE_INTEGER;
  return p.y * 10000 + (p.m ?? 13) * 100 + (p.d ?? 0);
}

/** Position on the 2022-01 … 2024-12 helix, clamped to [0, 1]. Year-only dates sit mid-year. */
export function windowU(s: string) {
  const p = parseDate(s);
  if (!p) return 1;
  const months = (p.y - 2022) * 12 + ((p.m ?? 7) - 1) + ((p.d ?? 1) - 1) / 31;
  return Math.min(1, Math.max(0, months / 36));
}
