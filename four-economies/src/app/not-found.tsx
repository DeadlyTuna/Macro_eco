import type { Metadata } from "next";
import { Slide } from "@/components/motion/Slide";
import { SplitHeading, Reveal } from "@/components/motion/Reveal";
import { TLink } from "@/components/motion/Transition";
import { Guilloche } from "@/components/ui/Guilloche";
import { specs } from "@/components/scene/specs";
import { COUNTRIES, ORDER } from "@/lib/countries";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This address does not exist on Four Economies. Go back to the story, the side-by-side comparison, or one of the four countries.",
  robots: { index: false, follow: true },
};

/** A 404 in the site's own print: an engraved denomination, a guilloche rosette, and a way back. */
export default function NotFound() {
  return (
    <Slide spec={specs.text("404")} label="Not found" className="slide-pad flex min-h-svh items-center">
      <div className="w-full max-w-xl lg:max-w-[580px]">
        <div className="frame relative overflow-hidden p-6 sm:p-8">
          <Guilloche className="pointer-events-none absolute -right-24 -top-24 text-paper opacity-[0.14]" size={320} petals={14} rings={3} strands={4} />
          <div className="microprint relative -mx-1 mb-6" aria-hidden>
            {"FOUR ECONOMIES · NOT IN CIRCULATION · ".repeat(8)}
          </div>
          <p className="eyebrow relative">Error 404</p>
          <p className="denom relative mt-4 text-8xl text-paper/90 sm:text-9xl" aria-hidden>
            404
          </p>
          <SplitHeading as="h1" immediate className="display relative mt-6 text-5xl text-paper sm:text-6xl">
            Page not found
          </SplitHeading>
          <Reveal delay={200} className="relative">
            <p className="lede mt-5">Nothing is printed at this address. The link may be old or mistyped. The four economies are one click away.</p>
          </Reveal>
          <Reveal delay={300} className="relative mt-8 flex flex-wrap items-center gap-3">
            <TLink href="/" label="The story" className="eyebrow rounded-full bg-paper px-5 py-3 text-ink transition-opacity hover:opacity-85">
              Back to the story →
            </TLink>
            <TLink href="/compare" label="Compare" className="eyebrow rounded-full border border-rule px-5 py-3 text-paper transition-colors hover:border-paper">
              Compare side by side
            </TLink>
          </Reveal>
          <Reveal delay={400} className="relative mt-8 border-t border-rule pt-5">
            <nav aria-label="Country pages">
              <p className="eyebrow mb-3">Or go straight to a country</p>
              <ul className="flex flex-wrap gap-2">
                {ORDER.map((iso) => {
                  const c = COUNTRIES[iso];
                  return (
                    <li key={iso}>
                      <TLink
                        href={`/countries/${c.slug}`}
                        label={c.name}
                        color={c.color}
                        className="flex items-center gap-2 rounded-full border border-rule px-3.5 py-1.5 text-sm text-paper-2 transition-colors hover:border-paper/50 hover:text-paper"
                      >
                        <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden />
                        {c.name}
                      </TLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </Reveal>
        </div>
      </div>
    </Slide>
  );
}
