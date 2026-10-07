// Every shape the particle field can take. Each builder returns target
// positions/colours/sizes for exactly N particles; the field morphs between them.
import globe from "@/data/globe.json";
import { COUNTRIES, ORDER } from "@/lib/countries";
import type { Iso } from "@/lib/data";

export type RGB = [number, number, number];
type V3 = [number, number, number];
export type Label = { p: V3; text: string; sub?: string; iso?: Iso };

export type Spec =
  | { kind: "scatter" }
  | { kind: "globe"; focus?: Iso | null }
  | { kind: "spheres"; values: number[]; labels: string[] }
  | { kind: "bars"; values: number[]; labels: string[]; highlight?: Iso | null }
  | { kind: "pairs"; a: number[]; b: number[]; labels: [string, string][] }
  | { kind: "crowd"; iso: Iso; flow: number; label: string }
  | { kind: "rings"; kept: number[]; labels: string[]; only?: Iso }
  | { kind: "ribbons"; series: number[][]; isos: Iso[]; years: number[]; labels: string[] }
  | { kind: "coins"; only?: Iso }
  | { kind: "sculpture"; iso: Iso }
  | { kind: "rosette"; iso: Iso; radii: number[]; amps: number[]; petals: number }
  | { kind: "helix"; beads: { u: number; iso: Iso }[] }
  | { kind: "scale"; iso: Iso; left: number; right: number; labels: [string, string] }
  | { kind: "stack"; iso: Iso; shares: number[]; labels: string[] }
  | { kind: "text"; text: string; iso?: Iso | null };

export interface Formation {
  pos: Float32Array;
  col: Float32Array;
  size: Float32Array;
  rot?: V3;
  sway?: number;
  spin?: number;
  camZ?: number;
  labels?: Label[];
  dynamic?: (t: number, pos: Float32Array, col: Float32Array) => void;
}

const D2R = Math.PI / 180;
const TAU = Math.PI * 2;
export const GLOW = Object.fromEntries(ORDER.map((i) => [i, COUNTRIES[i].glow])) as Record<Iso, RGB>;
const PAPER: RGB = [0.93, 0.89, 0.8];
const LAND: RGB = [0.3, 0.38, 0.58];
const DUST: RGB = [0.2, 0.25, 0.38];
const SEA: RGB = [0.16, 0.42, 0.62];

export function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function latLon(lat: number, lon: number, r: number): V3 {
  const phi = (90 - lat) * D2R;
  const th = (lon + 180) * D2R;
  return [-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)];
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

class Builder {
  pos: Float32Array;
  col: Float32Array;
  size: Float32Array;
  i = 0;
  constructor(public N: number) {
    this.pos = new Float32Array(N * 3);
    this.col = new Float32Array(N * 3);
    this.size = new Float32Array(N);
  }
  add(x: number, y: number, z: number, c: RGB, s = 1, k = 1) {
    if (this.i >= this.N) return -1;
    const j = this.i++;
    this.pos.set([x, y, z], j * 3);
    this.col.set([c[0] * k, c[1] * k, c[2] * k], j * 3);
    this.size[j] = s;
    return j;
  }
  get left() {
    return this.N - this.i;
  }
  /** Fill whatever is left with faint dust far behind the subject. */
  dust(rnd: () => number, k = 0.55) {
    while (this.i < this.N) {
      const u = rnd() * 2 - 1;
      const t = rnd() * TAU;
      const r = 5 + 6 * Math.sqrt(rnd());
      const s = Math.sqrt(1 - u * u);
      this.add(r * s * Math.cos(t), r * u * 0.55, r * s * Math.sin(t) * 0.6 - 5, DUST, 0.55, k * (0.5 + rnd() * 0.5));
    }
  }
  out(extra: Omit<Formation, "pos" | "col" | "size"> = {}): Formation {
    return { pos: this.pos, col: this.col, size: this.size, ...extra };
  }
}

/** Points spread over an axis-aligned box: ~45% on the 12 edges, the rest on faces. */
function box(b: Builder, rnd: () => number, n: number, cx: number, y0: number, cz: number, w: number, h: number, d: number, c: RGB, k = 1, edgesOnly = false) {
  for (let q = 0; q < n; q++) {
    let x: number, y: number, z: number;
    if (edgesOnly || rnd() < 0.45) {
      const e = Math.floor(rnd() * 12);
      const t = rnd();
      const sx = e & 1 ? 1 : -1;
      const sz = e & 2 ? 1 : -1;
      if (e < 4) [x, y, z] = [(sx * w) / 2, t * h, (sz * d) / 2];
      else if (e < 8) [x, y, z] = [(t - 0.5) * w, e & 4 && e & 1 ? h : e & 1 ? 0 : h, (sz * d) / 2];
      else [x, y, z] = [(sx * w) / 2, e & 4 ? h : 0, (t - 0.5) * d];
      if (e >= 8) y = e % 2 ? h : 0;
    } else {
      const f = Math.floor(rnd() * 5);
      const u = rnd() - 0.5;
      const t = rnd();
      if (f === 0) [x, y, z] = [u * w, h, (t - 0.5) * d];
      else if (f === 1) [x, y, z] = [u * w, t * h, d / 2];
      else if (f === 2) [x, y, z] = [u * w, t * h, -d / 2];
      else if (f === 3) [x, y, z] = [w / 2, t * h, u * d];
      else [x, y, z] = [-w / 2, t * h, u * d];
    }
    const top = y > h - 0.02 ? 1.25 : 1;
    b.add(cx + x, y0 + y, cz + z, c, edgesOnly ? 0.9 : 1.05, k * top * (0.8 + rnd() * 0.3));
  }
}

function floorGrid(b: Builder, n: number, y: number, w: number, d: number) {
  const lines = 9;
  const per = Math.floor(n / (lines * 2));
  for (let l = 0; l < lines; l++) {
    const f = l / (lines - 1) - 0.5;
    for (let q = 0; q < per; q++) {
      const t = q / per - 0.5;
      b.add(t * w, y, f * d, LAND, 0.6, 0.55);
      b.add(f * w, y, t * d, LAND, 0.6, 0.55);
    }
  }
}

function fibSphere(b: Builder, rnd: () => number, n: number, c: V3, r: number, col: RGB, s = 1, k = 1) {
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let q = 0; q < n; q++) {
    const y = 1 - (q / Math.max(1, n - 1)) * 2;
    const rr = Math.sqrt(1 - y * y);
    const th = g * q;
    const j = r * (0.97 + rnd() * 0.06);
    b.add(c[0] + Math.cos(th) * rr * j, c[1] + y * j, c[2] + Math.sin(th) * rr * j, col, s, k * (0.75 + rnd() * 0.4));
  }
}

// ── Builders ─────────────────────────────────────────────────────────

function scatter(N: number) {
  const b = new Builder(N);
  const rnd = mulberry32(3);
  while (b.left) {
    const u = rnd() * 2 - 1;
    const t = rnd() * TAU;
    const r = 3 + 9 * Math.cbrt(rnd());
    const s = Math.sqrt(1 - u * u);
    b.add(r * s * Math.cos(t), r * u, r * s * Math.sin(t) - 2, DUST, 0.7, 0.6);
  }
  return b.out();
}

function globeF(N: number, focus?: Iso | null) {
  const b = new Builder(N);
  const rnd = mulberry32(11);
  const R = 2.05;
  const land = globe.land;
  for (let k = 0; k < land.length; k += 2) {
    const [x, y, z] = latLon(land[k] / globe.landScale, land[k + 1] / globe.landScale, R);
    b.add(x, y, z, LAND, 1, (0.95 + rnd() * 0.45) * (focus ? 0.7 : 1));
  }
  const clusters = globe.clusters as Record<string, number[]>;
  for (const iso of ORDER) {
    const pts = clusters[iso];
    const on = !focus || focus === iso;
    for (let k = 0; k < pts.length; k += 2) {
      const [x, y, z] = latLon(pts[k] / globe.clusterScale, pts[k + 1] / globe.clusterScale, R * 1.012);
      b.add(x, y, z, GLOW[iso], on ? (focus ? 2 : 1.5) : 1, on ? 0.75 : 0.25);
    }
  }
  // Great-circle routes between the four, animated as a flowing dotted line.
  const pairs: [Iso, Iso][] = [["BIH", "SYC"], ["SYC", "MDV"], ["MDV", "VNM"], ["VNM", "BIH"], ["BIH", "MDV"], ["SYC", "VNM"]];
  const per = Math.min(150, Math.floor((b.left * 0.35) / pairs.length));
  const arcs: { j: number; a: V3; c: V3; d: number; ca: RGB; cb: RGB; u: number; k: number }[] = [];
  for (const [p, q] of pairs) {
    const a = latLon(...COUNTRIES[p].centroid, 1);
    const c = latLon(...COUNTRIES[q].centroid, 1);
    const d = Math.acos(Math.min(1, a[0] * c[0] + a[1] * c[1] + a[2] * c[2]));
    const lit = !focus || focus === p || focus === q;
    for (let s = 0; s < per; s++) {
      const u = s / per;
      const j = b.add(0, 0, 0, PAPER, 0.75, 0);
      arcs.push({ j, a, c, d, ca: GLOW[p], cb: GLOW[q], u, k: lit ? 0.7 : 0.15 });
    }
  }
  // Instrument ring around the globe, ticked every 15°.
  const ringN = Math.min(900, b.left);
  for (let s = 0; s < ringN; s++) {
    const t = (s / ringN) * TAU;
    const tick = s % Math.round(ringN / 24) === 0;
    const r = R * 1.45 + (tick ? 0.06 : 0);
    b.add(Math.cos(t) * r, 0, Math.sin(t) * r, PAPER, tick ? 1.4 : 0.6, tick ? 0.6 : 0.28);
  }
  // Atmosphere
  const haloN = Math.min(600, b.left);
  for (let s = 0; s < haloN; s++) {
    const u = rnd() * 2 - 1;
    const t = rnd() * TAU;
    const r = R * (1.05 + rnd() * 0.25);
    const sq = Math.sqrt(1 - u * u);
    b.add(r * sq * Math.cos(t), r * u, r * sq * Math.sin(t), SEA, 0.55, 0.12);
  }
  b.dust(rnd);
  const c = focus ? COUNTRIES[focus].centroid : null;
  return b.out({
    rot: c ? [c[0] * D2R, -(c[1] + 90) * D2R, 0] : [0.3, -(62 + 90) * D2R, 0],
    sway: c ? 0.06 : 0.38,
    camZ: c ? 8.4 : 10,
    dynamic: (t, pos, col) => {
      for (const A of arcs) {
        const u = (A.u + t * 0.045) % 1;
        const s = Math.sin(A.d);
        const wa = Math.sin((1 - u) * A.d) / s;
        const wb = Math.sin(u * A.d) / s;
        const lift = R * (1.02 + 0.22 * Math.sin(Math.PI * u) * (A.d / 1.2));
        pos[A.j * 3] = (A.a[0] * wa + A.c[0] * wb) * lift;
        pos[A.j * 3 + 1] = (A.a[1] * wa + A.c[1] * wb) * lift;
        pos[A.j * 3 + 2] = (A.a[2] * wa + A.c[2] * wb) * lift;
        const cc = mix(A.ca, A.cb, u);
        const pulse = A.k * (0.45 + 0.55 * Math.sin(Math.PI * u));
        col[A.j * 3] = cc[0] * pulse;
        col[A.j * 3 + 1] = cc[1] * pulse;
        col[A.j * 3 + 2] = cc[2] * pulse;
      }
    },
  });
}

function spheres(N: number, values: number[], labels: string[]) {
  const b = new Builder(N);
  const rnd = mulberry32(21);
  const max = Math.max(...values);
  const r = values.map((v) => Math.max(0.14, 1.75 * Math.cbrt(v / max)));
  const gap = 0.55;
  const total = r.reduce((s, x) => s + 2 * x, 0) + gap * (r.length - 1);
  const sc = Math.min(1, 6.2 / total);
  let x = (-total * sc) / 2;
  const w = r.map((x) => x * x);
  const ws = w.reduce((a, c) => a + c, 0);
  const budget = Math.floor(N * 0.86);
  const out: Label[] = [];
  ORDER.forEach((iso, i) => {
    const rr = r[i] * sc;
    const cx = x + rr;
    x += (2 * r[i] + gap) * sc;
    const cy = -1.6 + rr;
    const n = Math.max(160, Math.floor((budget * w[i]) / ws));
    fibSphere(b, rnd, n, [cx, cy, 0], rr, GLOW[iso], rr < 0.3 ? 1.3 : 1);
    out.push({ p: [cx, cy + rr + 0.38, 0], text: labels[i], sub: COUNTRIES[iso].short, iso });
  });
  b.dust(rnd);
  return b.out({ labels: out, camZ: 10, sway: 0.1 });
}

function bars(N: number, values: number[], labels: string[], highlight?: Iso | null) {
  const b = new Builder(N);
  const rnd = mulberry32(31);
  const y0 = -2.1;
  const H = values.map((v) => 0.18 + 4.1 * Math.max(0, v));
  const W = 0.78;
  floorGrid(b, Math.floor(N * 0.1), y0, 5.6, 2.6);
  const budget = Math.floor(N * 0.8);
  const area = H.map((h) => 4 * W * h + 2 * W * W);
  const as = area.reduce((a, c) => a + c, 0);
  const out: Label[] = [];
  ORDER.forEach((iso, i) => {
    const cx = (i - 1.5) * 1.25;
    const on = !highlight || highlight === iso;
    box(b, rnd, Math.floor((budget * area[i]) / as), cx, y0, 0, W, H[i], W, GLOW[iso], on ? 1 : 0.3);
    out.push({ p: [cx, y0 + H[i] + 0.36, 0], text: labels[i], sub: COUNTRIES[iso].short, iso });
  });
  b.dust(rnd);
  return b.out({ labels: out, rot: [0.12, -0.32, 0], sway: 0.12, camZ: 10.4 });
}

function pairs(N: number, a: number[], c: number[], labels: [string, string][]) {
  const b = new Builder(N);
  const rnd = mulberry32(41);
  const y0 = -2.1;
  floorGrid(b, Math.floor(N * 0.08), y0, 5.9, 2.4);
  const budget = Math.floor(N * 0.82);
  const ha = a.map((v) => 0.15 + 4.1 * v);
  const hb = c.map((v) => 0.15 + 4.1 * v);
  const tot = ha.reduce((s, x) => s + x, 0) + hb.reduce((s, x) => s + x, 0);
  const out: Label[] = [];
  ORDER.forEach((iso, i) => {
    const cx = (i - 1.5) * 1.38;
    box(b, rnd, Math.floor((budget * ha[i]) / tot), cx - 0.28, y0, 0, 0.46, ha[i], 0.46, GLOW[iso], 1);
    box(b, rnd, Math.floor((budget * hb[i]) / tot), cx + 0.28, y0, 0, 0.46, hb[i], 0.46, mix(GLOW[iso], PAPER, 0.55), 0.75, true);
    out.push({ p: [cx - 0.28, y0 + ha[i] + 0.3, 0], text: labels[i][0], iso });
    out.push({ p: [cx + 0.34, y0 + hb[i] + 0.3, 0], text: labels[i][1], sub: COUNTRIES[iso].short, iso });
  });
  b.dust(rnd);
  return b.out({ labels: out, rot: [0.1, -0.28, 0], sway: 0.1, camZ: 10.4 });
}

function crowd(N: number, iso: Iso, flow: number, label: string) {
  const b = new Builder(N);
  const rnd = mulberry32(51);
  const n = Math.floor(N * 0.78);
  const movers: { j: number; x: number; z: number; u: number; sp: number }[] = [];
  const share = Math.min(0.45, Math.abs(flow));
  for (let q = 0; q < n; q++) {
    const a = rnd() * TAU;
    const rr = Math.sqrt(rnd());
    const x = Math.cos(a) * rr * 1.9;
    const z = Math.sin(a) * rr * 1.15;
    const y = -1.5 + rnd() * 0.22;
    const moving = rnd() < share;
    const j = b.add(x, y, z, moving ? PAPER : GLOW[iso], moving ? 1.1 : 0.95, moving ? 0.8 : 0.75 + rnd() * 0.35);
    if (moving) movers.push({ j, x, z, u: rnd(), sp: 0.05 + rnd() * 0.05 });
  }
  b.dust(rnd);
  const out = flow < 0 ? -1 : 1;
  return b.out({
    labels: [{ p: [flow < 0 ? -2.6 : 2.6, 1.9, 0], text: label, sub: COUNTRIES[iso].short, iso }],
    rot: [0.42, 0, 0],
    camZ: 9.5,
    dynamic: (t, pos, col) => {
      for (const m of movers) {
        const u0 = (m.u + t * m.sp) % 1;
        const u = out < 0 ? u0 : 1 - u0;
        const e = u * u;
        // Leave the crowd, arc up and away toward the upper left (or arrive from the right).
        const ex = out < 0 ? -5.8 : 5.8;
        pos[m.j * 3] = m.x + (ex - m.x) * e;
        pos[m.j * 3 + 1] = -1.4 + Math.sin(Math.PI * Math.min(1, u * 1.2)) * 2.6 * u + u * 1.2;
        pos[m.j * 3 + 2] = m.z * (1 - e);
        const f = 0.85 * (1 - u * 0.9);
        col[m.j * 3] = PAPER[0] * f;
        col[m.j * 3 + 1] = PAPER[1] * f;
        col[m.j * 3 + 2] = PAPER[2] * f;
      }
    },
  });
}

function rings(N: number, kept: number[], labels: string[], only?: Iso) {
  const b = new Builder(N);
  const rnd = mulberry32(61);
  const list = only ? [only] : ORDER;
  const R = only ? 1.7 : 0.88;
  const streams: { j: number; cx: number; cy: number; a0: number; u: number; r0: number }[] = [];
  const out: Label[] = [];
  list.forEach((iso, i) => {
    const idx = ORDER.indexOf(iso);
    const cx = only ? 0 : (i % 2 ? 1.25 : -1.25);
    const cy = only ? 0.1 : (i < 2 ? 1.15 : -1.25);
    const keep = kept[idx] / 100;
    const n = Math.floor((N * (only ? 0.62 : 0.17)));
    for (let q = 0; q < n; q++) {
      const f = q / n;
      const a = Math.PI / 2 + f * TAU;
      const inKept = f < keep;
      const tube = (rnd() - 0.5) * (only ? 0.22 : 0.12);
      const rr = R + tube;
      b.add(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, (rnd() - 0.5) * 0.16, inKept ? GLOW[iso] : PAPER, inKept ? 1 : 0.6, inKept ? 0.9 : 0.12);
    }
    const leak = 1 - keep;
    const sn = Math.floor(Math.max(18, leak * (only ? 5200 : 2600)));
    for (let q = 0; q < sn; q++) {
      const j = b.add(cx, cy, 0, PAPER, 0.9, 0.7);
      streams.push({ j, cx, cy, a0: Math.PI / 2 + (keep + rnd() * leak) * TAU, u: rnd(), r0: R });
    }
    out.push({ p: [cx, cy - R - 0.42, 0], text: labels[idx], sub: COUNTRIES[iso].short, iso });
  });
  b.dust(rnd);
  return b.out({
    labels: out,
    camZ: 10,
    sway: 0.08,
    dynamic: (t, pos, col) => {
      for (const s of streams) {
        const u = (s.u + t * 0.12) % 1;
        const r = s.r0 + u * 2.2;
        const a = s.a0 - u * 0.9;
        pos[s.j * 3] = s.cx + Math.cos(a) * r;
        pos[s.j * 3 + 1] = s.cy + Math.sin(a) * r;
        pos[s.j * 3 + 2] = u * 1.4;
        const f = 0.8 * (1 - u);
        col[s.j * 3] = PAPER[0] * f;
        col[s.j * 3 + 1] = PAPER[1] * f;
        col[s.j * 3 + 2] = PAPER[2] * f;
      }
    },
  });
}

function catmull(p: number[][], t: number) {
  const n = p.length - 1;
  const s = Math.min(n - 1e-6, Math.max(0, t * n));
  const i = Math.floor(s);
  const f = s - i;
  const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[Math.min(n, i + 1)], p3 = p[Math.min(n, i + 2)];
  return p1.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f * f + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f * f * f));
}

function ribbons(N: number, series: number[][], isos: Iso[], years: number[], labels: string[]) {
  const b = new Builder(N);
  const rnd = mulberry32(71);
  const max = Math.max(...series.flat().map(Math.abs), 4);
  const sy = 3.3 / max;
  const yb = -1.3;
  const x0 = -2.4;
  const x1 = 2.4;
  const X = (i: number) => x0 + ((x1 - x0) * i) / (years.length - 1);
  // zero line and year ticks
  for (let q = 0; q < 260; q++) b.add(x0 + (q / 259) * (x1 - x0), yb, 0, PAPER, 0.6, 0.3);
  years.forEach((_, i) => {
    for (let q = 0; q < 40; q++) b.add(X(i), yb - 0.6 + (q / 39) * 4.4, -1.2, LAND, 0.55, 0.35);
  });
  const flowers: { j: number; pts: number[][]; u: number; z: number }[] = [];
  const out: Label[] = [];
  const per = Math.floor((N * 0.72) / series.length);
  series.forEach((s, k) => {
    const iso = isos[k];
    const z = isos.length > 1 ? (k - (isos.length - 1) / 2) * 0.55 : 0;
    const pts = s.map((val, i) => [X(i), yb + val * sy, z]);
    for (let q = 0; q < per; q++) {
      const u = q / per;
      const p = catmull(pts, u);
      const flowing = q % 7 === 0;
      const j = b.add(p[0], p[1] + (rnd() - 0.5) * 0.05, p[2] + (rnd() - 0.5) * 0.12, GLOW[iso], flowing ? 1.6 : 0.95, flowing ? 1.2 : 0.75);
      if (flowing) flowers.push({ j, pts, u, z });
    }
    // markers at each year
    pts.forEach((p) => fibSphere(b, rnd, 28, [p[0], p[1], p[2]], 0.07, GLOW[iso], 1.1, 1.3));
    const last = pts[pts.length - 1];
    out.push({ p: [last[0] + 0.25, last[1] + 0.25, last[2]], text: labels[k], sub: COUNTRIES[iso].short, iso });
  });
  years.forEach((y, i) => out.push({ p: [X(i), yb - 0.85, -1.2], text: String(y) }));
  b.dust(rnd);
  return b.out({
    labels: out,
    rot: [0.16, -0.38, 0],
    sway: 0.1,
    camZ: 10.6,
    dynamic: (t, pos) => {
      for (const f of flowers) {
        const p = catmull(f.pts, (f.u + t * 0.06) % 1);
        pos[f.j * 3] = p[0];
        pos[f.j * 3 + 1] = p[1];
        pos[f.j * 3 + 2] = p[2];
      }
    },
  });
}

/** A coin face: rim, beaded border and a guilloche rose with `k` petals. */
function coinFace(n: number, rnd: () => number, R: number, k: number) {
  const pts: { p: V3; rim: boolean }[] = [];
  for (let q = 0; q < n; q++) {
    const sel = rnd();
    const a = rnd() * TAU;
    if (sel < 0.3) pts.push({ p: [Math.cos(a) * R, Math.sin(a) * R, (rnd() - 0.5) * 0.1], rim: true });
    else if (sel < 0.42) pts.push({ p: [Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86, 0], rim: true });
    else {
      const strand = Math.floor(rnd() * 3);
      const r = R * (0.48 + 0.3 * Math.cos(k * a + (strand * TAU) / (3 * k)));
      pts.push({ p: [Math.cos(a) * r, Math.sin(a) * r, 0.02 * strand], rim: false });
    }
  }
  return pts;
}

function coins(N: number, only?: Iso) {
  const b = new Builder(N);
  const rnd = mulberry32(81);
  const list = only ? [only] : ORDER;
  const R = only ? 1.25 : 0.62;
  const petals: Record<Iso, number> = { BIH: 9, SYC: 18, VNM: 4, MDV: 12 };
  type P = { j: number; base: V3; g: number };
  const parts: P[] = [];
  const out: Label[] = [];
  const per = Math.floor((N * 0.8) / (list.length * 1.6));
  const names: Record<Iso, string> = { BIH: "Board · fixed to €", SYC: "Float", VNM: "Administered", MDV: "Peg · tied to $" };
  list.forEach((iso, i) => {
    const gx = only ? 0 : (i - 1.5) * 1.62;
    const face = coinFace(per, rnd, R, petals[iso]);
    for (const f of face) {
      const j = b.add(gx + f.p[0], f.p[1], f.p[2], GLOW[iso], f.rim ? 1.1 : 0.9, f.rim ? 1 : 0.8);
      parts.push({ j, base: [f.p[0], f.p[1], f.p[2]], g: i * 2 });
    }
    // anchor coin: € for the board, $ for the peg
    if (iso === "BIH" || iso === "MDV") {
      const anchor = coinFace(Math.floor(per * 0.6), rnd, R * 0.8, 6);
      for (const f of anchor) {
        const j = b.add(gx, 0, 0, PAPER, f.rim ? 1 : 0.8, 0.55);
        parts.push({ j, base: [f.p[0], f.p[1], f.p[2]], g: i * 2 + 1 });
      }
    }
    out.push({ p: [gx, -R - 0.75, 0], text: names[iso], sub: COUNTRIES[iso].short, iso });
  });
  b.dust(rnd);
  const ease = (x: number) => x * x * (3 - 2 * x);
  return b.out({
    labels: out,
    camZ: only ? 8.5 : 10,
    dynamic: (t, pos) => {
      for (const p of parts) {
        const i = only ? 0 : Math.floor(p.g / 2);
        const iso = list[i];
        const anchor = p.g % 2 === 1;
        const gx = only ? 0 : (i - 1.5) * 1.62;
        let ox = gx, oy = 0, rotY = 0;
        const oz = 0;
        if (iso === "BIH") {
          rotY = Math.sin(t * 0.6) * 0.9; // the pair turns as one rigid body
          ox += anchor ? 0 : 0;
          oy += anchor ? R * 1.25 : 0;
        } else if (iso === "SYC") {
          oy = Math.sin(t * 1.3) * 0.35;
          rotY = Math.sin(t * 1.3 + 1) * 0.6;
        } else if (iso === "VNM") {
          const c = (t * 0.5) % 4;
          oy = -0.45 + 0.3 * (Math.floor(c) + ease(Math.min(1, (c % 1) * 3)));
          if (c > 3.7) oy = -0.45 + 0.9 * (1 - (c - 3.7) / 0.3) + 0.0;
          rotY = t * 0.4;
        } else {
          const sw = Math.sin(t * 0.9) * 0.18;
          if (anchor) oy = R * 1.6;
          else {
            ox += Math.sin(sw) * 0.35;
            oy = -0.1;
          }
          rotY = sw * 2;
        }
        const [bx, by, bz] = p.base;
        const c = Math.cos(rotY), s = Math.sin(rotY);
        pos[p.j * 3] = ox + bx * c + bz * s;
        pos[p.j * 3 + 1] = oy + by;
        pos[p.j * 3 + 2] = oz - bx * s + bz * c;
      }
    },
  });
}

// ── Landmarks ────────────────────────────────────────────────────────

function sculpture(N: number, iso: Iso): Formation {
  const b = new Builder(N);
  const rnd = mulberry32(91 + ORDER.indexOf(iso));
  const C = GLOW[iso];
  const waves: { j: number; x: number; z: number; base: number; r?: number }[] = [];
  const water = (n: number, y: number, w: number, d: number, col: RGB, k: number, radial = false) => {
    for (let q = 0; q < n; q++) {
      let x: number, z: number;
      if (radial) {
        const a = rnd() * TAU;
        const r = w * Math.sqrt(rnd());
        x = Math.cos(a) * r;
        z = Math.sin(a) * r * d;
      } else {
        x = (rnd() - 0.5) * w;
        z = (rnd() - 0.5) * d;
      }
      const j = b.add(x, y, z, col, 0.7, k * (0.5 + rnd() * 0.5));
      waves.push({ j, x, z, base: y, r: Math.hypot(x, z) });
    }
  };
  let rot: V3 = [0.15, -0.4, 0];
  let camZ = 9.6;
  let spin = 0;

  if (iso === "BIH") {
    // Stari Most: a single pointed stone arch between two towers, over the Neretva.
    const n = Math.floor(N * 0.42);
    for (let q = 0; q < n; q++) {
      const t = rnd();
      const x = (t - 0.5) * 4.2;
      const arch = 1.35 * Math.pow(Math.cos(((t - 0.5) * Math.PI) / 1.0), 0.8);
      const ring = rnd();
      const z = (rnd() - 0.5) * 0.9;
      let y: number;
      if (ring < 0.35) y = -0.7 + arch; // intrados
      else if (ring < 0.65) y = -0.7 + arch + 0.32; // extrados
      else if (ring < 0.85) y = -0.7 + arch + rnd() * 0.32; // face
      else y = -0.7 + arch + 0.32 + 0.22; // parapet
      b.add(x, y, ring < 0.85 ? (ring < 0.75 ? (rnd() < 0.5 ? -0.45 : 0.45) : z) : (rnd() < 0.5 ? -0.45 : 0.45), C, 1, 0.75 + rnd() * 0.35);
    }
    const towers = Math.floor(N * 0.14);
    box(b, rnd, towers / 2, -2.55, -1.4, 0, 0.8, 2.2, 0.9, C, 0.75);
    box(b, rnd, towers / 2, 2.55, -1.4, 0, 0.8, 1.7, 0.9, C, 0.75);
    // Mountains behind
    for (let q = 0; q < N * 0.12; q++) {
      const x = (rnd() - 0.5) * 9;
      const h = 1.2 + Math.sin(x * 0.8) * 0.7 + Math.sin(x * 2.3 + 1) * 0.35;
      b.add(x, -1.5 + h * Math.sqrt(rnd()) * (rnd() < 0.4 ? 1 : 0.999), -2.6 - rnd() * 0.8, LAND, 0.8, 0.5);
    }
    water(Math.floor(N * 0.14), -1.55, 8, 3, GLOW.SYC, 0.55);
  } else if (iso === "SYC") {
    // Coco de mer: two fused lobes with a seam, sitting on granite boulders.
    const n = Math.floor(N * 0.5);
    for (let q = 0; q < n; q++) {
      const lobe = rnd() < 0.5 ? -1 : 1;
      const u = rnd() * 2 - 1;
      const a = rnd() * TAU;
      const s = Math.sqrt(1 - u * u);
      let x = s * Math.cos(a) * 0.95;
      const y = u * 1.25;
      const z = s * Math.sin(a) * 0.82;
      if (x * lobe < -0.25) x = -0.25 * lobe + (x + 0.25 * lobe) * 0.2; // flatten the inner face into a cleft
      b.add(x + lobe * 0.66, y + 0.45, z, C, 1, 0.7 + rnd() * 0.4);
    }
    for (let q = 0; q < N * 0.04; q++) b.add(0, -0.8 + rnd() * 2.5, (rnd() - 0.5) * 0.2, PAPER, 1, 0.6); // seam
    // granite boulders
    const stones: [number, number, number, number][] = [[-1.7, -1.35, 0.4, 0.75], [1.9, -1.4, -0.2, 0.62], [0.2, -1.55, 0.9, 0.5]];
    for (const [sx, sy, sz, sr] of stones) fibSphere(b, rnd, Math.floor(N * 0.05), [sx, sy, sz], sr, [0.62, 0.52, 0.5], 0.9, 0.7);
    water(Math.floor(N * 0.16), -1.75, 3.6, 0.55, C, 0.55, true);
    spin = 0.12;
    rot = [0.1, 0, 0];
  } else if (iso === "VNM") {
    // Lotus: three rings of petals around a seed pod, floating on rippled water.
    const layers = [
      { n: 8, tilt: 18, L: 1.85, W: 0.62, off: 0 },
      { n: 8, tilt: 42, L: 1.6, W: 0.55, off: 0.5 },
      { n: 6, tilt: 66, L: 1.25, W: 0.45, off: 0.25 },
    ];
    const total = Math.floor(N * 0.58);
    const per = Math.floor(total / layers.reduce((s, l) => s + l.n, 0));
    for (const l of layers) {
      for (let p = 0; p < l.n; p++) {
        const phi = ((p + l.off) / l.n) * TAU;
        for (let q = 0; q < per; q++) {
          const u = Math.sqrt(rnd());
          const edge = rnd() < 0.4;
          const v = edge ? (rnd() < 0.5 ? -1 : 1) : rnd() * 2 - 1;
          const w = Math.pow(Math.sin(Math.PI * Math.min(0.98, u)), 0.75) * l.W * (1 - 0.35 * u);
          const tilt = l.tilt * D2R + u * 0.5;
          const r = u * l.L * Math.cos(tilt);
          const y = u * l.L * Math.sin(tilt) * 0.85 + 0.15 * u * u;
          const lat = v * w;
          const x = Math.cos(phi) * r - Math.sin(phi) * lat;
          const z = Math.sin(phi) * r + Math.cos(phi) * lat;
          const tip = mix(C, [1, 0.72, 0.85], u * u * 0.6);
          b.add(x, y - 0.6, z, tip, edge ? 1.1 : 0.85, edge ? 1.05 : 0.7);
        }
      }
    }
    // seed pod
    for (let q = 0; q < N * 0.05; q++) {
      const a = rnd() * TAU;
      const r = 0.42 * Math.sqrt(rnd());
      b.add(Math.cos(a) * r, -0.15 + (rnd() < 0.7 ? 0.35 : rnd() * 0.35), Math.sin(a) * r, [0.95, 0.82, 0.45], 1, 0.85);
    }
    water(Math.floor(N * 0.2), -0.75, 4.2, 0.6, SEA, 0.6, true);
    rot = [0.42, 0, 0];
    spin = 0.1;
  } else {
    // Atoll: a broken ring of coral islands round a lagoon, villas on stilts.
    const n = Math.floor(N * 0.32);
    for (let q = 0; q < n; q++) {
      const a = rnd() * TAU;
      const seg = Math.sin(a * 9) + Math.sin(a * 4 + 1) * 0.6;
      if (seg < -0.25 && rnd() < 0.85) continue;
      const r = 2.25 + (rnd() - 0.5) * 0.36;
      const h = Math.max(0, 0.12 * (1 - Math.abs(r - 2.25) / 0.18));
      b.add(Math.cos(a) * r, -0.9 + h * rnd(), Math.sin(a) * r, mix(PAPER, [0.5, 0.85, 0.55], rnd() * 0.5), 1, 0.85);
    }
    // lagoon
    for (let q = 0; q < N * 0.14; q++) {
      const a = rnd() * TAU;
      const r = 2.05 * Math.sqrt(rnd());
      b.add(Math.cos(a) * r, -0.95, Math.sin(a) * r, mix(C, SEA, 0.5), 0.75, 0.45);
    }
    // overwater villas on a jetty
    for (let v = 0; v < 7; v++) {
      const vx = -0.2 + v * 0.3;
      box(b, rnd, Math.floor(N * 0.012), vx, -0.85, 1.2, 0.18, 0.14, 0.18, C, 1);
      for (let q = 0; q < 10; q++) b.add(vx, -0.95 + q * 0.012, 1.2, PAPER, 0.6, 0.5);
    }
    for (let q = 0; q < 120; q++) b.add(-0.4 + (q / 120) * 2.2, -0.86, 1.2 + 0.0, PAPER, 0.7, 0.6);
    water(Math.floor(N * 0.26), -1.0, 5, 1, SEA, 0.55, true);
    rot = [0.62, 0, 0];
    spin = 0.06;
    camZ = 9;
  }
  b.dust(rnd);
  return b.out({
    rot,
    camZ,
    spin,
    labels: [{ p: [0, iso === "BIH" ? 1.75 : iso === "MDV" ? 0.2 : 2.25, 0], text: COUNTRIES[iso].artifact.name, iso }],
    dynamic: (t, pos) => {
      for (const w of waves) {
        pos[w.j * 3 + 1] = w.base + 0.05 * Math.sin((w.r ?? w.x) * 3.2 - t * 1.4) + 0.025 * Math.sin(w.z * 4 + t);
      }
    },
  });
}

function rosette(N: number, iso: Iso, radii: number[], amps: number[], petals: number) {
  const b = new Builder(N);
  const rnd = mulberry32(101);
  const per = Math.floor((N * 0.84) / radii.length);
  const out: Label[] = [];
  radii.forEach((R0, layer) => {
    const R = 0.8 + 1.5 * R0;
    const A = 0.05 + amps[layer] * 0.022;
    const k = 0.4 + 0.6 * ((layer + 1) / radii.length);
    for (let q = 0; q < per; q++) {
      const strand = q % 4;
      const th = rnd() * TAU;
      const ph = (strand * TAU) / (4 * petals) + layer * 0.3;
      const r = R * (1 + A * Math.cos(petals * th + ph) + A * 0.6 * Math.cos(2 * petals * th - ph));
      const z = 0.18 * Math.sin(petals * th * 0.5 + ph) * (layer - 1);
      b.add(Math.cos(th) * r, Math.sin(th) * r, z, GLOW[iso], 0.85, k * (0.8 + rnd() * 0.3));
    }
  });
  b.dust(rnd);
  return b.out({ labels: out, spin: 0.05, rot: [0.25, 0, 0], camZ: 9 });
}

function helix(N: number, beads: { u: number; iso: Iso }[]) {
  const b = new Builder(N);
  const rnd = mulberry32(111);
  const L = 7.4;
  const turns = 3;
  const n = Math.floor(N * 0.6);
  const parts: { j: number; u: number; s: number; r: number }[] = [];
  for (let q = 0; q < n; q++) {
    const u = q / n;
    const s = q % 2;
    const j = b.add(0, 0, 0, s ? PAPER : LAND, 0.85, s ? 0.55 : 0.75);
    parts.push({ j, u, s, r: 0.85 });
  }
  for (const bd of beads) {
    for (let q = 0; q < 60; q++) {
      const j = b.add(0, 0, 0, GLOW[bd.iso], 1.3, 1.1);
      parts.push({ j, u: bd.u + (rnd() - 0.5) * 0.012, s: 2, r: 0.85 + (rnd() - 0.5) * 0.25 });
    }
  }
  // year dividers
  for (let y = 0; y <= turns; y++) for (let q = 0; q < 90; q++) {
    const a = (q / 90) * TAU;
    b.add(-L / 2 + (y / turns) * L, Math.cos(a) * 1.25, Math.sin(a) * 1.25, PAPER, 0.6, 0.3);
  }
  b.dust(rnd);
  return b.out({
    camZ: 10,
    dynamic: (t, pos) => {
      for (const p of parts) {
        const a = p.u * turns * TAU + (p.s === 1 ? Math.PI : 0) + t * 0.35;
        pos[p.j * 3] = -L / 2 + p.u * L;
        pos[p.j * 3 + 1] = Math.cos(a) * p.r;
        pos[p.j * 3 + 2] = Math.sin(a) * p.r;
      }
    },
  });
}

function scale(N: number, iso: Iso, left: number, right: number, labels: [string, string]) {
  const b = new Builder(N);
  const rnd = mulberry32(121);
  const half = 2.3;
  const theta0 = Math.max(-0.32, Math.min(0.32, ((right - left) / Math.max(left, right, 1)) * 0.45));
  // base and pole (static)
  for (let q = 0; q < N * 0.06; q++) b.add((rnd() - 0.5) * 0.06, -2.1 + rnd() * 3.3, (rnd() - 0.5) * 0.06, PAPER, 0.9, 0.6);
  for (let q = 0; q < N * 0.05; q++) {
    const a = rnd() * TAU;
    const r = 0.9 * Math.sqrt(rnd());
    b.add(Math.cos(a) * r, -2.15 + (0.9 - r) * 0.25, Math.sin(a) * r * 0.5, PAPER, 0.8, 0.45);
  }
  type P = { j: number; kind: "beam" | "L" | "R"; p: V3 };
  const parts: P[] = [];
  for (let q = 0; q < N * 0.08; q++) {
    const x = (rnd() - 0.5) * 2 * half;
    parts.push({ j: b.add(0, 0, 0, PAPER, 0.9, 0.7), kind: "beam", p: [x, (rnd() - 0.5) * 0.06, (rnd() - 0.5) * 0.06] });
  }
  const pan = (side: "L" | "R", amount: number, col: RGB) => {
    // strings
    for (let q = 0; q < 240; q++) {
      const s = q % 3;
      const a = (s / 3) * TAU;
      const t = rnd();
      parts.push({ j: b.add(0, 0, 0, PAPER, 0.6, 0.35), kind: side, p: [Math.cos(a) * 0.6 * t, -t * 1.1, Math.sin(a) * 0.3 * t] });
    }
    // dish
    for (let q = 0; q < 700; q++) {
      const a = rnd() * TAU;
      const r = 0.65 * Math.sqrt(rnd());
      parts.push({ j: b.add(0, 0, 0, PAPER, 0.8, 0.5), kind: side, p: [Math.cos(a) * r, -1.1 - (0.65 - r) * 0.25, Math.sin(a) * r * 0.5] });
    }
    // heap, sized by the amount
    const n = Math.floor(400 + amount * 70);
    for (let q = 0; q < n; q++) {
      const a = rnd() * TAU;
      const r = 0.6 * Math.sqrt(rnd());
      const h = (0.15 + amount * 0.022) * (1 - r / 0.6) * rnd();
      parts.push({ j: b.add(0, 0, 0, col, 1, 0.95), kind: side, p: [Math.cos(a) * r, -1.05 + h, Math.sin(a) * r * 0.5] });
    }
  };
  pan("L", left, GLOW[iso]);
  pan("R", right, PAPER);
  b.dust(rnd);
  const pivot: V3 = [0, 1.2, 0];
  return b.out({
    camZ: 10,
    labels: [
      { p: [-half - 0.1, -0.45 + theta0 * half, 0], text: labels[0], sub: "Income per head", iso },
      { p: [half + 0.1, -0.45 - theta0 * half, 0], text: labels[1], sub: "Consumer prices" },
    ],
    dynamic: (t, pos) => {
      const th = theta0 + Math.sin(t * 0.9) * 0.025;
      const c = Math.cos(th), s = Math.sin(th);
      for (const p of parts) {
        let x: number, y: number;
        if (p.kind === "beam") {
          x = p.p[0] * c + p.p[1] * s;
          y = -p.p[0] * s + p.p[1] * c;
          pos[p.j * 3] = pivot[0] + x;
          pos[p.j * 3 + 1] = pivot[1] + y;
          pos[p.j * 3 + 2] = p.p[2];
        } else {
          const ex = (p.kind === "L" ? -half : half) * c;
          const ey = -(p.kind === "L" ? -half : half) * s;
          pos[p.j * 3] = pivot[0] + ex + p.p[0];
          pos[p.j * 3 + 1] = pivot[1] + ey + p.p[1];
          pos[p.j * 3 + 2] = p.p[2];
        }
      }
    },
  });
}

function stack(N: number, iso: Iso, shares: number[], labels: string[]) {
  const b = new Builder(N);
  const rnd = mulberry32(131);
  const H = 4.2;
  const R = 1.15;
  const tot = shares.reduce((a, c) => a + c, 0) || 1;
  let y = -2.1;
  const out: Label[] = [];
  const tones = [0.45, 0.72, 1.05];
  shares.forEach((sh, i) => {
    const h = (sh / tot) * H;
    const n = Math.floor(N * 0.8 * (sh / tot));
    for (let q = 0; q < n; q++) {
      const a = rnd() * TAU;
      const edge = rnd() < 0.25;
      const yy = y + (edge ? (rnd() < 0.5 ? 0.02 : h - 0.02) : rnd() * h);
      b.add(Math.cos(a) * R, yy, Math.sin(a) * R, GLOW[iso], edge ? 1.1 : 0.9, tones[i] * (0.8 + rnd() * 0.3));
    }
    out.push({ p: [R + 0.35, y + h / 2, 0], text: labels[i] });
    y += h + 0.08;
  });
  b.dust(rnd);
  return b.out({ labels: out, spin: 0.15, rot: [0.2, 0, 0], camZ: 9.6 });
}

let textCanvas: HTMLCanvasElement | null = null;
function text(N: number, str: string, iso?: Iso | null) {
  const b = new Builder(N);
  const rnd = mulberry32(141);
  const W = 1400;
  const H = 360;
  textCanvas ??= document.createElement("canvas");
  const cv = textCanvas;
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.clearRect(0, 0, W, H);
  const fam = getComputedStyle(document.body).getPropertyValue("--font-bodoni").trim() || "serif";
  let px = 300;
  ctx.font = `600 ${px}px ${fam}`;
  const m = ctx.measureText(str).width;
  if (m > W * 0.92) {
    px = Math.floor((px * W * 0.92) / m);
    ctx.font = `600 ${px}px ${fam}`;
  }
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(str, W / 2, H / 2 + px * 0.04);
  const img = ctx.getImageData(0, 0, W, H).data;
  const cand: number[] = [];
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (img[(y * W + x) * 4 + 3] > 140) cand.push(x, y);
  const count = cand.length / 2;
  const want = Math.floor(N * 0.82);
  const s = 6.2 / W;
  const c = iso ? GLOW[iso] : PAPER;
  for (let q = 0; q < want && count; q++) {
    const k = q < count ? q : Math.floor(rnd() * count);
    const x = (cand[k * 2] - W / 2) * s + (q >= count ? (rnd() - 0.5) * 0.02 : 0);
    const y = -(cand[k * 2 + 1] - H / 2) * s;
    b.add(x, y, (rnd() - 0.5) * 0.35, c, 0.9, 0.75 + rnd() * 0.35);
  }
  b.dust(rnd);
  return b.out({ camZ: 9.5, sway: 0.18 });
}

export function build(spec: Spec, N: number): Formation {
  switch (spec.kind) {
    case "scatter":
      return scatter(N);
    case "globe":
      return globeF(N, spec.focus);
    case "spheres":
      return spheres(N, spec.values, spec.labels);
    case "bars":
      return bars(N, spec.values, spec.labels, spec.highlight);
    case "pairs":
      return pairs(N, spec.a, spec.b, spec.labels);
    case "crowd":
      return crowd(N, spec.iso, spec.flow, spec.label);
    case "rings":
      return rings(N, spec.kept, spec.labels, spec.only);
    case "ribbons":
      return ribbons(N, spec.series, spec.isos, spec.years, spec.labels);
    case "coins":
      return coins(N, spec.only);
    case "sculpture":
      return sculpture(N, spec.iso);
    case "rosette":
      return rosette(N, spec.iso, spec.radii, spec.amps, spec.petals);
    case "helix":
      return helix(N, spec.beads);
    case "scale":
      return scale(N, spec.iso, spec.left, spec.right, spec.labels);
    case "stack":
      return stack(N, spec.iso, spec.shares, spec.labels);
    case "text":
      return text(N, spec.text, spec.iso);
  }
}
