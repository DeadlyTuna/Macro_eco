import { create } from "zustand";
import type { Spec } from "./formations";

export type Align = "left" | "right" | "center";

type SceneState = {
  spec: Spec;
  id: string;
  align: Align;
  dim: number;
  show: (spec: Spec, opts?: { align?: Align; dim?: number }) => void;
};

export const useScene = create<SceneState>((set, get) => ({
  spec: { kind: "scatter" },
  id: "scatter",
  align: "center",
  dim: 1,
  show: (spec, opts = {}) => {
    const id = JSON.stringify(spec);
    const align = opts.align ?? "right";
    const dim = opts.dim ?? 1;
    const s = get();
    if (s.id === id && s.align === align && s.dim === dim) return;
    set({ spec, id, align, dim });
  },
}));

