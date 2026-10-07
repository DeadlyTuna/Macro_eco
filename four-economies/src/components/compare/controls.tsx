"use client";

import { useId, type ReactNode } from "react";

/** Frame background for charts that sit over the 3D field, so its labels do not show through the plot. */
export const SOLID_FRAME = "[background:rgb(10_15_28/0.94)]";

/** A labelled native select in the banknote style, with an optional identity dot. */
export function SelectField({
  id,
  label,
  value,
  onChange,
  dot,
  children,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  dot?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="eyebrow block">
        {label}
      </label>
      <div className="relative mt-2">
        {dot && <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-2.5 -translate-y-1/2 rounded-full" style={{ background: dot }} />}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full cursor-pointer appearance-none border border-rule bg-ink-2 py-2.5 pr-8 text-sm text-paper transition-colors hover:border-paper/30 ${dot ? "pl-8" : "pl-3"}`}
        >
          {children}
        </select>
        <svg aria-hidden viewBox="0 0 10 6" className="pointer-events-none absolute right-3 top-1/2 w-2.5 -translate-y-1/2 text-paper-2">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </div>
    </div>
  );
}

export type SegOption<T extends string | number> = { value: T; label: ReactNode; srHint?: string };

/** A labelled row of toggle buttons (aria-pressed), one of which is on. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  className = "",
  size = "md",
}: {
  label: string;
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
      <span id={id} className="eyebrow">
        {label}
      </span>
      <div role="group" aria-labelledby={id} className="flex flex-wrap border border-rule">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={`num border-rule transition-colors [&:not(:first-child)]:border-l ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"} ${
                on ? "bg-paper text-ink" : "text-paper-2 hover:bg-ink-3 hover:text-paper"
              }`}
            >
              {o.label}
              {o.srHint && <span className="sr-only"> ({o.srHint})</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
