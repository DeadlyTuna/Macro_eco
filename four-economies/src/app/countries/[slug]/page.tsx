import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SlideRail } from "@/components/ui/SlideRail";
import { Hero } from "@/components/country/Hero";
import { Denominations } from "@/components/country/Denominations";
import { Income } from "@/components/country/Income";
import { Prices } from "@/components/country/Prices";
import { Why } from "@/components/country/Why";
import { Produced } from "@/components/country/Produced";
import { People } from "@/components/country/People";
import { Structure } from "@/components/country/Structure";
import { Timeline } from "@/components/country/Timeline";
import { Beyond } from "@/components/country/Beyond";
import { Next } from "@/components/country/Next";
import { COUNTRIES, ORDER, bySlug } from "@/lib/countries";
import { change, priceChange, v } from "@/lib/data";
import { pct, usd } from "@/lib/format";
import { getResearch } from "@/lib/research";

const BASE = "https://four-economies.vercel.app";
const SHARE_ALT = "Four economies, three years, one question: who is actually better off? Bosnia & Herzegovina, Seychelles, Viet Nam and the Maldives, 2022–2024.";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ORDER.map((iso) => ({ slug: COUNTRIES[iso].slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = bySlug(slug);
  // Resolved before the body streams, so an unknown slug gets a real 404 status.
  if (!c) notFound();
  const income = change(v(c.iso, "gniPc", 2022), v(c.iso, "gniPc", 2024));
  const prices = priceChange(c.iso, 2022, 2024);
  const description = `${c.name} in 2022–2024: GNI per head ${usd(v(c.iso, "gniPc", 2024))} (${pct(income, 1, true)} since 2022), consumer prices ${pct(prices, 1, true)}, and the story behind them. World Bank data with a timeline and sources.`;
  // A page-level openGraph replaces the root one, image included, so the shared card is named again here.
  const card = { url: "/opengraph-image", width: 1200, height: 630, alt: SHARE_ALT };
  return {
    title: `${c.name}: country file`,
    description,
    alternates: { canonical: `/countries/${c.slug}` },
    openGraph: { type: "website", title: `${c.name} · Four Economies`, description, url: `/countries/${c.slug}`, siteName: "Four Economies", images: [card] },
    twitter: { card: "summary_large_image", title: `${c.name} · Four Economies`, description, images: [{ url: card.url, alt: card.alt }] },
  };
}

/**
 * Everything on this page depends on the slug, so the read of `params` sits behind a Suspense boundary
 * (see the partial-prefetching guide): the shared App Shell is just this placeholder, and the four known
 * slugs are still prerendered in full at build time through generateStaticParams.
 */
function Placeholder() {
  return (
    <div className="slide-pad flex min-h-svh items-center" aria-busy="true">
      <div className="w-full max-w-3xl">
        <p className="eyebrow">Country file · loading</p>
        <div aria-hidden className="mt-6 h-[clamp(4rem,11vw,9rem)] w-4/5 animate-pulse bg-ink-2" />
        <div aria-hidden className="mt-6 h-6 w-3/5 animate-pulse bg-ink-2" />
      </div>
    </div>
  );
}

async function CountryFile({ params }: Props) {
  const { slug } = await params;
  const c = bySlug(slug);
  if (!c) notFound();

  const research = getResearch(c.iso);
  const at = ORDER.indexOf(c.iso);
  const prev = COUNTRIES[ORDER[(at + ORDER.length - 1) % ORDER.length]];
  const next = COUNTRIES[ORDER[(at + 1) % ORDER.length]];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Four Economies", item: BASE },
          { "@type": "ListItem", position: 2, name: c.name, item: `${BASE}/countries/${c.slug}` },
        ],
      },
      {
        "@type": "WebPage",
        name: `${c.name}: country file`,
        url: `${BASE}/countries/${c.slug}`,
        isPartOf: { "@type": "WebSite", name: "Four Economies", url: BASE },
        about: { "@type": "Country", name: c.name },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SlideRail />
      <Hero c={c} research={research} />
      <Denominations c={c} />
      <Income c={c} />
      <Prices c={c} />
      <Why c={c} research={research} />
      <Produced c={c} />
      <People c={c} />
      <Structure c={c} />
      <Timeline c={c} research={research} />
      <Beyond c={c} research={research} />
      <Next prev={prev} next={next} />
    </>
  );
}

export default function CountryPage({ params }: Props) {
  return (
    <Suspense fallback={<Placeholder />}>
      <CountryFile params={params} />
    </Suspense>
  );
}
