"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => null });

/** WebGL can be missing or blocked; the site still reads fine without the field. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function SceneRoot() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 scene-fade">
      <SceneBoundary>
        <Scene />
      </SceneBoundary>
    </div>
  );
}
