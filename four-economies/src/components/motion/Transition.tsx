"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type MouseEvent } from "react";
import gsap from "gsap";
import { Guilloche } from "@/components/ui/Guilloche";

type Go = (href: string, label?: string, color?: string) => void;
const Ctx = createContext<Go>(() => {});
export const useGo = () => useContext(Ctx);

const BANDS = ["var(--color-bih)", "var(--color-syc)", "var(--color-vnm)", "var(--color-mdv)"];

/**
 * Route changes play a shutter: four bands in the country colours sweep up like
 * notes riffled from a stack, the destination is named, then the bands lift away.
 * The particle field keeps morphing underneath because it lives in the root layout.
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const pending = useRef<string | null>(null);
  const busy = useRef(false);
  const [label, setLabel] = useState({ text: "", color: "var(--color-paper)" });

  const reveal = useCallback(() => {
    const el = root.current;
    if (!el) return;
    gsap
      .timeline({ delay: 0.2, onComplete: () => void ((busy.current = false), gsap.set(el, { visibility: "hidden" })) })
      .to(el.querySelector(".tx-label"), { opacity: 0, y: -40, duration: 0.35, ease: "power2.in" })
      .to(el.querySelectorAll(".tx-band"), { yPercent: -100, duration: 0.7, stagger: 0.07, ease: "expo.inOut" }, "<0.1");
  }, []);

  const go = useCallback<Go>(
    (href, text = "", color = "var(--color-paper)") => {
      const el = root.current;
      if (!el || busy.current || href === pathname) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return router.push(href);
      busy.current = true;
      setLabel({ text, color });
      gsap
        .timeline()
        .set(el, { visibility: "visible" })
        .fromTo(el.querySelectorAll(".tx-band"), { yPercent: 100 }, { yPercent: 0, duration: 0.65, stagger: 0.07, ease: "expo.inOut" })
        .fromTo(el.querySelector(".tx-label"), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }, "-=0.3")
        .add(() => {
          pending.current = href;
          router.push(href);
          // If the route never changes (offline, error), lift the shutter anyway.
          setTimeout(() => pending.current && ((pending.current = null), reveal()), 4000);
        });
    },
    [pathname, router, reveal]
  );

  useEffect(() => {
    if (pending.current && pathname === pending.current.split("#")[0]) {
      pending.current = null;
      reveal();
    }
  }, [pathname, reveal]);

  return (
    <Ctx.Provider value={go}>
      {children}
      <div ref={root} aria-hidden className="pointer-events-none fixed inset-0 z-[70] grid grid-cols-4" style={{ visibility: "hidden" }}>
        {BANDS.map((c, i) => (
          <div key={i} className="tx-band relative overflow-hidden" style={{ background: `color-mix(in oklab, ${c} 34%, #0a0f1c)` }}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: c }} />
            <Guilloche className="absolute -bottom-24 left-1/2 -translate-x-1/2 opacity-25" size={360} petals={9 + i * 3} color={c} />
          </div>
        ))}
        <div className="tx-label absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="eyebrow">Now opening</span>
          <span className="display text-5xl text-paper sm:text-7xl md:text-8xl">{label.text}</span>
          <span className="h-px w-24" style={{ background: label.color }} />
        </div>
      </div>
    </Ctx.Provider>
  );
}

type TLinkProps = ComponentProps<typeof Link> & { label?: string; color?: string };

export function TLink({ href, label, color, onClick, ...rest }: TLinkProps) {
  const go = useGo();
  const h = typeof href === "string" ? href : href.pathname ?? "/";
  return (
    <Link
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        go(h, label ?? (typeof rest.children === "string" ? rest.children : ""), color);
      }}
      {...rest}
    />
  );
}
