"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TLink } from "@/components/motion/Transition";
import { Guilloche } from "./Guilloche";
import { COUNTRIES, ORDER } from "@/lib/countries";

const MAIN = [
  { href: "/", label: "The story" },
  { href: "/compare", label: "Compare" },
  { href: "/method", label: "Method" },
];

export function Nav() {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenAt((typeof v === "function" ? v(open) : v) ? pathname : null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isOn = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-ink via-ink/70 to-transparent">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 py-4 md:px-10">
        <TLink href="/" label="The story" className="group flex items-center gap-3" aria-label="Four Economies — home">
          <Guilloche size={30} petals={7} rings={2} strands={3} className="text-paper/80 transition-transform duration-700 group-hover:rotate-90" />
          <span className="display text-xl italic tracking-tight text-paper">Four Economies</span>
        </TLink>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {MAIN.slice(0, 1).map((l) => (
            <NavLink key={l.href} {...l} on={isOn(l.href)} />
          ))}
          <span className="mx-2 h-4 w-px bg-rule" aria-hidden />
          {ORDER.map((iso) => {
            const c = COUNTRIES[iso];
            const href = `/countries/${c.slug}`;
            return (
              <TLink
                key={iso}
                href={href}
                label={c.name}
                color={c.color}
                aria-current={pathname === href ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${pathname === href ? "bg-ink-3 text-paper" : "text-paper-2 hover:text-paper"}`}
              >
                <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden />
                {c.short}
              </TLink>
            );
          })}
          <span className="mx-2 h-4 w-px bg-rule" aria-hidden />
          {MAIN.slice(1).map((l) => (
            <NavLink key={l.href} {...l} on={isOn(l.href)} />
          ))}
        </nav>

        <button
          type="button"
          className="eyebrow rounded-full border border-rule px-4 py-2 text-paper lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`fixed inset-0 top-[68px] bg-ink/97 px-6 pb-10 pt-6 backdrop-blur-md transition-[opacity,transform] duration-500 lg:hidden ${open ? "opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}
        hidden={!open}
      >
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {([MAIN[0], ...ORDER.map((i) => ({ href: `/countries/${COUNTRIES[i].slug}`, label: COUNTRIES[i].name, color: COUNTRIES[i].color })), ...MAIN.slice(1)] as { href: string; label: string; color?: string }[]).map((l) => (
            <TLink key={l.href} href={l.href} label={l.label} color={l.color} className="display flex items-center gap-4 border-b border-rule py-4 text-4xl text-paper">
              {l.color && <span className="size-3 rounded-full" style={{ background: l.color }} aria-hidden />}
              {l.label}
            </TLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, label, on }: { href: string; label: string; on: boolean }) {
  return (
    <TLink
      href={href}
      label={label}
      aria-current={on ? "page" : undefined}
      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${on ? "bg-ink-3 text-paper" : "text-paper-2 hover:text-paper"}`}
    >
      {label}
    </TLink>
  );
}
