"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type TableData = { columns: string[]; rows: (string | number)[][] };
export type LegendItem = { label: string; color: string; dashed?: boolean; ghost?: boolean };

export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, on] as const;
}

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-paper-2" aria-label="Legend">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <svg width="18" height="8" aria-hidden>
            {it.ghost ? (
              <rect x="1" y="1" width="16" height="6" rx="2" fill="none" stroke={it.color} strokeWidth="1.5" />
            ) : (
              <line x1="1" y1="4" x2="17" y2="4" stroke={it.color} strokeWidth="2.5" strokeDasharray={it.dashed ? "3 3" : undefined} strokeLinecap="round" />
            )}
          </svg>
          {it.label}
        </li>
      ))}
    </ul>
  );
}

/** Title, legend, the chart or its table, and the source line. */
export function ChartFrame({
  title,
  subtitle,
  legend,
  table,
  source = "Source: World Bank, World Development Indicators",
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  legend?: LegendItem[];
  table?: TableData;
  source?: string;
  children: ReactNode;
  className?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure className={`frame p-4 sm:p-5 ${className}`}>
      <div className="relative mb-3 flex flex-wrap items-start justify-between gap-3">
        <figcaption>
          <span className="block text-sm font-semibold text-paper">{title}</span>
          {subtitle && <span className="block text-xs text-muted">{subtitle}</span>}
        </figcaption>
        {table && (
          <button
            type="button"
            onClick={() => setAsTable((t) => !t)}
            className="eyebrow rounded-full border border-rule px-2.5 py-1 text-paper-2 transition-colors hover:text-paper"
            aria-pressed={asTable}
          >
            {asTable ? "Chart" : "Table"}
          </button>
        )}
      </div>
      {legend && legend.length > 1 && !asTable && (
        <div className="relative mb-2">
          <Legend items={legend} />
        </div>
      )}
      <div className="relative">
        {asTable && table ? (
          <div className="scroll-thin max-h-[320px] overflow-auto" data-lenis-prevent>
            <table className="num w-full text-left text-xs">
              <thead className="sticky top-0 bg-ink-2 text-muted">
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} scope="col" className="px-2 py-1.5 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-t border-rule">
                    {r.map((c, j) =>
                      j === 0 ? (
                        <th key={j} scope="row" className="px-2 py-1.5 font-medium text-paper">
                          {c}
                        </th>
                      ) : (
                        <td key={j} className="px-2 py-1.5 text-paper-2">
                          {c}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
      {source && <p className="relative mt-3 text-[11px] leading-snug text-muted">{source}</p>}
    </figure>
  );
}

export function Tooltip({ x, y, w, children }: { x: number; y: number; w: number; children: ReactNode }) {
  const left = x > w * 0.6 ? x - 12 : x + 12;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 min-w-[150px] rounded-md border border-rule bg-ink/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
      style={{ left, top: y, transform: x > w * 0.6 ? "translate(-100%, -50%)" : "translate(0, -50%)" }}
    >
      {children}
    </div>
  );
}

export function TipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="flex items-center gap-1.5 text-paper-2">
        <span className="size-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="num font-medium text-paper">{value}</span>
    </div>
  );
}
