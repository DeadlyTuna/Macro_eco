import { COUNTRIES, ORDER } from "@/lib/countries";
import { INDICATORS, latest, type IndicatorKey } from "@/lib/data";
import { unitLabel } from "@/lib/format";

export const INDICATOR_KEYS = Object.keys(INDICATORS) as IndicatorKey[];

/** For one indicator: the newest year any of the four reports, and each country's own newest year. */
export function coverage(key: IndicatorKey) {
  const byIso = ORDER.map((iso) => ({ iso, year: latest(iso, key)?.year ?? null }));
  const newest = Math.max(...byIso.map((c) => c.year ?? -Infinity));
  return { newest: Number.isFinite(newest) ? newest : null, byIso };
}

/** Every indicator the site loads, with its World Bank code, unit and who reports the newest year. */
export function IndicatorTable() {
  const rows = INDICATOR_KEYS.map((key) => ({ key, ...INDICATORS[key], ...coverage(key) }));
  return (
    <div className="frame">
      <div className="scroll-thin relative overflow-x-auto" data-lenis-prevent tabIndex={0} role="region" aria-label="Indicator table, scrolls sideways on small screens">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <caption className="sr-only">
            World Bank indicators used on this site, with code, unit, the newest year with data, and the newest year each country reports.
          </caption>
          <thead className="text-muted">
            <tr className="border-b border-rule">
              <th scope="col" className="eyebrow px-4 py-3 font-normal">
                Indicator
              </th>
              <th scope="col" className="eyebrow px-3 py-3 font-normal">
                Code
              </th>
              <th scope="col" className="eyebrow px-3 py-3 font-normal">
                Unit
              </th>
              <th scope="col" className="eyebrow px-3 py-3 text-right font-normal">
                Newest
              </th>
              {ORDER.map((iso) => (
                <th key={iso} scope="col" className="eyebrow px-3 py-3 text-right font-normal">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full" style={{ background: COUNTRIES[iso].color }} aria-hidden />
                    {COUNTRIES[iso].short}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-rule last:border-b-0">
                <th scope="row" className="px-4 py-2.5 font-normal text-paper">
                  {r.name}
                </th>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <a
                    href={`https://data.worldbank.org/indicator/${r.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline font-mono text-xs text-paper-2 hover:text-paper"
                  >
                    {r.code}
                    <span className="sr-only"> (opens the World Bank indicator page in a new tab)</span>
                  </a>
                </td>
                <td className="px-3 py-2.5 text-xs text-paper-2">{unitLabel[r.unit]}</td>
                <td className="num px-3 py-2.5 text-right text-paper">{r.newest ?? "—"}</td>
                {r.byIso.map(({ iso, year }) => {
                  const current = year != null && year === r.newest;
                  return (
                    <td key={iso} className={`num px-3 py-2.5 text-right ${current ? "text-paper" : "text-muted"}`}>
                      {year == null ? (
                        <>
                          <span aria-hidden>—</span>
                          <span className="sr-only">No data</span>
                        </>
                      ) : (
                        <span className="inline-flex items-center justify-end gap-1.5">
                          {current && <span className="size-1.5 rounded-full" style={{ background: COUNTRIES[iso].color }} aria-hidden />}
                          {year}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
