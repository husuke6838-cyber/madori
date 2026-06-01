#!/usr/bin/env node
/**
 * SVG → PNG converter.
 * 192/512 PNG を生成して public/ に書き出す。
 * sharp を使うので追加依存無し（Next.js 同梱）。
 *
 * 使い方: `node scripts/gen-icons.mjs`
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "public/logo-app-icon.svg");

async function gen(size) {
  const svg = await readFile(src);
  const buf = await sharp(svg)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const out = resolve(root, `public/icon-${size}.png`);
  await writeFile(out, buf);
  console.log(`✓ ${out} (${buf.byteLength} bytes)`);
}

await gen(192);
await gen(512);
await gen(180); // apple touch icon
console.log("done");
