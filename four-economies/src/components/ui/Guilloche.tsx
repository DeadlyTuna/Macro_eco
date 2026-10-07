"use client";

import { useMemo, useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * A banknote-style guilloche rosette: interlaced rose curves.
 * Paths are generated on the client — it's decoration, so it costs no HTML.
 */
export function Guilloche({
  petals = 12,
  rings = 3,
  strands = 3,
  amp = 0.14,
  size = 200,
  color = "currentColor",
  strokeWidth = 0.45,
  className = "",
  spin = false,
}: {
  petals?: number;
  rings?: number;
  strands?: number;
  amp?: number;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  spin?: boolean;
}) {
  const client = useSyncExternalStore(noop, () => true, () => false);
  const paths = useMemo(() => {
    if (!client) return [];
    const out: string[] = [];
    const steps = Math.max(240, petals * 24);
    for (let r = 0; r < rings; r++) {
      const R = 94 - r * (58 / Math.max(1, rings));
      for (let s = 0; s < strands; s++) {
        const ph = (s * Math.PI * 2) / (strands * petals) + r * 0.37;
        let d = "";
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * Math.PI * 2;
          const rr = R * (1 - amp + amp * Math.cos(petals * t + ph)) + R * amp * 0.35 * Math.cos(2 * petals * t - ph);
          d += `${i ? "L" : "M"}${(Math.cos(t) * rr).toFixed(1)} ${(Math.sin(t) * rr).toFixed(1)}`;
        }
        out.push(d + "Z");
      }
    }
    return out;
  }, [client, petals, rings, strands, amp]);

  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} className={`${spin ? "spin-slow" : ""} ${className}`} aria-hidden focusable="false">
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
