import type { ReactNode } from "react";
import { SplitHeading, Reveal } from "@/components/motion/Reveal";

/** Content column on the left; the particle stage keeps the right. */
export function Stage({ children, wide = false, className = "" }: { children: ReactNode; wide?: boolean; className?: string }) {
  return (
    <div className={`slide-pad flex min-h-svh items-center ${className}`}>
      <div className={wide ? "w-full max-w-6xl" : "w-full max-w-xl lg:max-w-[42rem]"}>{children}</div>
    </div>
  );
}

export function Head({ eyebrow, title, lede, as = "h2" }: { eyebrow: string; title: ReactNode; lede?: ReactNode; as?: "h1" | "h2" }) {
  return (
    <div>
      <p className="eyebrow mb-5">{eyebrow}</p>
      <SplitHeading as={as} className="display on-stage text-[clamp(2.3rem,5vw,4.4rem)] text-paper">
        {title}
      </SplitHeading>
      {lede && (
        <Reveal delay={150}>
          <p className="lede on-stage mt-6 max-w-[38rem]">{lede}</p>
        </Reveal>
      )}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-[38rem] text-xs leading-relaxed text-muted">{children}</p>;
}

export const B = ({ children }: { children: ReactNode }) => <strong className="num font-semibold text-paper">{children}</strong>;
