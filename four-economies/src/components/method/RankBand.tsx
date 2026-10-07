import { COUNTRIES } from "@/lib/countries";
import { Flag } from "@/components/ui/Flag";
import type { Iso } from "@/lib/data";

const ANCHOR = 74;
const REACH = 20;
const MIN = ANCHOR - REACH - 10;
const MAX = ANCHOR + REACH + 10;
const at = (rank: number) => `${((rank - MIN) / (MAX - MIN)) * 100}%`;
const TICKS = Array.from({ length: (MAX - MIN) / 5 + 1 }, (_, i) => MIN + i * 5);
const MIRRORS: Iso[] = ["SYC", "MDV", "VNM"];

/**
 * The draw, as a ruler: registration 25BEC0374 → rank 74 → a band of ±20 ranks.
 * Only the anchor is placed on the ruler; the comparators are listed as "inside the band"
 * because their exact ranks are not part of the record.
 */
export function RankBand() {
  const bih = COUNTRIES.BIH;
  return (
    <figure className="frame p-5 sm:p-6">
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Registration number</p>
          <p className="mt-2 font-mono text-2xl tracking-[0.12em] text-muted sm:text-3xl">
            25BEC03<span className="text-paper">74</span>
          </p>
        </div>
        <div className="text-right">
          <p className="eyebrow">Rank on GNI per head</p>
          <p className="denom mt-1 text-5xl text-paper sm:text-6xl">{ANCHOR}</p>
        </div>
      </div>

      <div className="relative mt-10 mb-2 h-28" role="img" aria-label={`A band of ranks from ${ANCHOR - REACH} to ${ANCHOR + REACH}, centred on ${bih.name} at rank ${ANCHOR}.`}>
        {/* the band */}
        <div
          className="absolute top-8 bottom-8 border-x border-paper/40"
          style={{ left: at(ANCHOR - REACH), width: `${((2 * REACH) / (MAX - MIN)) * 100}%`, background: "color-mix(in oklab, var(--color-paper) 7%, transparent)" }}
          aria-hidden
        />
        {/* the ruler */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-paper/30" aria-hidden />
        {TICKS.map((t) => (
          <span key={t} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-paper/30" style={{ left: at(t) }} aria-hidden />
        ))}
        {/* anchor */}
        <div className="absolute top-3 bottom-3 w-px" style={{ left: at(ANCHOR), background: bih.color }} aria-hidden />
        <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: at(ANCHOR), background: bih.color }} aria-hidden />
        <span className="eyebrow absolute top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap text-paper" style={{ left: at(ANCHOR) }} aria-hidden>
          {bih.short} · {ANCHOR}
        </span>
        {/* band edges */}
        {[
          { r: ANCHOR - REACH, d: `−${REACH}` },
          { r: ANCHOR + REACH, d: `+${REACH}` },
        ].map(({ r, d }) => (
          <span key={r} className="absolute bottom-0 flex -translate-x-1/2 translate-y-full flex-col items-center gap-0.5 pt-1" style={{ left: at(r) }} aria-hidden>
            <span className="num text-sm text-paper">{r}</span>
            <span className="eyebrow">{d}</span>
          </span>
        ))}
      </div>

      <figcaption className="relative mt-12 border-t border-rule pt-4">
        <p className="eyebrow">Inside the band, all three kept</p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
          {MIRRORS.map((iso) => (
            <li key={iso} className="flex items-center gap-2.5 text-sm text-paper">
              <span className="flex" aria-hidden>
                <Flag iso={iso} className="h-3.5 w-auto rounded-[1px]" />
              </span>
              <span className="size-2 rounded-full" style={{ background: COUNTRIES[iso].color }} aria-hidden />
              {COUNTRIES[iso].name}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted">Only the anchor is placed on the ruler. The comparators&apos; exact ranks are not plotted.</p>
      </figcaption>
    </figure>
  );
}
