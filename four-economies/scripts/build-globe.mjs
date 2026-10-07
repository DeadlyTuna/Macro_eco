// Builds the dotted-globe point cloud used by the 3D scene.
// Land dots come from a Fibonacci sphere masked by Natural Earth land (world-atlas);
// each of the four countries gets a denser cluster sampled inside its borders,
// or along its real island chain where the polygons are too small to hit.
// Run: npm run data
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoContains, geoBounds } from "d3-geo";

const require = createRequire(import.meta.url);
const landTopo = JSON.parse(await readFile(require.resolve("world-atlas/land-110m.json"), "utf8"));
const countriesTopo = JSON.parse(await readFile(require.resolve("world-atlas/countries-50m.json"), "utf8"));
const land = feature(landTopo, landTopo.objects.land);
const countries = feature(countriesTopo, countriesTopo.objects.countries);

// Seeded RNG so the cloud is identical on every build.
let seed = 74;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const SPHERE = 26000;
const landPts = [];
const golden = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < SPHERE; i++) {
  const y = 1 - (i / (SPHERE - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = golden * i;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = ((Math.atan2(Math.sin(th) * r, Math.cos(th) * r) * 180) / Math.PI);
  if (geoContains(land, [lon, lat])) landPts.push(Math.round(lat * 10), Math.round(lon * 10));
}

const ISO_NUM = { BIH: "070", SYC: "690", VNM: "704", MDV: "462" };
// Real island coordinates (lat, lon) used when polygon sampling under-fills.
const ISLANDS = {
  SYC: [[-4.68, 55.48], [-4.33, 55.74], [-4.36, 55.83], [-3.72, 55.2], [-3.8, 55.67], [-5.42, 53.33], [-5.69, 53.66], [-7.02, 52.73], [-9.42, 46.4], [-9.71, 47.58], [-10.11, 47.74], [-10.1, 51.1], [-9.22, 51.03], [-7.14, 56.27], [-5.86, 55.38]],
  MDV: [[7.1, 72.9], [6.6, 73.0], [5.9, 73.3], [5.2, 73.1], [4.5, 73.5], [4.17, 73.51], [3.8, 72.9], [3.4, 73.6], [2.9, 73.0], [2.3, 73.3], [1.8, 73.4], [0.5, 73.2], [-0.3, 73.15], [-0.62, 73.1]],
};

const clusters = {};
for (const [iso, num] of Object.entries(ISO_NUM)) {
  const f = countries.features.find((d) => d.id === num);
  const pts = [];
  const want = iso === "VNM" ? 260 : iso === "BIH" ? 160 : 120;
  if (f && (iso === "VNM" || iso === "BIH")) {
    const [[x0, y0], [x1, y1]] = geoBounds(f);
    let tries = 0;
    while (pts.length < want * 2 && tries++ < 400000) {
      const lon = x0 + rand() * (x1 - x0);
      const lat = y0 + rand() * (y1 - y0);
      if (geoContains(f, [lon, lat])) pts.push(Math.round(lat * 100), Math.round(lon * 100));
    }
  } else {
    const isl = ISLANDS[iso];
    for (let k = 0; k < want; k++) {
      const [lat, lon] = isl[k % isl.length];
      const spread = iso === "MDV" ? 0.35 : 0.25;
      pts.push(Math.round((lat + (rand() - 0.5) * spread) * 100), Math.round((lon + (rand() - 0.5) * spread) * 100));
    }
  }
  clusters[iso] = pts;
}

await writeFile(
  new URL("../src/data/globe.json", import.meta.url),
  JSON.stringify({ land: landPts, landScale: 10, clusters, clusterScale: 100 })
);
console.log(`land dots: ${landPts.length / 2}`, Object.fromEntries(Object.entries(clusters).map(([k, v]) => [k, v.length / 2])));
