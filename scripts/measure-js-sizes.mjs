import { gzipSync } from "node:zlib";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:5197";
const OUT = process.env.OUT || "/Users/erickei/burst-3d-rebuild-shots/js-sizes.json";

function kiB(n) {
  return +(n / 1024).toFixed(2);
}

async function fetchBuf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const html = (await fetchBuf(BASE + "/")).toString("utf8");
const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
const unique = [...new Set(srcs)];

const initial = [];
for (const src of unique) {
  const url = src.startsWith("http") ? src : new URL(src, BASE).href;
  const buf = await fetchBuf(url);
  const gz = gzipSync(buf, { level: 9 });
  initial.push({
    src,
    raw: buf.length,
    gzip: gz.length,
    rawKiB: kiB(buf.length),
    gzipKiB: kiB(gz.length),
  });
}

// Discover lazy 3D chunks from the built client: look at all JS maps via /_next/static
// by fetching initial JS and following import() paths / chunk names.
const textOfInitial = (
  await Promise.all(
    initial.map(async (f) => {
      const url = f.src.startsWith("http") ? f.src : new URL(f.src, BASE).href;
      return (await fetchBuf(url)).toString("utf8");
    }),
  )
).join("\n");

// Also list files on disk
import { readdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";
const chunksDir = new URL(
  "../../../.next/static/chunks",
  import.meta.url,
).pathname;
// script lives in scripts/, repo root is parent
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, ".next/static/chunks");
const files = await readdir(dir);
const jsFiles = files.filter((f) => f.endsWith(".js"));

const all = [];
for (const f of jsFiles) {
  const buf = await readFile(path.join(dir, f));
  const gz = gzipSync(buf, { level: 9 });
  const text = buf.toString("utf8");
  const markers = [];
  if (/WebGLRenderer|THREE|from ['"]three['"]/.test(text) || /createShaderWarpOverlay|createPlanetScene|MeshPhysicalMaterial|RoomEnvironment/.test(text))
    markers.push("three-ish");
  if (/createShaderWarpOverlayAsync|createShipModel|habitation|radiator/.test(text))
    markers.push("ship");
  if (/createPlanetSceneAsync|ATMOS|hangar|setFocus/.test(text))
    markers.push("planet");
  if (/FrameSlicer|requestIdleCallback/.test(text) && /shipPrep/.test(text))
    markers.push("transition-wrapper");
  all.push({
    file: f,
    raw: buf.length,
    gzip: gz.length,
    rawKiB: kiB(buf.length),
    gzipKiB: kiB(gz.length),
    markers,
  });
}

const initialSet = new Set(unique.map((s) => path.basename(s.split("?")[0])));
const initialFiles = all.filter((f) => initialSet.has(f.file) || unique.some((s) => s.includes(f.file)));
const lazy3d = all.filter((f) => f.markers.length && !initialFiles.includes(f));

const sum = (arr, key) => arr.reduce((a, x) => a + x[key], 0);

const report = {
  initialScriptsInHtml: initial,
  initialGzipKiB: kiB(sum(initial, "gzip")),
  initialRawKiB: kiB(sum(initial, "raw")),
  modern: initial.filter((f) => !/polyfill|nomodule|legacy/i.test(f.src)),
  lazy3d,
  lazy3dGzipKiB: kiB(sum(lazy3d, "gzip")),
  lazy3dRawKiB: kiB(sum(lazy3d, "raw")),
  // Also flag if any initial file looks like three
  threeInInitial: initialFiles.filter((f) => f.markers.includes("three-ish")),
};
report.modernGzipKiB = kiB(sum(report.modern, "gzip"));

console.log(JSON.stringify(report, null, 2));
await writeFile(OUT, JSON.stringify(report, null, 2));
console.log("wrote", OUT);
