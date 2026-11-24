/**
 * ORNAMENT ENGINE — Kazakh-inspired motifs built from stone pieces.
 *
 * Everything grows from one curve: the ram's horn (қошқар мүйіз), a scroll that bends
 * gently one way, then tightens into a spiral curl. Its curvature rises along its length,
 * so the curl is a true spiral. Arms of it make the spiral flower (rosette); its outline
 * makes the paisley petal; tesserae laid along it make the mosaic (opus vermiculatum).
 *
 * Units are abstract (a rosette is ~1 unit in radius); canvases scale them to pixels.
 */
export type Pt = [number, number];

/** A single stone piece. t = when it appears along the reveal (0..1). */
export type Tessera = { x: number; y: number; w: number; h: number; a: number; c: string; t: number; seed: number };
/** A gold guide line that draws ahead of the pieces. */
export type Guide = { pts: Pt[]; t0: number; t1: number };
export type Design = { tesserae: Tessera[]; guides: Guide[]; radius: number; extent?: [number, number] };

/* ------------------------------------------------------------------ palette */
export const SOFT = {
  paper: "#F4EEE3",
  linen: "#EAE1D2",
  rose: "#D6A39C",
  roseDeep: "#B97A73",
  blush: "#ECCFC6",
  sage: "#A7BCA5",
  sageDeep: "#6F8B77",
  celadon: "#C9D8C5",
  teal: "#7F9FA3",
  terracotta: "#C7825F",
  gold: "#C2A05A",
  goldHi: "#DFC68E",
  pomegranate: "#9C2F3D",
  ink: "#2B2521",
} as const;

/* ------------------------------------------------------------------ math */
export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const rot = ([x, y]: Pt, a: number): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

/**
 * The ram's-horn curve, integrated like a turtle: curvature κ(u) = (a + b·u^p) / L.
 * a < 0 gives the first soft counter-bend (the S), b·u^p the accelerating curl.
 * Returns points + tangent angles, starting at the origin heading along +x.
 */
export function hornCurve(L = 1, { a = -1.1, b = 34, p = 2.5, steps = 260 } = {}) {
  const ds = L / steps;
  let x = 0,
    y = 0,
    th = 0;
  const pts: Pt[] = [[0, 0]];
  const ang: number[] = [0];
  for (let i = 1; i <= steps; i++) {
    const u = i / steps;
    th += ((a + b * Math.pow(u, p)) / L) * ds;
    x += Math.cos(th) * ds;
    y += Math.sin(th) * ds;
    pts.push([x, y]);
    ang.push(th);
  }
  return { pts, ang };
}

/** Sample a polyline (with angles) at arc fraction u. */
function at(pts: Pt[], ang: number[], u: number) {
  const f = Math.min(pts.length - 1.0001, Math.max(0, u * (pts.length - 1)));
  const i = Math.floor(f),
    k = f - i;
  return {
    x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k,
    y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k,
    a: ang[i] + (ang[i + 1] - ang[i]) * k,
  };
}

/**
 * Lay tesserae along a curve: a main row, flanked by two thin outline rows —
 * how mosaicists draw a line in stone.
 */
function layAlong(
  pts: Pt[],
  ang: number[],
  L: number,
  opts: { w0: number; w1: number; main: string[]; edge: string[]; t0: number; t1: number; seed: number; gold?: number },
): Tessera[] {
  const out: Tessera[] = [];
  let s = 0;
  let n = 0;
  while (s < L * 0.985) {
    const u = s / L;
    const w = opts.w0 + (opts.w1 - opts.w0) * Math.pow(u, 0.8);
    const len = Math.max(w * 0.62, L * 0.006);
    const p = at(pts, ang, u);
    const nx = -Math.sin(p.a),
      ny = Math.cos(p.a);
    const seed = opts.seed * 1000 + n++;
    const t = opts.t0 + (opts.t1 - opts.t0) * u;
    const jitter = (k: number) => (rand(seed + k) - 0.5);
    const goldPiece = rand(seed + 9) < (opts.gold ?? 0.04);
    // main row
    out.push({
      x: p.x + jitter(1) * w * 0.05,
      y: p.y + jitter(2) * w * 0.05,
      w: len * 0.9,
      h: w * 0.78,
      a: p.a + jitter(3) * 0.12,
      c: goldPiece ? SOFT.gold : opts.main[Math.floor(rand(seed + 4) * opts.main.length)],
      t,
      seed,
    });
    // outline rows
    const ew = w * 0.26;
    for (const side of [-1, 1]) {
      const off = (w * 0.78) / 2 + ew * 0.75;
      out.push({
        x: p.x + nx * off * side,
        y: p.y + ny * off * side,
        w: len * 0.86,
        h: ew,
        a: p.a + jitter(5 + side) * 0.1,
        c: opts.edge[Math.floor(rand(seed + 6 + side) * opts.edge.length)],
        t: t + 0.004,
        seed: seed + side * 7,
      });
    }
    s += len;
  }
  return out;
}

/* ------------------------------------------------------------------ designs */

export type RosetteOptions = {
  arms?: number;
  palettes?: { main: string[]; edge: string[] }[];
  centre?: string[];
  seed?: number;
  /** reveal window inside the design's own 0..1 */
  span?: [number, number];
};

/**
 * The spiral flower: n ram's-horn arms around a ringed centre — the brand's mark,
 * and the motif every scene grows from.
 */
export function rosette({
  arms = 8,
  palettes = [
    { main: [SOFT.rose, SOFT.blush, SOFT.rose], edge: [SOFT.roseDeep, SOFT.terracotta] },
    { main: [SOFT.sage, SOFT.celadon, SOFT.sage], edge: [SOFT.sageDeep, SOFT.teal] },
  ],
  centre = [SOFT.gold, SOFT.paper, SOFT.teal, SOFT.goldHi, SOFT.rose],
  seed = 1,
  span = [0, 1],
}: RosetteOptions = {}): Design {
  const [s0, s1] = span;
  const T = (x: number) => s0 + (s1 - s0) * x;
  const tesserae: Tessera[] = [];
  const guides: Guide[] = [];

  // centre: a pomegranate seed of stone, then rings laid in circles (opus circulatum)
  tesserae.push({ x: 0, y: 0, w: 0.05, h: 0.05, a: 0, c: SOFT.pomegranate, t: T(0), seed: seed * 7 });
  const rings = 4;
  for (let k = 1; k <= rings; k++) {
    const r = 0.03 + k * 0.026;
    const n = Math.round((2 * Math.PI * r) / 0.022);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + k * 0.3;
      const sd = seed * 5000 + k * 100 + i;
      tesserae.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        w: 0.018,
        h: 0.02,
        a: a + Math.PI / 2,
        c: centre[(k + (rand(sd) < 0.12 ? 1 : 0)) % centre.length],
        t: T(0.02 + k * 0.035 + (i / n) * 0.03),
        seed: sd,
      });
    }
  }

  // the arms: sweeping ram's horns, all turning the same way — a pinwheel, a spiral flower
  const L = 0.95;
  const { pts, ang } = hornCurve(L, { a: 1.5, b: 24, p: 2.6 });
  // a small curling leaf that springs from each arm's outer side
  const leafL = 0.36;
  const leaf = hornCurve(leafL, { a: -0.4, b: 20, p: 2.2, steps: 120 });
  const r0 = 0.15;
  for (let i = 0; i < arms; i++) {
    const base = (i / arms) * Math.PI * 2;
    const P = pts.map((p) => rot([p[0] + r0, p[1]], base));
    const A = ang.map((a) => a + base);
    const pal = palettes[i % palettes.length];
    const t0 = T(0.18 + (i % 2) * 0.03);
    const t1 = T(0.86 + (i % 2) * 0.03);
    tesserae.push(...layAlong(P, A, L, { w0: 0.1, w1: 0.024, main: pal.main, edge: pal.edge, t0, t1, seed: seed * 31 + i }));
    guides.push({ pts: P, t0: t0 - (s1 - s0) * 0.06, t1: t1 - (s1 - s0) * 0.06 });

    // leaf: starts a third of the way along the arm, turns outward, curls back
    const k = Math.floor(P.length * 0.3);
    const [lx, ly] = P[k];
    const la = A[k] - 0.95;
    const LP = leaf.pts.map(([x, y]) => {
      const [rx, ry] = rot([x, -y], la);
      return [rx + lx, ry + ly] as Pt;
    });
    const LA = leaf.ang.map((a) => -a + la);
    const lt0 = t0 + (t1 - t0) * 0.32;
    const lt1 = lt0 + (t1 - t0) * 0.45;
    const leafPal = { main: [SOFT.goldHi, SOFT.gold, SOFT.blush], edge: [SOFT.terracotta, SOFT.gold] };
    tesserae.push(...layAlong(LP, LA, leafL, { w0: 0.05, w1: 0.016, main: leafPal.main, edge: leafPal.edge, t0: lt0, t1: lt1, seed: seed * 53 + i, gold: 0 }));
    guides.push({ pts: LP, t0: lt0 - (s1 - s0) * 0.05, t1: lt1 - (s1 - s0) * 0.05 });
  }

  const radius = Math.max(...tesserae.map((t) => Math.hypot(t.x, t.y))) + 0.04;
  return { tesserae, guides, radius };
}

/** Offset a design (for compositions of several motifs on one canvas). */
export function placeDesign(d: Design, dx: number, dy: number, scale = 1, angle = 0): Design {
  const tf = (x: number, y: number): Pt => {
    const [rx, ry] = rot([x * scale, y * scale], angle);
    return [rx + dx, ry + dy];
  };
  return {
    tesserae: d.tesserae.map((t) => {
      const [x, y] = tf(t.x, t.y);
      return { ...t, x, y, w: t.w * scale, h: t.h * scale, a: t.a + angle };
    }),
    guides: d.guides.map((g) => ({ ...g, pts: g.pts.map(([x, y]) => tf(x, y)) })),
    radius: d.radius * scale + Math.hypot(dx, dy),
  };
}

export function mergeDesigns(...ds: Design[]): Design {
  return {
    tesserae: ds.flatMap((d) => d.tesserae),
    guides: ds.flatMap((d) => d.guides),
    radius: Math.max(...ds.map((d) => d.radius)),
  };
}

/**
 * Paisley petal (boteh) — the ram's horn given body: a tapered outline around the curve.
 * Returned as a closed polygon, ready for a Path2D or an SVG path.
 */
export function paisley(L = 1, w0 = 0.2, opts = { a: 1.4, b: 15, p: 2.4 }): Pt[] {
  const { pts, ang } = hornCurve(L, { ...opts, steps: 180 });
  const left: Pt[] = [],
    right: Pt[] = [];
  pts.forEach((p, i) => {
    const u = i / (pts.length - 1);
    // narrow stem → swelling body → long tapering tail that curls
    const body = Math.sin(Math.min(1, u * 2.4) * Math.PI * 0.5);
    const w = w0 * body * Math.pow(1 - u, 1.15) + 0.003;
    const nx = -Math.sin(ang[i]),
      ny = Math.cos(ang[i]);
    left.push([p[0] + nx * w, p[1] + ny * w]);
    right.push([p[0] - nx * w, p[1] - ny * w]);
  });
  return [...left, ...right.reverse()];
}

/** Polyline → SVG path data (for line ornaments drawn with stroke-dashoffset). */
export const toPathD = (pts: Pt[], k = 1, dx = 0, dy = 0) =>
  "M" + pts.map(([x, y]) => `${(x * k + dx).toFixed(2)},${(y * k + dy).toFixed(2)}`).join("L");

/** A single ram's-horn line, scaled (for corners, dividers and vines). */
export function hornLine(L: number, angle = 0, mirror = false, opts?: Parameters<typeof hornCurve>[1]): Pt[] {
  const { pts } = hornCurve(L, opts);
  return pts.map(([x, y]) => rot([x, mirror ? -y : y], angle));
}
