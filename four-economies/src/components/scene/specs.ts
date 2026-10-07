// Data → formation specs. Pages ask for a named view; this computes its geometry inputs.
import type { Spec } from "./formations";
import { ISOS, v, val, keptShare, verdict, series, YEARS, type Iso } from "@/lib/data";
import { usd, pct, people } from "@/lib/format";

const Y = 2024;
const norm = (xs: number[]) => {
  const m = Math.max(...xs);
  return xs.map((x) => x / m);
};

export const specs = {
  globe: (focus?: Iso | null): Spec => ({ kind: "globe", focus: focus ?? null }),
  population: (): Spec => ({
    kind: "spheres",
    values: ISOS.map((i) => v(i, "pop", Y)),
    labels: ISOS.map((i) => people(v(i, "pop", Y))),
  }),
  gniLog: (): Spec => {
    // log scale from $1bn, as on the deck's slide
    const raw = ISOS.map((i) => Math.log10(v(i, "gniAtlas", Y) / 1e9));
    return { kind: "bars", values: raw.map((x) => x / 2.8), labels: ISOS.map((i) => usd(v(i, "gniAtlas", Y))) };
  },
  gniPc: (highlight?: Iso | null): Spec => ({
    kind: "bars",
    values: norm(ISOS.map((i) => v(i, "gniPc", Y))),
    labels: ISOS.map((i) => usd(v(i, "gniPc", Y))),
    highlight: highlight ?? null,
  }),
  indicatorBars: (key: Parameters<typeof v>[1], year: number, fmt: (x: number | null) => string, highlight?: Iso | null): Spec => {
    const xs = ISOS.map((i) => val(i, key, year) ?? 0);
    const min = Math.min(0, ...xs);
    const span = Math.max(...xs) - min || 1;
    return { kind: "bars", values: xs.map((x) => (x - min) / span), labels: ISOS.map((i) => fmt(val(i, key, year))), highlight: highlight ?? null };
  },
  ppp: (): Spec => {
    const a = ISOS.map((i) => v(i, "gniPc", Y));
    const b = ISOS.map((i) => v(i, "gniPcPpp", Y));
    const m = Math.max(...b);
    return { kind: "pairs", a: a.map((x) => x / m), b: b.map((x) => x / m), labels: ISOS.map((i, k) => [usd(a[k]), usd(b[k])] as [string, string]) };
  },
  emigration: (iso: Iso = "BIH"): Spec => {
    const p0 = v(iso, "pop", 2000);
    const p1 = v(iso, "pop", Y);
    const ch = (p1 / p0 - 1) * 100;
    let mig = 0;
    for (let y = 2000; y <= Y; y++) mig += val(iso, "netMigration", y) ?? 0;
    const flow = iso === "BIH" ? ch / 100 : Math.max(-0.4, Math.min(0.4, (mig / p1) * 4));
    const label = iso === "BIH" ? `${pct(ch, 0, true)} residents since 2000` : `${mig < 0 ? "Net emigration" : "Net immigration"} since 2000: ${people(Math.abs(mig))}`;
    return { kind: "crowd", iso, flow, label };
  },
  leak: (only?: Iso): Spec => ({
    kind: "rings",
    kept: ISOS.map((i) => keptShare(i)),
    labels: ISOS.map((i) => `${pct(keptShare(i), 1)} kept`),
    only,
  }),
  inflation: (isos: Iso[] = ISOS, years = [2020, 2021, 2022, 2023, 2024]): Spec => ({
    kind: "ribbons",
    series: isos.map((i) => years.map((y) => val(i, "cpi", y) ?? 0)),
    isos,
    years,
    labels: isos.map((i) => pct(val(i, "cpi", years[years.length - 1]), 2, true)),
  }),
  coins: (only?: Iso): Spec => ({ kind: "coins", only }),
  sculpture: (iso: Iso): Spec => ({ kind: "sculpture", iso }),
  rosette: (iso: Iso): Spec => {
    const yrs = [2022, 2023, 2024];
    const max = Math.max(...ISOS.flatMap((i) => yrs.map((y) => v(i, "gniPc", y))));
    return {
      kind: "rosette",
      iso,
      radii: yrs.map((y) => v(iso, "gniPc", y) / max),
      amps: yrs.map((y) => Math.abs(v(iso, "cpi", y))),
      petals: Math.max(3, Math.round(v(iso, "gniPc", Y) / 1000)),
    };
  },
  helix: (beads: { u: number; iso: Iso }[]): Spec => ({ kind: "helix", beads }),
  verdict: (iso: Iso = "BIH", mode: "deck" | "matched" | "twoYear" = "deck"): Spec => {
    const r = verdict(iso, mode);
    return { kind: "scale", iso, left: r.income, right: r.prices, labels: [pct(r.income, 1, true), pct(r.prices, 1, true)] };
  },
  sectors: (iso: Iso): Spec => {
    const sh = (["agriPct", "industryPct", "servicesPct"] as const).map((k) => val(iso, k, Y) ?? 0);
    return { kind: "stack", iso, shares: sh, labels: [`Agriculture ${pct(sh[0], 0)}`, `Industry ${pct(sh[1], 0)}`, `Services ${pct(sh[2], 0)}`] };
  },
  text: (text: string, iso?: Iso | null): Spec => ({ kind: "text", text, iso: iso ?? null }),
};

export const lastYear = (iso: Iso, key: Parameters<typeof series>[1]) => {
  const s = series(iso, key);
  for (let i = s.length - 1; i >= 0; i--) if (s[i] != null) return YEARS[i];
  return Y;
};
