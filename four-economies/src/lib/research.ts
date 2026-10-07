import raw from "@/data/research.json";
import type { Iso } from "./data";

/**
 * Hand-gathered context that the World Bank series do not carry: policy rates,
 * tourist arrivals, ratings, events. Keyed by ISO3 in src/data/research.json.
 * Every field is optional; getResearch() drops anything malformed so pages can
 * simply hide a block when its data is missing.
 */

export type Cell = number | string;
export type Sourced = { text: string; source?: string };
export type ResearchEvent = { date: string; text: string; source?: string };
export type Rating = { agency: string; date?: string; from?: string; to?: string };

export type Research = {
  basics?: {
    local_name?: string;
    capital?: string;
    area_km2?: Cell;
    languages?: string;
    currency?: string;
    regime_2024?: string;
    central_bank?: string;
    islands?: Cell;
  };
  policy_rate?: { "2022"?: Cell; "2023"?: Cell; "2024"?: Cell; note?: string };
  tourism?: { "2022"?: Cell; "2023"?: Cell; "2024"?: Cell; "2025"?: Cell; source?: string };
  exports?: { products?: string[]; markets?: string[] };
  ratings?: Rating[];
  events?: ResearchEvent[];
  since_2024?: Sourced[];
  did_you_know?: Sourced[];
};

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);

const str = (x: unknown): string | undefined => {
  if (typeof x === "string") return x.trim() || undefined;
  if (typeof x === "number" && Number.isFinite(x)) return String(x);
  return undefined;
};

const cell = (x: unknown): Cell | undefined => (typeof x === "number" && Number.isFinite(x) ? x : str(x));

/** A source may be a URL, a name, or { name, url }. Keep a URL when there is one. */
const source = (x: unknown): string | undefined => {
  if (isObj(x)) return str(x.url) ?? str(x.href) ?? str(x.name) ?? str(x.title);
  return str(x);
};

const list = (x: unknown): string[] | undefined => {
  const xs = (Array.isArray(x) ? x : typeof x === "string" ? x.split(/[;,]/) : []).map(str).filter((s): s is string => !!s);
  return xs.length ? xs : undefined;
};

/** Drop undefined keys; return undefined when nothing is left. */
function compact<T extends Obj>(o: T): T | undefined {
  const out = Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
  return Object.keys(out).length ? out : undefined;
}

function sourcedList(x: unknown): Sourced[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const out = x
    .map((it) => (typeof it === "string" ? { text: str(it) } : isObj(it) ? { text: str(it.text), source: source(it.source) } : { text: undefined }))
    .filter((it): it is { text: string; source: string | undefined } => !!it.text)
    .map((it) => (it.source ? { text: it.text, source: it.source } : { text: it.text }));
  return out.length ? out : undefined;
}

function events(x: unknown): ResearchEvent[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const out: ResearchEvent[] = [];
  for (const it of x) {
    if (!isObj(it)) continue;
    const date = str(it.date);
    const text = str(it.text);
    if (!date || !text) continue;
    const src = source(it.source);
    out.push(src ? { date, text, source: src } : { date, text });
  }
  return out.length ? out : undefined;
}

function ratings(x: unknown): Rating[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const out: Rating[] = [];
  for (const it of x) {
    if (!isObj(it)) continue;
    const agency = str(it.agency);
    if (!agency) continue;
    const r = compact({ agency, date: str(it.date), from: str(it.from), to: str(it.to) });
    if (r) out.push(r);
  }
  return out.length ? out : undefined;
}

function years<K extends string>(x: unknown, keys: readonly K[], extra: "note" | "source") {
  if (!isObj(x)) return undefined;
  const o: Obj = {};
  for (const k of keys) o[k] = cell(x[k]);
  o[extra] = extra === "source" ? source(x[extra]) : str(x[extra]);
  // Worth showing if at least one year has a value, or (for notes) when the note itself says something.
  if (!keys.some((k) => o[k] !== undefined) && !(extra === "note" && o.note !== undefined)) return undefined;
  return compact(o) as Partial<Record<K, Cell>> & Partial<Record<typeof extra, string>>;
}

function parse(x: unknown): Research | null {
  if (!isObj(x)) return null;
  const b = isObj(x.basics) ? x.basics : {};
  const ex = isObj(x.exports) ? x.exports : {};
  const r: Research = {
    basics: compact({
      local_name: str(b.local_name),
      capital: str(b.capital),
      area_km2: cell(b.area_km2),
      languages: Array.isArray(b.languages) ? list(b.languages)?.join(", ") : str(b.languages),
      currency: str(b.currency),
      regime_2024: str(b.regime_2024),
      central_bank: str(b.central_bank),
      islands: cell(b.islands),
    }),
    policy_rate: years(x.policy_rate, ["2022", "2023", "2024"] as const, "note"),
    tourism: years(x.tourism, ["2022", "2023", "2024", "2025"] as const, "source"),
    exports: compact({ products: list(ex.products), markets: list(ex.markets) }),
    ratings: ratings(x.ratings),
    events: events(x.events),
    since_2024: sourcedList(x.since_2024),
    did_you_know: sourcedList(x.did_you_know),
  };
  return compact(r) ?? null;
}

const DATA = raw as unknown as Partial<Record<string, unknown>>;

/** Research notes for one country, or null when there are none. */
export function getResearch(iso: Iso): Research | null {
  return parse(DATA[iso]);
}

/** True when a source string is a link we can point to. */
export const isUrl = (s: string | undefined): s is string => !!s && /^https?:\/\//i.test(s);

/** "https://www.cbbh.ba/press/123" → "cbbh.ba" */
export const hostOf = (url: string) => url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0];
