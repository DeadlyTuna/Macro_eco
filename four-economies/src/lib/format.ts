import type { Unit } from "./data";

const nf = (d: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

export function usd(v: number | null | undefined, opts: { digits?: number; intl?: boolean } = {}) {
  if (v == null || Number.isNaN(v)) return "—";
  const sym = opts.intl ? "Int$" : "$";
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e12) return `${sign}${sym}${nf(opts.digits ?? 2).format(a / 1e12)}tn`;
  if (a >= 1e9) return `${sign}${sym}${nf(opts.digits ?? 1).format(a / 1e9)}bn`;
  if (a >= 1e6) return `${sign}${sym}${nf(opts.digits ?? 0).format(a / 1e6)}m`;
  return `${sign}${sym}${nf(opts.digits ?? 0).format(a)}`;
}

export function pct(v: number | null | undefined, digits = 1, signed = false) {
  if (v == null || Number.isNaN(v)) return "—";
  const s = nf(digits).format(Math.abs(v));
  const sign = v < 0 ? "−" : signed && v > 0 ? "+" : "";
  return `${sign}${s}%`;
}

export function people(v: number | null | undefined) {
  if (v == null || Number.isNaN(v)) return "—";
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e6) return `${sign}${nf(a >= 1e8 ? 1 : 2).format(a / 1e6)}m`;
  return `${sign}${nf(0).format(a)}`;
}

export function num(v: number | null | undefined, digits = 0) {
  if (v == null || Number.isNaN(v)) return "—";
  return (v < 0 ? "−" : "") + nf(digits).format(Math.abs(v));
}

export function byUnit(v: number | null | undefined, unit: Unit) {
  switch (unit) {
    case "usd":
      return usd(v);
    case "intl":
      return usd(v, { intl: true });
    case "pct":
    case "pctgdp":
    case "pctgni":
      return pct(v, 1);
    case "people":
      return people(v);
    case "months":
      return v == null ? "—" : `${num(v, 1)} mo`;
    case "years":
      return v == null ? "—" : `${num(v, 1)} yrs`;
    case "km2":
      return v == null ? "—" : `${num(v)} km²`;
    case "lcu":
      return num(v, v != null && Math.abs(v) < 100 ? 2 : 0);
    default:
      return num(v, 1);
  }
}

export const unitLabel: Record<Unit, string> = {
  usd: "current US$",
  intl: "current international $",
  pct: "%",
  pctgdp: "% of GDP",
  pctgni: "% of GNI",
  index: "index",
  people: "people",
  lcu: "local currency per US$",
  months: "months of imports",
  years: "years",
  perkm2: "people per km²",
  km2: "km²",
};

export type FormatKey = "usd" | "intl" | "pct" | "pct0" | "pct2" | "pctSigned" | "people" | "num" | "num1" | "lcu" | "years" | "months";

export function formatter(k: FormatKey): (v: number) => string {
  switch (k) {
    case "usd":
      return (v) => usd(v);
    case "intl":
      return (v) => usd(v, { intl: true });
    case "pct":
      return (v) => pct(v, 1);
    case "pct0":
      return (v) => pct(v, 0);
    case "pct2":
      return (v) => pct(v, 2);
    case "pctSigned":
      return (v) => pct(v, 1, true);
    case "people":
      return (v) => people(v);
    case "num1":
      return (v) => num(v, 1);
    case "lcu":
      return (v) => num(v, Math.abs(v) < 100 ? 2 : 0);
    case "years":
      return (v) => `${num(v, 1)}`;
    case "months":
      return (v) => `${num(v, 1)}`;
    default:
      return (v) => num(v);
  }
}

export const unitFormat: Record<Unit, FormatKey> = {
  usd: "usd",
  intl: "intl",
  pct: "pct",
  pctgdp: "pct",
  pctgni: "pct",
  index: "num1",
  people: "people",
  lcu: "lcu",
  months: "months",
  years: "years",
  perkm2: "num",
  km2: "num",
};
