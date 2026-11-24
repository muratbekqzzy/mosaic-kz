#!/usr/bin/env node
/**
 * Imports downloaded images into the site.
 *
 * 1. Put the files in  public/_incoming/  named by what they are (any image extension):
 *      carrara.png  onyx.png  travertine.png  sage.png  nero.png       → stone textures
 *      bathroom.png kitchen.png floor.png                              → wall-scene rooms
 *      interior-01.png … interior-08.png                               → project gallery
 * 2. Run:  npm run import-assets
 *
 * Each file is resized (macOS `sips`), saved as an optimised JPEG in the right folder,
 * and config/site.ts is updated to use it. Missing files are simply skipped.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, parse } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const incoming = join(root, "public/_incoming");
const cfgPath = join(root, "config/site.ts");
if (!existsSync(incoming)) {
  mkdirSync(incoming, { recursive: true });
  console.log("Created public/_incoming — put your images there and run again.");
  process.exit(0);
}

const files = readdirSync(incoming).filter((f) => /\.(png|jpe?g|webp|heic|tiff?)$/i.test(f));
const byName = Object.fromEntries(files.map((f) => [parse(f).name.toLowerCase(), join(incoming, f)]));

function convert(src, dest, maxPx) {
  mkdirSync(parse(dest).dir, { recursive: true });
  execFileSync("sips", ["-Z", String(maxPx), "-s", "format", "jpeg", "-s", "formatOptions", "82", src, "--out", dest], { stdio: "ignore" });
}

let cfg = readFileSync(cfgPath, "utf8");
const done = [];

for (const stone of ["carrara", "onyx", "travertine", "sage", "nero"]) {
  const src = byName[stone];
  if (!src) continue;
  convert(src, join(root, `public/textures/${stone}.jpg`), 1600);
  cfg = cfg.replace(new RegExp(`(\\n\\s*${stone}: )(null as string \\| null|"[^"]*")`), `$1"/textures/${stone}.jpg"`);
  done.push(`texture  ${stone}`);
}

for (const room of ["bathroom", "kitchen", "floor"]) {
  const src = byName[room];
  if (!src) continue;
  convert(src, join(root, `public/images/rooms/${room}.jpg`), 2400);
  cfg = cfg.replace(new RegExp(`(${room}: )"[^"]*"`), `$1"/images/rooms/${room}.jpg"`);
  done.push(`room     ${room}`);
}

const interiors = [];
for (let i = 1; i <= 8; i++) {
  const id = String(i).padStart(2, "0");
  const src = byName[`interior-${id}`];
  const dest = `/images/interiors/${id}.jpg`;
  if (src) {
    convert(src, join(root, "public" + dest), 1600);
    done.push(`interior ${id}`);
  }
  interiors.push(existsSync(join(root, "public" + dest)) ? dest : `/images/interiors/${id}.svg`);
}
cfg = cfg.replace(/interiors: \[[^\]]*\][^\n]*/, `interiors: ${JSON.stringify(interiors)},`);

writeFileSync(cfgPath, cfg);
console.log(done.length ? "Imported:\n  " + done.join("\n  ") : "Nothing to import — check the file names in public/_incoming.");
