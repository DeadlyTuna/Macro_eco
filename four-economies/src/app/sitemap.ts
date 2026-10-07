import type { MetadataRoute } from "next";
import { COUNTRIES, ORDER } from "@/lib/countries";
import { META } from "@/lib/data";

const BASE = "https://four-economies.vercel.app";

/** Every page on the site. lastModified is the data retrieval date, so the build stays deterministic. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = META.retrieved;
  return [
    { url: BASE, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/compare`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...ORDER.map((iso) => ({
      url: `${BASE}/countries/${COUNTRIES[iso].slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${BASE}/method`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
}
