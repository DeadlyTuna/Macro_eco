"use client";

import { useMemo, useState } from "react";
import { scaleLinear, scaleLog } from "d3-scale";
import { line as d3line, curveMonotoneX } from "d3-shape";
import { Tooltip, TipRow, useInView, useWidth } from "./ChartFrame";
import { formatter, type FormatKey } from "@/lib/format";

export type LineSeries = { id: string; label: string; color: string; data: { year: number; value: number }[]; dashed?: boolean };

export function LineChart({
  series,
  format: fk,
  height = 280,
  window: win,
  log = false,
  zero = false,
  yDomain,
  endLabels = true,
}: {
  series: LineSeries[];
  format: FormatKey;
  height?: number;
  window?: [number, number];
  log?: boolean;
  zero?: boolean;
  yDomain?: [number, number];
  endLabels?: boolean;
}) {
  const format = formatter(fk);
  const [wrap, w] = useWidth<HTMLDivElement>();
  const [vis, on] = useInView<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const m = { t: 12, r: endLabels && w > 420 ? 92 : 14, b: 26, l: 48 };

  const { x, y, years, paths, ticks, labels } = useMemo(() => {
    const all = series.flatMap((s) => s.data);
    const years = [...new Set(all.map((d) => d.year))].sort((a, b) => a - b);
    const vals = all.map((d) => d.value);
    let lo = yDomain?.[0] ?? Math.min(...vals);
    const hi = yDomain?.[1] ?? Math.max(...vals);
    if (zero && !log) lo = Math.min(0, lo);
    const x = scaleLinear().domain([years[0], years[years.length - 1]]).range([m.l, Math.max(m.l + 10, w - m.r)]);
    const y = log
      ? scaleLog().domain([lo * 0.8, hi * 1.25]).range([height - m.b, m.t])
      : scaleLinear().domain([lo, hi]).nice(5).range([height - m.b, m.t]);
    const gen = d3line<{ year: number; value: number }>().x((d) => x(d.year)).y((d) => y(d.value)).curve(curveMonotoneX);
    const paths = series.map((s) => gen(s.data) ?? "");
    const ticks = log ? (y.ticks(4) as number[]).filter((t) => /^[125]/.test(String(t))).slice(0, 6) : (y.ticks(5) as number[]);
    // End labels, nudged apart so they never collide.
    const labels = series
      .map((s) => ({ s, ly: y(s.data[s.data.length - 1]?.value ?? 0) }))
      .sort((a, b) => a.ly - b.ly);
    for (let i = 1; i < labels.length; i++) if (labels[i].ly - labels[i - 1].ly < 14) labels[i].ly = labels[i - 1].ly + 14;
    return { x, y, years, paths, ticks, labels };
  }, [series, w, height, log, zero, yDomain, m.l, m.r, m.b, m.t]);

  const step = years.length > 14 ? 5 : years.length > 7 ? 2 : 1;
  const xt = years.filter((yr) => yr % step === 0 || years.length <= 7);
  const hy = hover != null ? years[hover] : null;

  const move = (clientX: number, rect: DOMRect) => {
    const yr = x.invert(clientX - rect.left);
    let best = 0;
    years.forEach((v, i) => Math.abs(v - yr) < Math.abs(years[best] - yr) && (best = i));
    setHover(best);
  };

  return (
    <div ref={vis}>
      <div
        ref={wrap}
        className="relative outline-none"
        tabIndex={0}
        aria-label="Line chart. Use left and right arrow keys to read values by year."
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setHover((h) => Math.min(years.length - 1, (h ?? -1) + 1));
          else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? years.length) - 1));
          else return;
          e.preventDefault();
          e.stopPropagation();
        }}
        onBlur={() => setHover(null)}
      >
        {w > 0 && (
          <svg width={w} height={height} className="block overflow-visible" role="img" aria-hidden>
            {win && (
              <g>
                <rect x={x(win[0])} y={m.t} width={Math.max(0, x(win[1]) - x(win[0]))} height={height - m.t - m.b} fill="rgb(236 229 211 / 0.05)" />
                <text x={x(win[0]) + 4} y={m.t + 10} className="fill-muted text-[10px]">
                  {win[0]}–{win[1]}
                </text>
              </g>
            )}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="rgb(236 229 211 / 0.08)" />
                <text x={m.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="num fill-muted text-[10px]">
                  {format(t)}
                </text>
              </g>
            ))}
            {zero && !log && y.domain()[0] < 0 && <line x1={m.l} x2={w - m.r} y1={y(0)} y2={y(0)} stroke="rgb(236 229 211 / 0.3)" />}
            {xt.map((yr) => (
              <text key={yr} x={x(yr)} y={height - 8} textAnchor="middle" className="num fill-muted text-[10px]">
                {yr}
              </text>
            ))}
            {series.map((s, i) => (
              <path
                key={s.id}
                d={paths[i]}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dashed ? "4 4" : "1"}
                pathLength={s.dashed ? undefined : 1}
                style={s.dashed ? { opacity: on ? 0.8 : 0, transition: "opacity 1s" } : { strokeDashoffset: on ? 0 : 1, transition: `stroke-dashoffset 1.8s cubic-bezier(.22,1,.36,1) ${i * 120}ms` }}
              />
            ))}
            {series.map((s) => {
              const last = s.data[s.data.length - 1];
              return last ? <circle key={s.id} cx={x(last.year)} cy={y(last.value)} r={4} fill={s.color} stroke="#0a0f1c" strokeWidth={2} /> : null;
            })}
            {endLabels &&
              w > 420 &&
              labels.map(({ s, ly }) => {
                const last = s.data[s.data.length - 1];
                return last ? (
                  <text key={s.id} x={x(last.year) + 9} y={ly} dy="0.32em" className="fill-paper-2 text-[10.5px]">
                    <tspan className="num font-semibold fill-paper">{format(last.value)}</tspan> {s.label}
                  </text>
                ) : null;
              })}
            {hy != null && (
              <g>
                <line x1={x(hy)} x2={x(hy)} y1={m.t} y2={height - m.b} stroke="rgb(236 229 211 / 0.35)" />
                {series.map((s) => {
                  const d = s.data.find((p) => p.year === hy);
                  return d ? <circle key={s.id} cx={x(hy)} cy={y(d.value)} r={4.5} fill={s.color} stroke="#0a0f1c" strokeWidth={2} /> : null;
                })}
              </g>
            )}
            <rect
              x={m.l}
              y={m.t}
              width={Math.max(0, w - m.l - m.r)}
              height={height - m.t - m.b}
              fill="transparent"
              onPointerMove={(e) => move(e.clientX, (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect())}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
        )}
        {hy != null && (
          <Tooltip x={x(hy)} y={height / 2} w={w}>
            <div className="mb-1 font-semibold text-paper">{hy}</div>
            {series
              .map((s) => ({ s, d: s.data.find((p) => p.year === hy) }))
              .filter((r) => r.d)
              .sort((a, b) => b.d!.value - a.d!.value)
              .map(({ s, d }) => (
                <TipRow key={s.id} color={s.color} label={s.label} value={format(d!.value)} />
              ))}
          </Tooltip>
        )}
      </div>
    </div>
  );
}
