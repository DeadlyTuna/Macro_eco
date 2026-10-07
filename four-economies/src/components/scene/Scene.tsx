"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { ParticleField } from "./ParticleField";

export default function Scene() {
  const [cfg, setCfg] = useState<{ count: number; reduced: boolean } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;
    const apply = () => setCfg({ count: small ? 6000 : 10000, reduced: mq.matches });
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // The canvas sizes itself from a ResizeObserver; in some embedded browsers and under
  // StrictMode's effect replay the first observation is lost, leaving a 300×150 canvas
  // that never mounts the scene. Nudge a re-measure once it is on the page.
  useEffect(() => {
    if (!cfg) return;
    const ids = [60, 400, 1200].map((ms) => window.setTimeout(() => window.dispatchEvent(new Event("resize")), ms));
    return () => ids.forEach(clearTimeout);
  }, [cfg]);

  if (!cfg) return null;
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 40, near: 0.1, far: 120 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      resize={{ scroll: false }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <ParticleField count={cfg.count} reduced={cfg.reduced} />
    </Canvas>
  );
}
