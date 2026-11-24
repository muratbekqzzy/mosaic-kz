/**
 * Procedural stone textures — used until you drop real photos into /public/textures
 * and set their paths in config/site.ts → assets.textures.
 */
export type StoneKey = "carrara" | "onyx" | "travertine" | "sage" | "nero";
export const STONE_KEYS: StoneKey[] = ["carrara", "onyx", "travertine", "sage", "nero"];

type RGB = [number, number, number];
type Recipe = {
  mode: "vein" | "band" | "layer";
  base: RGB;
  dark: RGB;
  light: RGB;
  freq: number;
  turb: number;
  sharp: number;
};

const RECIPES: Record<StoneKey, Recipe> = {
  carrara: { mode: "vein", base: [240, 237, 231], dark: [150, 150, 156], light: [222, 218, 211], freq: 1.4, turb: 2.4, sharp: 9 },
  sage: { mode: "vein", base: [118, 134, 114], dark: [214, 218, 204], light: [96, 112, 94], freq: 1.6, turb: 2.6, sharp: 14 },
  nero: { mode: "vein", base: [30, 28, 27], dark: [206, 200, 190], light: [48, 44, 42], freq: 1.5, turb: 2.8, sharp: 20 },
  onyx: { mode: "band", base: [222, 176, 112], dark: [168, 112, 58], light: [246, 222, 170], freq: 7, turb: 3.2, sharp: 2 },
  travertine: { mode: "layer", base: [214, 198, 174], dark: [168, 146, 116], light: [230, 218, 198], freq: 9, turb: 1.1, sharp: 3 },
};

function makeNoise(seed: number) {
  const perm = new Uint8Array(512);
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (h: number) => (h / 255) * 2 - 1;
  const fade = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const xi = Math.floor(x) & 255,
      yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x),
      yf = y - Math.floor(y);
    const a = grad(perm[perm[xi] + yi]),
      b = grad(perm[perm[xi + 1] + yi]);
    const c = grad(perm[perm[xi] + yi + 1]),
      d = grad(perm[perm[xi + 1] + yi + 1]);
    const u = fade(xf),
      v = fade(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; // -1..1
  };
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function renderStone(key: StoneKey, size = 256, seed = 7): HTMLCanvasElement {
  const r = RECIPES[key];
  const noise = makeNoise(seed + key.length * 131);
  const fbm = (x: number, y: number, oct = 5) => {
    let v = 0,
      amp = 0.5,
      f = 1;
    for (let i = 0; i < oct; i++) {
      v += amp * noise(x * f, y * f);
      f *= 2.03;
      amp *= 0.5;
    }
    return v;
  };

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size,
        v = y / size;
      const n = fbm(u * 4, v * 4);
      let c: RGB;
      if (r.mode === "vein") {
        const t1 = Math.abs(Math.sin((u * r.freq + v * r.freq * 0.55 + n * r.turb) * Math.PI));
        const t2 = Math.abs(Math.sin((u * r.freq * 1.7 - v * r.freq * 0.9 + fbm(u * 6 + 9, v * 6) * r.turb) * Math.PI));
        const vein = Math.pow(1 - t1, r.sharp) * 0.75 + Math.pow(1 - t1, r.sharp * 4) * 0.35 + Math.pow(1 - t2, r.sharp * 2.2) * 0.35;
        const cloud = (fbm(u * 2 + 3, v * 2) + 0.5) * 0.5;
        c = [0, 1, 2].map((i) => mix(mix(r.base[i], r.light[i], cloud), r.dark[i], Math.min(1, vein))) as RGB;
      } else if (r.mode === "band") {
        const t = (Math.sin((v * r.freq + n * r.turb + u * 0.8) * Math.PI) + 1) / 2;
        const fine = (Math.sin((v * r.freq * 5 + n * r.turb * 2) * Math.PI) + 1) / 2;
        c = [0, 1, 2].map((i) => mix(mix(r.dark[i], r.light[i], Math.pow(t, r.sharp)), r.base[i], fine * 0.35)) as RGB;
      } else {
        const layer = (Math.sin((v * r.freq + n * r.turb) * Math.PI) + 1) / 2;
        const pn = noise(u * 34, v * 140);
        const pore = pn > 0.66 ? Math.min(1, (pn - 0.66) * 5) : 0;
        const tone = (fbm(u * 3, v * 3) + 0.5) * 0.6;
        c = [0, 1, 2].map((i) => mix(mix(r.base[i], r.light[i], layer * 0.5 + tone * 0.4), r.dark[i], pore * 0.55)) as RGB;
      }
      const grain = (Math.random() - 0.5) * 6;
      const o = (y * size + x) * 4;
      d[o] = c[0] + grain;
      d[o + 1] = c[1] + grain;
      d[o + 2] = c[2] + grain;
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

const cache = new Map<string, HTMLCanvasElement>();
export function getStone(key: StoneKey, size = 256) {
  const id = `${key}@${size}`;
  if (!cache.has(id)) cache.set(id, renderStone(key, size));
  return cache.get(id)!;
}

/** Fallback colours used before the textures are generated (SSR, first paint). */
export const STONE_FALLBACK: Record<StoneKey, string> = {
  carrara: "#F2EFEA",
  onyx: "#D9A867",
  travertine: "#D9CBB5",
  sage: "#8E9C88",
  nero: "#2A2826",
};
