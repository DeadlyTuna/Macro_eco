// Small helpers for computed copy on the comparison page.
import { COUNTRIES } from "@/lib/countries";
import { val, type Iso } from "@/lib/data";

/** Country name as it reads mid-sentence ("the Maldives", "Bosnia"). */
export const nameOf = (iso: Iso) => (iso === "MDV" ? "the Maldives" : COUNTRIES[iso].short);

/** Country name at the start of a sentence. */
export const NameOf = (iso: Iso) => {
  const n = nameOf(iso);
  return n.charAt(0).toUpperCase() + n.slice(1);
};

/** Possessive: "Bosnia’s", "Seychelles’". */
export const possOf = (iso: Iso) => {
  const n = nameOf(iso);
  return n.endsWith("s") ? `${n}’` : `${n}’s`;
};

/** Possessive at the start of a sentence: "The Maldives’". */
export const PossOf = (iso: Iso) => {
  const n = possOf(iso);
  return n.charAt(0).toUpperCase() + n.slice(1);
};

/** "2.0×", "18×", "828×". */
export function times(r: number) {
  if (!Number.isFinite(r)) return "—";
  const d = r < 1.1 ? 2 : r < 10 ? 1 : 0;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }).format(r)}×`;
}

export const ordinal = (n: number) => ["first", "second", "third", "fourth"][n - 1] ?? `${n}th`;

/** Share of GDP kept as national income (GNI / GDP), or null when either is missing. */
export function kept(iso: Iso, year: number) {
  const gni = val(iso, "gni", year);
  const gdp = val(iso, "gdp", year);
  return gni == null || gdp == null || gdp === 0 ? null : (gni / gdp) * 100;
}

/** "Bosnia and Seychelles", "Bosnia, Seychelles and Viet Nam". */
export function listOf(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
