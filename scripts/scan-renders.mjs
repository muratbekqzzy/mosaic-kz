#!/usr/bin/env node
/** Writes config/renders.json listing the Blender renders that exist, so the site uses them. */
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const sheetsDir = join(root, "public/images/sheets");
const seqDir = join(root, "public/seq/split");
const sheets = {};
if (existsSync(sheetsDir))
  for (const f of readdirSync(sheetsDir)) if (f.endsWith(".webp")) sheets[f.replace(/\.webp$/, "")] = `/images/sheets/${f}`;
let split = null;
if (existsSync(seqDir)) {
  const frames = readdirSync(seqDir).filter((f) => /^\d{4}\.webp$/.test(f)).sort();
  if (frames.length > 1) split = { count: frames.length, ext: "webp" };
}
writeFileSync(join(root, "config/renders.json"), JSON.stringify({ sheets, split }, null, 2) + "\n");
console.log(`renders.json: ${Object.keys(sheets).length} sheets, split ${split ? split.count + " frames" : "none"}`);
