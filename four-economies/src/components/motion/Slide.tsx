"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Spec } from "@/components/scene/formations";
import { useScene, type Align } from "@/components/scene/store";

/**
 * A full-height section that, while it holds the middle of the viewport,
 * tells the particle field which shape to take.
 */
export function Slide({
  spec,
  align = "right",
  dim = 1,
  id,
  label,
  className = "",
  children,
}: {
  spec: Spec | null;
  align?: Align;
  dim?: number;
  id?: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const show = useScene((s) => s.show);
  const key = JSON.stringify([spec, align, dim]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !spec) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && show(spec, { align, dim }), { rootMargin: "-48% 0px -48% 0px" });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, show]);

  return (
    <section ref={ref} id={id} data-slide data-label={label} className={`relative z-10 ${className}`}>
      {children}
    </section>
  );
}
