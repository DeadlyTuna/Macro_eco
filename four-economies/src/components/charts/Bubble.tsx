"use client";

import { useState } from "react";
import { scaleLinear, scaleLog, scaleSqrt } from "d3-scale";
import { Tooltip, TipRow, useWidth } from "./ChartFrame";
import { formatter, type FormatKey } from "@/lib/format";

export type BubblePoint = { year: number; x: number | null; y: number | null; r: number | null };
export type BubbleSeries = { id: string; label: string; color: string; data: BubblePoint[] };

type Valid = { year: number; x: number; y: number; r: number };
const ok = (p: BubblePoint | undefined): p is Valid => !!p && p.x != null && p.y != null && p.r != null;
const clamp = (v: number, [a, b]: [number, number]) => Math.min(b, Math.max(a, v));

const EASE = "cubic-bezier(.22,1,.36,1)";
// Each trail segment draws itself over the same time, and on the same curve, as its bubble travels.
const TRAIL_KEYFRAMES = "@keyframes bubble-trail{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}";

/**
 * Motion chart: one bubble per country for a chosen year. x on a log scale, y linear and clamped
 * to its domain (clamped points sit on the edge with a marker), bubble area proportional to
 * `r`. Bubbles are positioned with a CSS-transitioned transform, so changing `year` glides them.
 */
export function Bubble({
  series,
  year,
  xDomain,
  yDomain,
  xTicks,
  yTicks,
  xFormat,
  yFormat,
  yTickFormat,
  rFormat,
  xLabel,
  yLabel,
  xName,
  yName,
  rName,
  playing = false,
  stepMs = 700,
  minRadius = 4.5,
}: {
  series: BubbleSeries[];
  year: number;
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: { value: number; label: string }[];
  yTicks: number[];
  xFormat: FormatKey;
  /** Format for y values in labels and tooltips. */
  yFormat: FormatKey;
  /** Format for the y axis ticks (usually coarser than `yFormat`). */
  yTickFormat: FormatKey;
  rFormat: FormatKey;
  /** Axis titles. */
  xLabel: string;
  yLabel: string;
  /** Short names used in tooltips. */
  xName: string;
  yName: string;
  rName: string;
  playing?: boolean;
  stepMs?: number;
  minRadius?: number;
}) {
  const [wrap, w] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<string | null>(null);

  const narrow = w < 520;
  const h = narrow ? 380 : 480;
  const rPx = narrow ? 30 : 48;
  // Room above the plot for the biggest bubble to overhang the top edge when a reading is off the scale.
  const m = { t: rPx + 30, r: narrow ? 14 : 28, b: 52, l: narrow ? 46 : 60 };
  const fx = formatter(xFormat);
  const fy = formatter(yFormat);
  const fyTick = formatter(yTickFormat);
  const fr = formatter(rFormat);

  const X = scaleLog()
    .domain(xDomain)
    .range([m.l, Math.max(m.l + 10, w - m.r)]);
  const Y = scaleLinear().domain(yDomain).range([h - m.b, m.t]);
  const rMax = Math.max(1, ...series.flatMap((s) => s.data.map((d) => d.r ?? 0)));
  const R = scaleSqrt()
    .domain([0, rMax])
    .range([0, rPx]);

  const dur = playing ? stepMs : 380;
  const ease = playing ? "linear" : EASE;

  // Where a reading sits. Off-scale readings are drawn on the edge they overshoot.
  const place = (d: Valid) => ({
    px: X(clamp(d.x, xDomain)),
    py: Y(clamp(d.y, yDomain)),
    rad: Math.max(minRadius, R(d.r)),
    off: d.y > yDomain[1] ? 1 : d.y < yDomain[0] ? -1 : 0,
  });

  const items = series
    .map((s) => {
      const cur = s.data.find((d) => d.year === year);
      const live = ok(cur);
      // Hold the last known position while a country has no reading for this year.
      let hold: Valid | undefined;
      for (const d of s.data) if (ok(d) && d.year <= year) hold = d;
      hold ??= s.data.find(ok);
      if (!hold) return null;
      const trail = s.data.filter(ok).filter((d) => d.year <= year);
      const stepped = live && trail.length > 1 && trail[trail.length - 1].year === year;
      return { s, hold, live, ...place(hold), trail, stepped };
    })
    .filter((i): i is NonNullable<typeof i> => i !== null)
    .sort((a, b) => b.rad - a.rad);

  const tip = items.find((i) => i.s.id === active && i.live);
  const fontSize = Math.min(220, Math.max(90, w * 0.26));

  return (
    <div ref={wrap} className="relative" style={{ minHeight: h }}>
      <style>{TRAIL_KEYFRAMES}</style>
      {w > 0 && (
        <svg width={w} height={h} className="block overflow-visible" role="group" aria-label={`Bubble chart for ${year}. ${yName} against ${xName}; bubble size shows ${rName}.`}>
          <text
            aria-hidden
            x={(m.l + w - m.r) / 2}
            y={(m.t + h - m.b) / 2 + fontSize * 0.3}
            textAnchor="middle"
            className="display"
            style={{ fontSize, fill: "rgb(236 229 211 / 0.055)", letterSpacing: "-0.03em", pointerEvents: "none" }}
          >
            {year}
          </text>

          {xTicks.map((t) => (
            <g key={t.value} aria-hidden>
              <line x1={X(t.value)} x2={X(t.value)} y1={m.t} y2={h - m.b} stroke="rgb(236 229 211 / 0.07)" />
              <text x={X(t.value)} y={h - m.b + 16} textAnchor="middle" className="num fill-muted text-[10px]">
                {t.label}
              </text>
            </g>
          ))}
          {yTicks.map((t) => (
            <g key={t} aria-hidden>
              <line x1={m.l} x2={w - m.r} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? "rgb(236 229 211 / 0.3)" : "rgb(236 229 211 / 0.08)"} />
              <text x={m.l - 8} y={Y(t)} dy="0.32em" textAnchor="end" className="num fill-muted text-[10px]">
                {fyTick(t)}
              </text>
            </g>
          ))}
          <text aria-hidden x={(m.l + w - m.r) / 2} y={h - 8} textAnchor="middle" className="fill-muted text-[10px]">
            {xLabel}
          </text>
          <text aria-hidden transform={`translate(12 ${(m.t + h - m.b) / 2}) rotate(-90)`} textAnchor="middle" className="fill-muted text-[10px]">
            {yLabel}
          </text>

          {/* Trails: the path each country has taken up to this year. */}
          {items.map(({ s, trail, stepped, live }) => {
            const pts = (stepped ? trail.slice(0, -1) : trail).map((d) => {
              const p = place(d);
              return [p.px, p.py] as const;
            });
            const last = trail[trail.length - 1];
            const prev = trail[trail.length - 2];
            return (
              <g key={s.id} aria-hidden style={{ opacity: live ? 1 : 0.5, transition: "opacity .4s" }}>
                {pts.length > 1 && <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={s.color} strokeOpacity={0.4} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />}
                {pts.map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r={1.7} fill={s.color} fillOpacity={0.55} />
                ))}
                {stepped && prev && last && (
                  <line
                    key={year}
                    x1={place(prev).px}
                    y1={place(prev).py}
                    x2={place(last).px}
                    y2={place(last).py}
                    stroke={s.color}
                    strokeOpacity={0.4}
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    style={{ animation: `bubble-trail ${dur}ms ${ease} both` }}
                  />
                )}
              </g>
            );
          })}

          {/* Bubbles, largest first so small ones stay reachable. */}
          {items.map(({ s, hold, live, off, px, py, rad }) => {
            const toRight = px + rad + 12 + s.label.length * 6.6 < w - m.r + 12;
            const side = toRight ? 1 : -1;
            const isActive = active === s.id;
            return (
              <g
                key={s.id}
                tabIndex={live ? 0 : undefined}
                role={live ? "img" : undefined}
                aria-hidden={live ? undefined : true}
                aria-label={
                  live
                    ? `${s.label}, ${year}: ${xName} ${fx(hold.x)}, ${yName} ${fy(hold.y)}${off ? " (off the chart)" : ""}, ${rName} ${fr(hold.r)}`
                    : undefined
                }
                className="outline-none"
                style={{
                  transform: `translate(${px}px, ${py}px)`,
                  transition: `transform ${dur}ms ${ease}, opacity .4s`,
                  opacity: live ? 1 : 0,
                  pointerEvents: live ? "auto" : "none",
                  cursor: "pointer",
                }}
                onPointerEnter={() => setActive(s.id)}
                onPointerLeave={() => setActive((a) => (a === s.id ? null : a))}
                onFocus={() => setActive(s.id)}
                onBlur={() => setActive((a) => (a === s.id ? null : a))}
              >
                <circle
                  className="ring"
                  r={rad + 5}
                  fill="none"
                  stroke="var(--color-paper)"
                  strokeWidth={1.5}
                  style={{ opacity: isActive ? 1 : 0, transition: "opacity .2s" }}
                />
                <circle
                  r={rad}
                  fill={s.color}
                  fillOpacity={0.8}
                  stroke={s.color}
                  strokeWidth={1.5}
                  strokeDasharray={off ? "3 2" : undefined}
                  style={{ r: `${rad}px`, transition: `r ${dur}ms ${ease}` }}
                />
                {off !== 0 && (
                  <g aria-hidden>
                    <path d={off > 0 ? "M0,-7L5,2h-10z" : "M0,7L5,-2h-10z"} transform={`translate(0 ${off > 0 ? -(rad + 8) : rad + 8})`} fill="var(--color-paper)" />
                    {/* The true reading, kept short and centred on the marker so it never collides with a neighbour's name. */}
                    <text
                      y={off > 0 ? -(rad + 22) : rad + 28}
                      textAnchor="middle"
                      className="num fill-paper text-[10.5px]"
                      style={{ paintOrder: "stroke", stroke: "#0a0f1c", strokeWidth: 3, strokeLinejoin: "round" }}
                    >
                      {fy(hold.y)}
                    </text>
                  </g>
                )}
                <text
                  x={side * (rad + 7)}
                  dy="0.32em"
                  textAnchor={side > 0 ? "start" : "end"}
                  className="fill-paper text-[11.5px]"
                  style={{ paintOrder: "stroke", stroke: "#0a0f1c", strokeWidth: 3, strokeLinejoin: "round" }}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {tip && (
        <Tooltip x={tip.px} y={Math.max(70, tip.py)} w={w}>
          <div className="mb-1 font-semibold text-paper">
            {tip.s.label} · {year}
          </div>
          <TipRow color={tip.s.color} label={xName} value={fx(tip.hold.x)} />
          <TipRow color={tip.s.color} label={yName} value={fy(tip.hold.y)} />
          <TipRow color={tip.s.color} label={rName.charAt(0).toUpperCase() + rName.slice(1)} value={fr(tip.hold.r)} />
          {tip.off !== 0 && <div className="mt-1 text-[11px] text-muted">Off the chart: drawn at the edge.</div>}
        </Tooltip>
      )}
    </div>
  );
}
