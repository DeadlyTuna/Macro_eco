"use client";

import { useState } from "react";
import { scaleBand, scaleLinear, scaleLog } from "d3-scale";
import { Tooltip, TipRow, useInView, useWidth } from "./ChartFrame";
import { formatter, type FormatKey } from "@/lib/format";

/** Bar with only its data end rounded (4px), anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number, r = 4, down = false) {
  if (h <= 0 || w <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  if (down) return `M${x},${y}h${w}v${h - rr}a${rr},${rr} 0 0 1 -${rr},${rr}h-${w - 2 * rr}a${rr},${rr} 0 0 1 -${rr},-${rr}z`;
  return `M${x},${y + h}v-${h - rr}a${rr},${rr} 0 0 1 ${rr},-${rr}h${w - 2 * rr}a${rr},${rr} 0 0 1 ${rr},${rr}v${h - rr}z`;
}

export type Group = { id: string; label: string; color: string; values: { key: string; value: number }[] };

/** Vertical grouped bars: one group per country, one bar per year (older years lighter). */
export function GroupedBars({
  groups,
  format: fk,
  height = 280,
  log = false,
  emphasize,
}: {
  groups: Group[];
  format: FormatKey;
  height?: number;
  log?: boolean;
  emphasize?: string;
}) {
  const format = formatter(fk);
  const [wrap, w] = useWidth<HTMLDivElement>();
  const [vis, on] = useInView<HTMLDivElement>();
  const [hover, setHover] = useState<{ g: number; k: number } | null>(null);
  const m = { t: 22, r: 8, b: 30, l: 50 };
  const keys = groups[0]?.values.map((v) => v.key) ?? [];
  const vals = groups.flatMap((g) => g.values.map((v) => v.value));
  const x0 = scaleBand().domain(groups.map((g) => g.id)).range([m.l, w - m.r]).paddingInner(0.28).paddingOuter(0.1);
  const x1 = scaleBand().domain(keys).range([0, x0.bandwidth()]).paddingInner(0.06);
  const lo = log ? Math.min(...vals) * 0.5 : Math.min(0, ...vals);
  const hi = Math.max(...vals) * (log ? 1.6 : 1.08);
  const y = log ? scaleLog().domain([lo, hi]).range([height - m.b, m.t]) : scaleLinear().domain([lo, hi]).nice(5).range([height - m.b, m.t]);
  const base = log ? height - m.b : y(0);
  const ticks = log ? (y.ticks(6) as number[]).filter((t) => /^1/.test(String(t))) : (y.ticks(5) as number[]);
  const shade = (k: number) => 0.4 + (0.6 * (k + 1)) / keys.length;

  return (
    <div ref={vis}>
      <div ref={wrap} className="relative">
        {w > 0 && (
          <svg width={w} height={height} className="block" aria-hidden>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="rgb(236 229 211 / 0.08)" />
                <text x={m.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="num fill-muted text-[10px]">
                  {format(t)}
                </text>
              </g>
            ))}
            {groups.map((g, gi) => (
              <g key={g.id} transform={`translate(${x0(g.id)},0)`} opacity={emphasize && emphasize !== g.id ? 0.35 : 1}>
                {g.values.map((v, k) => {
                  const top = y(Math.max(v.value, log ? lo : 0));
                  const h = Math.abs(base - y(v.value));
                  const neg = !log && v.value < 0;
                  return (
                    <path
                      key={v.key}
                      d={barPath(x1(v.key)!, neg ? base : top, x1.bandwidth(), h, 4, neg)}
                      fill={g.color}
                      fillOpacity={shade(k)}
                      style={{ transformOrigin: `0 ${base}px`, transform: on ? "scaleY(1)" : "scaleY(0)", transition: `transform 1.2s cubic-bezier(.22,1,.36,1) ${gi * 90 + k * 50}ms` }}
                      onPointerEnter={() => setHover({ g: gi, k })}
                      onPointerLeave={() => setHover(null)}
                    />
                  );
                })}
                <text x={x0.bandwidth() / 2} y={height - 10} textAnchor="middle" className="fill-paper-2 text-[11px]">
                  {g.label}
                </text>
                {/* label the latest bar only */}
                {(() => {
                  const k = g.values.length - 1;
                  const v = g.values[k];
                  return (
                    <text x={x1(v.key)! + x1.bandwidth() / 2} y={(v.value < 0 && !log ? base + Math.abs(base - y(v.value)) + 12 : y(v.value) - 6)} textAnchor="middle" className="num fill-paper text-[10.5px] font-semibold">
                      {format(v.value)}
                    </text>
                  );
                })()}
              </g>
            ))}
          </svg>
        )}
        {hover && (
          <Tooltip x={(x0(groups[hover.g].id) ?? 0) + (x1(keys[hover.k]) ?? 0) + x1.bandwidth() / 2} y={height / 2} w={w}>
            <div className="mb-1 font-semibold text-paper">{groups[hover.g].label}</div>
            {groups[hover.g].values.map((v) => (
              <TipRow key={v.key} color={groups[hover.g].color} label={v.key} value={format(v.value)} />
            ))}
          </Tooltip>
        )}
      </div>
      {keys.length > 1 && (
        <div className="mt-2 flex gap-4 text-xs text-paper-2" aria-label="Legend">
          {keys.map((k, i) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-2.5 w-3 rounded-sm bg-paper" style={{ opacity: shade(i) }} />
              {k}
            </span>
          ))}
          <span className="text-muted">· darker = later</span>
        </div>
      )}
    </div>
  );
}

export type Row = { id: string; label: string; color: string; value: number; display?: string; note?: string };

/** Horizontal bars, one per row, value at the bar end. Handles negatives around a zero line. */
export function HBars({ rows, format: fk, domain, height }: { rows: Row[]; format: FormatKey; domain?: [number, number]; height?: number }) {
  const format = formatter(fk);
  const [wrap, w] = useWidth<HTMLDivElement>();
  const [vis, on] = useInView<HTMLDivElement>();
  const rowH = 34;
  const H = height ?? rows.length * rowH + 8;
  const labelW = Math.min(130, w * 0.32);
  const vals = rows.map((r) => r.value);
  const [lo, hi] = domain ?? [Math.min(0, ...vals), Math.max(0, ...vals)];
  const x = scaleLinear().domain([lo, hi]).range([labelW + 8, w - 64]);
  return (
    <div ref={vis}>
      <div ref={wrap} className="relative">
        {w > 0 && (
          <svg width={w} height={H} className="block" role="img" aria-label={rows.map((r) => `${r.label}: ${r.display ?? format(r.value)}`).join("; ")}>
            {lo < 0 && <line x1={x(0)} x2={x(0)} y1={0} y2={H} stroke="rgb(236 229 211 / 0.3)" />}
            {rows.map((r, i) => {
              const y0 = i * rowH + 6;
              const a = x(Math.min(0, r.value));
              const b = x(Math.max(0, r.value));
              return (
                <g key={r.id}>
                  <text x={0} y={y0 + 11} dy="0.32em" className="fill-paper-2 text-[11.5px]">
                    {r.label}
                  </text>
                  <rect
                    x={a}
                    y={y0 + 3}
                    width={Math.max(2, b - a)}
                    height={16}
                    rx={4}
                    fill={r.color}
                    style={{ transformOrigin: `${x(0)}px 0`, transform: on ? "scaleX(1)" : "scaleX(0)", transition: `transform 1.2s cubic-bezier(.22,1,.36,1) ${i * 90}ms` }}
                  />
                  <text x={r.value < 0 ? a - 6 : b + 6} y={y0 + 11} dy="0.32em" textAnchor={r.value < 0 ? "end" : "start"} className="num fill-paper text-[11.5px] font-semibold">
                    {r.display ?? format(r.value)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

/** Two values per row joined by a line — Atlas against PPP. */
export function Dumbbell({
  rows,
  format: fk,
  aLabel,
  bLabel,
}: {
  rows: { id: string; label: string; color: string; a: number; b: number }[];
  format: FormatKey;
  aLabel: string;
  bLabel: string;
}) {
  const format = formatter(fk);
  const [wrap, w] = useWidth<HTMLDivElement>();
  const [vis, on] = useInView<HTMLDivElement>();
  const rowH = 46;
  const labelW = Math.min(120, w * 0.3);
  const max = Math.max(...rows.flatMap((r) => [r.a, r.b])) * 1.08;
  const x = scaleLinear().domain([0, max]).nice().range([labelW + 10, w - 20]);
  const H = rows.length * rowH + 26;
  return (
    <div ref={vis}>
      <div ref={wrap}>
        {w > 0 && (
          <svg width={w} height={H} className="block" role="img" aria-label={rows.map((r) => `${r.label}: ${aLabel} ${format(r.a)}, ${bLabel} ${format(r.b)}`).join("; ")}>
            {(x.ticks(4) as number[]).map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={0} y2={H - 20} stroke="rgb(236 229 211 / 0.08)" />
                <text x={x(t)} y={H - 6} textAnchor="middle" className="num fill-muted text-[10px]">
                  {format(t)}
                </text>
              </g>
            ))}
            {rows.map((r, i) => {
              const cy = i * rowH + 22;
              return (
                <g key={r.id}>
                  <text x={0} y={cy} dy="0.32em" className="fill-paper-2 text-[11.5px]">
                    {r.label}
                  </text>
                  <line x1={x(r.a)} x2={on ? x(r.b) : x(r.a)} y1={cy} y2={cy} stroke={r.color} strokeWidth={2} strokeOpacity={0.6} style={{ transition: `all 1.2s cubic-bezier(.22,1,.36,1) ${i * 100}ms` }} />
                  <circle cx={x(r.a)} cy={cy} r={5.5} fill={r.color} stroke="#0a0f1c" strokeWidth={2} />
                  <circle cx={on ? x(r.b) : x(r.a)} cy={cy} r={5.5} fill="#0a0f1c" stroke={r.color} strokeWidth={2} style={{ transition: `all 1.2s cubic-bezier(.22,1,.36,1) ${i * 100}ms` }} />
                  <text x={x(r.a)} y={cy - 12} textAnchor="middle" className="num fill-paper-2 text-[10px]">
                    {format(r.a)}
                  </text>
                  <text x={x(r.b)} y={cy - 12} textAnchor="middle" className="num fill-paper text-[10px] font-semibold" style={{ opacity: on ? 1 : 0, transition: "opacity .6s 1s" }}>
                    {format(r.b)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
      <div className="mt-1 flex gap-4 text-xs text-paper-2" aria-label="Legend">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-paper" /> {aLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-paper" /> {bLabel}
        </span>
      </div>
    </div>
  );
}
