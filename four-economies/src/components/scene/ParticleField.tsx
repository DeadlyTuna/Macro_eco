"use client";
/* The simulation buffers are mutated every frame on purpose: that is how React Three Fiber
   drives GPU attributes without re-rendering React. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { build, mulberry32, type Formation } from "./formations";
import { useScene } from "./store";
import { colorOf } from "@/lib/countries";

const vert = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uScale;
  uniform float uDim;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.78 + 0.22 * sin(uTime * (1.2 + aSeed) + aSeed * 60.0);
    gl_PointSize = aSize * uScale * tw / max(0.5, -mv.z);
    vColor = aColor * tw * uDim;
  }
`;
const frag = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    a *= a;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

const pointer = { x: 0, y: 0 };
const wrap = (a: number) => a - Math.PI * 2 * Math.floor((a + Math.PI) / (Math.PI * 2));

function makeMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 60 }, uDim: { value: 1 } },
  });
}

export function ParticleField({ count, reduced }: { count: number; reduced: boolean }) {
  const { id, spec, align, dim } = useScene();
  const group = useRef<THREE.Group>(null);
  const cache = useRef(new Map<string, Formation>());
  const { size, camera, gl } = useThree();
  const [labels, setLabels] = useState<{ key: string; f: Formation } | null>(null);

  const sim = useMemo(() => {
    const rnd = mulberry32(7);
    const seed = new Float32Array(count);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seed[i] = rnd();
      speed[i] = 0.9 + rnd() * 1.5;
    }
    const start = build({ kind: "scatter" }, count);
    const pos = new Float32Array(start.pos);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(start.size);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return {
      geo,
      mat: makeMaterial(),
      pos,
      col,
      sz,
      seed,
      speed,
      f: start,
      dynPos: new Float32Array(count * 3),
      dynCol: new Float32Array(count * 3),
      swirl: 0,
      since: 0,
      spin: 0,
      time: 0,
      dim: 0,
    };
  }, [count]);


  const stars = useMemo(() => {
    const rnd = mulberry32(99);
    const n = 1400;
    const p = new Float32Array(n * 3);
    const c = new Float32Array(n * 3);
    const s = new Float32Array(n);
    const sd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1;
      const t = rnd() * Math.PI * 2;
      const r = 16 + rnd() * 18;
      const q = Math.sqrt(1 - u * u);
      p.set([r * q * Math.cos(t), r * u, r * q * Math.sin(t) - 8], i * 3);
      const k = 0.25 + rnd() * 0.35;
      c.set([0.75 * k, 0.8 * k, 1 * k], i * 3);
      s[i] = 1 + rnd() * 1.6;
      sd[i] = rnd();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(c, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(s, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(sd, 1));
    return { geo, mat: makeMaterial() };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => () => {
    sim.geo.dispose();
    sim.mat.dispose();
    stars.geo.dispose();
    stars.mat.dispose();
  }, [sim, stars]);

  // Switch formation
  useEffect(() => {
    let f = cache.current.get(id);
    if (!f) {
      f = build(spec, count);
      cache.current.set(id, f);
      if (cache.current.size > 40) cache.current.delete(cache.current.keys().next().value!);
    }
    const prev = sim.f;
    sim.f = f;
    sim.since = 0;
    if (f.dynamic) {
      sim.dynPos.set(f.pos);
      sim.dynCol.set(f.col);
    }
    const sameShape = prev.rot && f.rot && spec.kind === "globe" && prev.camZ !== undefined && prev.labels === undefined && f.labels === undefined;
    sim.swirl = reduced || sameShape ? 0 : 1;
    // Unwind any accumulated spin so the next view doesn't rewind through whole turns.
    if (group.current) {
      const ty = f.rot?.[1] ?? 0;
      group.current.rotation.y = ty + wrap(group.current.rotation.y - ty);
    }
    sim.spin = 0;
    const t = setTimeout(() => setLabels({ key: id, f: f! }), reduced ? 0 : 900);
    return () => clearTimeout(t);
  }, [id, spec, count, sim, reduced]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    sim.time += dt;
    sim.since += dt;
    const f = sim.f;
    const portrait = size.width / size.height < 1.05;

    if (f.dynamic) f.dynamic(sim.since + 4, sim.dynPos, sim.dynCol);
    const tp = f.dynamic ? sim.dynPos : f.pos;
    const tc = f.dynamic ? sim.dynCol : f.col;

    const active = f.dynamic || sim.since < 7 || sim.swirl > 0;
    if (active) {
      const { pos, col, sz, speed, seed } = sim;
      const kc = 1 - Math.exp(-dt * 3);
      const sw = sim.swirl;
      for (let i = 0; i < count; i++) {
        const k = reduced ? 1 : 1 - Math.exp(-dt * speed[i] * (f.dynamic && sim.since > 2.5 ? 6 : 1.6));
        const j = i * 3;
        let x = pos[j], y = pos[j + 1], z = pos[j + 2];
        if (sw > 0.001) {
          const a = sw * dt * (1.2 + seed[i] * 2.4);
          const c = Math.cos(a), s = Math.sin(a);
          const nx = x * c - z * s;
          z = x * s + z * c;
          x = nx;
          y += sw * dt * (seed[i] - 0.5) * 1.8;
        }
        pos[j] = x + (tp[j] - x) * k;
        pos[j + 1] = y + (tp[j + 1] - y) * k;
        pos[j + 2] = z + (tp[j + 2] - z) * k;
        col[j] += (tc[j] - col[j]) * kc;
        col[j + 1] += (tc[j + 1] - col[j + 1]) * kc;
        col[j + 2] += (tc[j + 2] - col[j + 2]) * kc;
        sz[i] += (f.size[i] - sz[i]) * kc;
      }
      sim.swirl = Math.max(0, sw - dt * 0.75);
      sim.geo.attributes.position.needsUpdate = true;
      sim.geo.attributes.aColor.needsUpdate = true;
      sim.geo.attributes.aSize.needsUpdate = true;
    }

    // Group pose: where on screen, which way it faces.
    const g = group.current!;
    const vp = state.viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, 0));
    const tx = portrait ? 0 : align === "right" ? vp.width * 0.23 : align === "left" ? -vp.width * 0.23 : 0;
    const ty = portrait ? 0.4 : 0;
    const damp = 1 - Math.exp(-dt * 2.2);
    g.position.x += (tx - g.position.x) * damp;
    g.position.y += (ty - g.position.y) * damp;
    const sc = portrait ? Math.max(0.5, (size.width / size.height) * 0.95) : 1;
    g.scale.setScalar(g.scale.x + (sc - g.scale.x) * damp);
    sim.spin += (f.spin ?? 0) * dt * (reduced ? 0 : 1);
    const [rx, ry, rz] = f.rot ?? [0, 0, 0];
    const sway = reduced ? 0 : (f.sway ?? 0) * Math.sin(sim.time * 0.16);
    g.rotation.x += (rx - g.rotation.x) * damp;
    g.rotation.y += (ry + sway + sim.spin - g.rotation.y) * damp;
    g.rotation.z += (rz - g.rotation.z) * damp;

    const cz = f.camZ ?? 10;
    camera.position.z += (cz - camera.position.z) * damp;
    const par = reduced ? 0 : 0.35;
    camera.position.x += (pointer.x * par - camera.position.x) * damp;
    camera.position.y += (-pointer.y * par - camera.position.y) * damp;
    camera.lookAt(0, 0, 0);

    sim.dim += ((portrait ? dim * 0.45 : dim) - sim.dim) * (1 - Math.exp(-dt * 1.5));
    const scale = 52 * gl.getPixelRatio() * (size.height / 900);
    for (const m of [sim.mat, stars.mat]) {
      m.uniforms.uTime.value = sim.time;
      m.uniforms.uScale.value = scale;
      m.uniforms.uDim.value = sim.dim;
    }
  });

  const showLabels = labels && labels.key === id && size.width >= 900 && labels.f.labels?.length;

  return (
    <>
      <points geometry={stars.geo} material={stars.mat} frustumCulled={false} />
      <group ref={group}>
        <points geometry={sim.geo} material={sim.mat} frustumCulled={false} />
        {showLabels &&
          labels.f.labels!.map((l, i) => (
            <Html key={`${labels.key}-${i}`} position={l.p} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
              <div className="scene-label" style={{ animationDelay: `${i * 70}ms` }}>
                {l.iso && <span className="scene-dot" style={{ background: colorOf(l.iso) }} />}
                <span className="scene-text">{l.text}</span>
                {l.sub && <span className="scene-sub">{l.sub}</span>}
              </div>
            </Html>
          ))}
      </group>
    </>
  );
}
