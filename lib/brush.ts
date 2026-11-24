/**
 * BRUSH — the intro's painted ribbons and the stone they condense into.
 *
 * Six long ram's-horn strokes sweep in from beyond the frame and curl together into
 * one large spiral flower. Each stroke has a brush-pressure profile (light touch-down,
 * full body, tapering into its curl). Tesserae are laid along the same stroke in two
 * rows and appear a beat behind the brush, as if the wet paint were setting into stone.
 *
 * Units: the shorter side of the screen spans -1..1.
 */
import { hornCurve, rand, type Pt } from "@/lib/ornament";

/** The intro palette — warm paper with six pigments that sit in harmony. */
export const PIGMENTS = {
  paper: "#F4EEE3",
  rose: "#D39A90",
  celadon: "#9CB8A0",
  terracotta: "#C98562",
  teal: "#6E979D",
  gold: "#C9A45E",
  plum: "#A9697A",
} as const;
const ORDER = [PIGMENTS.rose, PIGMENTS.celadon, PIGMENTS.terracotta, PIGMENTS.teal, PIGMENTS.plum, PIGMENTS.gold];

export type BrushTile = { x: number; y: number; w: number; h: number; a: number; c: string; t: number; seed: number };
export type Ribbon = {
  pts: Pt[];
  ang: number[];
  width: number[];
  color: string;
  /** seconds: when the brush lands and how long the stroke takes */
  start: number;
  dur: number;
};

/** Timing (seconds) of the whole opening. */
export const INTRO_T = {
  firstStroke: 0.35,
  strokeGap: 0.24,
  strokeDur: 3.3,
  /** how far the stone trails behind the brush */
  setLag: 1.7,
  /** how long one piece takes to condense from pigment into stone */
  condense: 0.95,
  paintFadeFrom: 4.6,
  paintFadeTo: 8.2,
  /** what is left of the watercolour beneath the finished mosaic */
  paintGhost: 0.2,
  centre: 5.4,
  total: 8.6,
};

const easeInOutSine = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
const invEaseInOutSine = (u: number) => Math.acos(1 - 2 * u) / Math.PI;
/** brush progress (0..1 along the stroke) at time t */
export const strokeAt = (r: Ribbon, t: number) => easeInOutSine(Math.min(1, Math.max(0, (t - r.start) / r.dur)));

/** Lighten (k>0) or darken (k<0) a hex colour. */
export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}

export function buildIntro(n = 6) {
  const ribbons: Ribbon[] = [];
  const tiles: BrushTile[] = [];
  // tuned so each stroke sweeps ~45° around the centre and curls at ~⅓ radius,
  // ringing the heart: six curls = one spiral flower
  const L = 1.45;
  const { pts, ang } = hornCurve(L, { a: -1.0, b: 26, p: 5.5, steps: 460 });
  const W0 = 0.092;

  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2 + 0.35;
    const r0 = 1.42;
    const sx = Math.cos(th) * r0,
      sy = Math.sin(th) * r0;
    const head = th + Math.PI; // aimed at the heart; the curve itself supplies the swirl
    const c = Math.cos(head),
      s = Math.sin(head);
    const P: Pt[] = pts.map(([x, y]) => [sx + x * c - y * s, sy + x * s + y * c]);
    const A = ang.map((a) => a + head);
    const width = P.map((_, k) => {
      const u = k / (P.length - 1);
      const press = Math.pow(Math.sin(Math.PI * (0.05 + 0.95 * u)), 0.55); // touch-down → body → lift
      return W0 * press * (1 - 0.5 * u) + 0.003;
    });
    const rb: Ribbon = {
      pts: P,
      ang: A,
      width,
      color: ORDER[i % ORDER.length],
      start: INTRO_T.firstStroke + i * INTRO_T.strokeGap,
      dur: INTRO_T.strokeDur,
    };
    ribbons.push(rb);

    // tesserae: two rows where the stroke is broad, one where it is fine
    let k = 0;
    let n2 = 0;
    while (k < P.length - 2) {
      const u = k / (P.length - 1);
      const w = width[k];
      const [x, y] = P[k];
      const a = A[k];
      const nx = -Math.sin(a),
        ny = Math.cos(a);
      const len = Math.max(w * 0.46, 0.0075);
      const twoRows = w > 0.03;
      const rows = twoRows ? [-0.25, 0.25] : [0];
      const h = twoRows ? w * 0.44 : w * 0.82;
      const born = rb.start + rb.dur * invEaseInOutSine(Math.min(0.999, u)) + INTRO_T.setLag;
      for (const off of rows) {
        const seed = i * 10000 + n2++;
        const jit = (q: number) => rand(seed + q) - 0.5;
        const gold = rb.color !== PIGMENTS.gold && rand(seed + 9) < 0.05;
        tiles.push({
          x: x + nx * off * w + jit(1) * w * 0.04,
          y: y + ny * off * w + jit(2) * w * 0.04,
          w: len * 0.9,
          h: h * 0.92,
          a: a + jit(3) * 0.14,
          c: gold ? PIGMENTS.gold : shade(rb.color, jit(4) * 0.22),
          t: born + rand(seed + 5) * 0.35,
          seed,
        });
      }
      // advance by one tile length along the stroke
      let d = 0;
      while (d < len && k < P.length - 2) {
        d += Math.hypot(P[k + 1][0] - P[k][0], P[k + 1][1] - P[k][1]);
        k++;
      }
    }
  }

  // the heart where all the strokes meet: a pomegranate stone in rings of gold and teal
  tiles.push({ x: 0, y: 0, w: 0.05, h: 0.05, a: 0.3, c: "#9C2F3D", t: INTRO_T.centre, seed: 1 });
  for (let ring = 1; ring <= 3; ring++) {
    const r = 0.028 + ring * 0.024;
    const m = Math.round((2 * Math.PI * r) / 0.02);
    for (let j = 0; j < m; j++) {
      const a = (j / m) * Math.PI * 2;
      tiles.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        w: 0.016,
        h: 0.018,
        a: a + Math.PI / 2,
        c: ring === 2 ? PIGMENTS.teal : shade(PIGMENTS.gold, (rand(j + ring * 50) - 0.5) * 0.2),
        t: INTRO_T.centre + ring * 0.18 + (j / m) * 0.25,
        seed: 900000 + ring * 100 + j,
      });
    }
  }

  return { ribbons, tiles };
}
