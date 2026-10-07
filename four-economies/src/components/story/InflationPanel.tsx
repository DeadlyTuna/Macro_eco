"use client";

import { useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { LineChart, type LineSeries } from "@/components/charts/LineChart";
import { COUNTRIES, ORDER } from "@/lib/countries";
import { points, YEARS, val, type Region } from "@/lib/data";
import { pct } from "@/lib/format";

const RANGES = [
  { id: "deck", label: "2022–24", from: 2022, to: 2024 },
  { id: "decade", label: "2015–25", from: 2015, to: 2025 },
  { id: "all", label: "2000–25", from: 2000, to: 2025 },
] as const;

export function InflationPanel() {
  const [r, setR] = useState<(typeof RANGES)[number]>(RANGES[0]);
  const series: LineSeries[] = [
    ...ORDER.map((i) => ({ id: i, label: COUNTRIES[i].short, color: COUNTRIES[i].color, data: points(i, "cpi", r.from, r.to) })),
    { id: "WLD", label: "World", color: "var(--color-world)", dashed: true, data: points("WLD", "cpi", r.from, r.to) },
  ];
  const yrs = YEARS.filter((y) => y >= r.from && y <= r.to);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Time range">
        {RANGES.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={x.id === r.id}
            onClick={() => setR(x)}
            className={`eyebrow rounded-full border px-3 py-1.5 transition-colors ${x.id === r.id ? "border-paper bg-paper text-ink" : "border-rule text-paper-2 hover:text-paper"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <ChartFrame
        title="Inflation, consumer prices"
        subtitle="Annual %, with the world for reference"
        legend={series.map((s) => ({ label: s.label, color: s.color, dashed: s.dashed }))}
        table={{ columns: ["Year", ...series.map((s) => s.label)], rows: yrs.map((y) => [y, ...series.map((s) => pct(val(s.id as Region, "cpi", y), 2))]) }}
        source="Source: World Bank (FP.CPI.TOTL.ZG). Bosnia 2024 from the same series as republished by Trading Economics."
      >
        <LineChart key={r.id} series={series} format="pct" zero window={r.id === "deck" ? undefined : [2022, 2024]} height={290} />
      </ChartFrame>
    </div>
  );
}
