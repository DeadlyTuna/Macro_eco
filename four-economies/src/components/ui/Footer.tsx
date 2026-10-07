import { TLink } from "@/components/motion/Transition";
import { COUNTRIES, ORDER } from "@/lib/countries";
import { META } from "@/lib/data";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-rule bg-ink/80 backdrop-blur">
      <div className="microprint border-b border-rule py-1.5" aria-hidden>
        {"GROSS NATIONAL INCOME · ATLAS METHOD · PURCHASING POWER PARITY · CONSUMER PRICES · 25BEC0374 · ".repeat(12)}
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <div>
          <p className="display text-3xl italic text-paper">Four Economies</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-paper-2">
            A study for BAHUM107 Macroeconomics by Harsh (25BEC0374), B.Tech Electronics &amp; Communication Engineering, VIT Vellore. Every figure comes from the World Bank&apos;s World
            Development Indicators, retrieved {new Date(META.retrieved).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
        </div>
        <nav aria-label="Countries">
          <p className="eyebrow mb-3">Countries</p>
          <ul className="space-y-2 text-sm">
            {ORDER.map((i) => (
              <li key={i}>
                <TLink href={`/countries/${COUNTRIES[i].slug}`} label={COUNTRIES[i].name} color={COUNTRIES[i].color} className="link-underline text-paper-2 hover:text-paper">
                  {COUNTRIES[i].name}
                </TLink>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="More">
          <p className="eyebrow mb-3">Explore</p>
          <ul className="space-y-2 text-sm">
            <li>
              <TLink href="/" label="The story" className="link-underline text-paper-2 hover:text-paper">
                The story
              </TLink>
            </li>
            <li>
              <TLink href="/compare" label="Compare" className="link-underline text-paper-2 hover:text-paper">
                Compare side by side
              </TLink>
            </li>
            <li>
              <TLink href="/method" label="Method" className="link-underline text-paper-2 hover:text-paper">
                Method, glossary &amp; sources
              </TLink>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
