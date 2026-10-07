import type { ReactNode } from "react";
import type { Spec } from "@/components/scene/formations";
import type { Align } from "@/components/scene/store";
import { Slide } from "@/components/motion/Slide";
import { Odometer, Reveal, SplitHeading } from "@/components/motion/Reveal";
import { hostOf, isUrl } from "@/lib/research";

const WIDTH = {
  text: "w-full max-w-xl",
  chart: "w-full max-w-xl lg:max-w-[min(46rem,52vw)]",
  wide: "mx-auto w-full max-w-5xl",
};

/** A page section: sets the particle formation while it holds the viewport; content keeps the left column. */
export function Section({
  spec,
  id,
  label,
  align = "right",
  dim,
  width = "chart",
  className = "",
  children,
}: {
  spec: Spec;
  id: string;
  label: string;
  align?: Align;
  dim?: number;
  width?: keyof typeof WIDTH;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Slide spec={spec} id={id} label={label} align={align} dim={dim} className={`slide-pad flex min-h-svh items-center ${className}`}>
      <div className={WIDTH[width]}>{children}</div>
    </Slide>
  );
}

/** Serial-numbered eyebrow, split-text headline and an optional lede. */
export function Head({ serial, eyebrow, title, lede, color }: { serial: string; eyebrow: string; title: ReactNode; lede?: ReactNode; color?: string }) {
  return (
    <header>
      <p className="eyebrow mb-5 flex items-center gap-3">
        <span className="num text-paper-2">{serial}</span>
        <span aria-hidden className="h-px w-6" style={{ background: color ?? "var(--color-rule)" }} />
        <span>{eyebrow}</span>
      </p>
      <SplitHeading className="display on-stage max-w-[16ch] text-[clamp(2.3rem,5vw,4.4rem)] text-paper">{title}</SplitHeading>
      {lede && (
        <Reveal delay={150}>
          <p className="lede on-stage mt-6 max-w-xl">{lede}</p>
        </Reveal>
      )}
    </header>
  );
}

export const B = ({ children }: { children: ReactNode }) => <strong className="num font-semibold text-paper">{children}</strong>;

export function Note({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`max-w-xl text-xs leading-relaxed text-muted ${className}`}>{children}</p>;
}

/** A grid of denomination plates. Each Plate is a dt/dd group, so this is the <dl>. */
export function Plates({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <dl className={`grid gap-3 ${className}`}>{children}</dl>;
}

const SIZE = {
  sm: "text-[clamp(1.6rem,3vw,2.1rem)]",
  md: "text-[clamp(2rem,4vw,2.9rem)]",
  lg: "text-[clamp(2.75rem,6.4vw,4.9rem)]",
};

/**
 * A banknote "denomination plate": label and year, an engraved figure that rolls in, a note.
 * Renders one dt/dd group, so it must sit inside <Plates>. Decoration (`decor`) is absolutely
 * positioned against the frame and lives inside the dt to keep the list markup valid.
 */
export function Plate({
  label,
  value,
  unit,
  tag,
  note,
  size = "md",
  color,
  delay = 0,
  className = "",
  decor,
}: {
  label: string;
  value: string;
  unit?: string;
  tag?: string;
  note?: ReactNode;
  size?: keyof typeof SIZE;
  color?: string;
  delay?: number;
  className?: string;
  decor?: ReactNode;
}) {
  return (
    <Reveal delay={delay} className={`frame flex flex-col overflow-hidden p-4 sm:p-5 ${className}`}>
      <dt className="flex items-start justify-between gap-3">
        {color && <span aria-hidden className="absolute inset-x-0 top-0 h-[2px]" style={{ background: color }} />}
        {decor}
        <span className="eyebrow relative">{label}</span>
        {tag && <span className="eyebrow num relative shrink-0 text-paper-2">{tag}</span>}
      </dt>
      <dd className={`denom relative mt-5 text-paper ${SIZE[size]}`}>
        <Odometer value={value} />
        {unit && <span className="ml-2 font-sans text-sm font-normal tracking-normal text-paper-2">{unit}</span>}
      </dd>
      {note && <dd className="relative mt-2 text-xs leading-relaxed text-muted">{note}</dd>}
    </Reveal>
  );
}

/** Small labelled facts in a row of hairline pills. */
export function Chips({ items, className = "" }: { items: { k: string; v: ReactNode }[]; className?: string }) {
  return (
    <dl className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((it) => (
        <div key={it.k} className="flex items-baseline gap-2 rounded-full border border-rule bg-ink/60 px-3.5 py-1.5">
          <dt className="eyebrow">{it.k}</dt>
          <dd className="text-sm text-paper">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Banknote microprint border. Decorative. */
export function Microprint({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`microprint ${className}`} aria-hidden>
      {`${text.toUpperCase()} · `.repeat(14)}
    </div>
  );
}

/** A research source: a link when it is a URL, plain text otherwise. */
export function SourceRef({ source, className = "" }: { source?: string; className?: string }) {
  if (!source) return null;
  if (isUrl(source))
    return (
      <a href={source} target="_blank" rel="noopener noreferrer" className={`link-underline text-muted hover:text-paper-2 ${className}`}>
        {hostOf(source)}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  return <span className={`text-muted ${className}`}>{source}</span>;
}

/** A hairline row of two or three headline figures with a note under each. */
export function Stats({ items, className = "" }: { items: { k: string; v: string; note?: ReactNode }[]; className?: string }) {
  const cols = items.length >= 3 ? "sm:grid-cols-3" : items.length === 2 ? "sm:grid-cols-2" : "";
  return (
    <Reveal className={className}>
      <dl className={`frame grid divide-y divide-rule sm:divide-x sm:divide-y-0 ${cols}`}>
        {items.map((it) => (
          <div key={it.k} className="relative px-4 py-4 sm:px-5">
            <dt className="eyebrow">{it.k}</dt>
            <dd className="denom mt-2 text-[clamp(1.6rem,3vw,2.2rem)] text-paper">
              <Odometer value={it.v} />
            </dd>
            {it.note && <dd className="mt-1.5 text-xs leading-relaxed text-muted">{it.note}</dd>}
          </div>
        ))}
      </dl>
    </Reveal>
  );
}

/** A small captioned table in a frame. The first cell of each row is its row header. */
export function MiniTable({ caption, head, rows, foot, className = "" }: { caption: string; head?: string[]; rows: ReactNode[][]; foot?: ReactNode; className?: string }) {
  return (
    <Reveal className={`frame p-4 sm:p-5 ${className}`}>
      <table className="num relative w-full text-left text-sm">
        <caption className="eyebrow pb-3 text-left">{caption}</caption>
        {head && (
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h} scope="col" className="eyebrow pb-1.5 pr-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-rule align-baseline">
              {r.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="py-2 pr-3 font-medium text-paper">
                    {cell}
                  </th>
                ) : (
                  <td key={j} className="py-2 pr-3 text-paper-2">
                    {cell}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {foot && <div className="relative mt-3 text-[11px] leading-snug text-muted">{foot}</div>}
    </Reveal>
  );
}
