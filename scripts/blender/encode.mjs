// .blender-out/ の PNG を public/backgrounds/ の AVIF と WebP にする。
// 使い方: node scripts/blender/encode.mjs（sharp は next の依存に含まれる）
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = ".blender-out";
const TARGET = path.join("public", "backgrounds");
/** 1 枚の上限 */
const LIMIT = 200 * 1024;

await mkdir(TARGET, { recursive: true });
for (const file of (await readdir(SOURCE)).filter((f) => f.endsWith(".png"))) {
  const name = path.basename(file, ".png");
  const input = path.join(SOURCE, file);
  for (const [format, options] of [
    ["avif", { quality: 58, effort: 7 }],
    ["webp", { quality: 80, effort: 6, smartSubsample: true }],
  ]) {
    const output = path.join(TARGET, `${name}.${format}`);
    await sharp(input)[format](options).toFile(output);
    const { size } = await stat(output);
    console.log(`${output}\t${(size / 1024).toFixed(1)} KB`);
    if (size > LIMIT) process.exitCode = 1;
  }
}
