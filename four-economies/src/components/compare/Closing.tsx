import { Slide } from "@/components/motion/Slide";
import { Reveal, SplitHeading } from "@/components/motion/Reveal";
import { TLink } from "@/components/motion/Transition";
import { specs } from "@/components/scene/specs";
import { COUNTRIES, ORDER } from "@/lib/countries";

/** Section 6: onward to each country's story, and to the method page. */
export function Closing() {
  return (
    <Slide spec={specs.globe(null)} align="center" dim={0.55} label="Next" id="next" className="slide-pad flex min-h-svh items-center">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <p className="eyebrow on-stage">Next</p>
          <SplitHeading className="display mt-4 text-5xl text-paper sm:text-6xl">One economy at a time</SplitHeading>
          <Reveal>
            <p className="lede on-stage mt-5">The comparison shows who came out ahead. Each country page tells the story behind its numbers.</p>
          </Reveal>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ORDER.map((iso, i) => {
            const c = COUNTRIES[iso];
            return (
              <li key={iso}>
                <Reveal delay={80 + i * 80} className="h-full">
                  <TLink
                    href={`/countries/${c.slug}`}
                    label={c.name}
                    color={c.color}
                    className="frame group flex h-full min-h-[15rem] flex-col p-5 transition-colors hover:border-paper/30"
                  >
                    <span className="relative flex items-center gap-2.5">
                      <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                      <span className="eyebrow">{c.regimeShort}</span>
                    </span>
                    <span className="display relative mt-6 block text-3xl text-paper">{c.name}</span>
                    <span className="relative mt-3 block flex-1 text-sm leading-relaxed text-paper-2">{c.thesis}</span>
                    <span className="relative mt-6 inline-flex items-center gap-2 text-xs text-paper">
                      <span className="link-underline pb-0.5">Read the story</span>
                      <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </TLink>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <Reveal className="mt-10" delay={200}>
          <p className="on-stage text-sm text-paper-2">
            Want to check the working?{" "}
            <TLink href="/method" label="Method" color="var(--color-paper)" className="link-underline text-paper">
              Method, glossary and sources
            </TLink>{" "}
            lists every indicator and every caveat.
          </p>
        </Reveal>
      </div>
    </Slide>
  );
}
