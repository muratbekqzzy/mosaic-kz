/**
 * MOTION CONFIG — every timing on the site lives here.
 *
 * `length` = how long a pinned scene stays pinned, in % of viewport height
 * (300 = three screens of scrolling). Bigger = slower scene.
 * Phase windows are fractions (0–1) of that scene's progress.
 */
export const motion = {
  /** Lag between the scrollbar and the animation. 1.2 feels heavy, like stone. */
  scrub: 1.0,

  ease: {
    enter: "expo.out",
    move: "power3.inOut",
    settle: "back.out(1.6)", // the tiny bounce when a piece locks in
  },

  /** Lenis smooth scroll */
  lenis: { lerp: 0.085, wheelMultiplier: 0.9 },

  /**
   * THE CAMERA JOURNEY — the page never scrolls; the gesture plays this reel.
   * length = scroll distance of the scene (vh). `in` = how the camera arrives
   * from the previous scene: cut · zoomThrough · turn · pullBack · tilt · mapOut · dive · spiral.
   * transition = length of each hand-over (vh).
   */
  stage: {
    transition: 90,
    // t = this hand-over's own length (vh), when it should breathe more or less than the default
    scenes: [
      { id: "top", length: 220 },
      { id: "spiral", length: 340, in: "bloom", t: 120 },
      { id: "stones", length: 420, in: "spiralIn", t: 130 },
      { id: "delivery", length: 240, in: "mapOut", t: 110 },
      { id: "order", length: 280, in: "dive", t: 110 },
      { id: "contacts", length: 320, in: "spiralIn", t: 130 },
    ],
  },

  hero: {
    length: 480,
    /** central flower: petals fly in from depth (fromZ = toward the viewer) */
    petals: { start: 0.05, end: 0.38, stagger: 0.016, fromZ: 4.2, spread: 2.8 },
    /** the pattern tessellates outward */
    tessellate: { start: 0.3, end: 0.66, pieceDuration: 0.12 },
    /** camera pulls back to reveal the bathroom; fill = share of screen height the wall takes at the end */
    pullBack: { start: 0.46, end: 0.84, fromZ: 7.2, fill: 0.6 },
    /** "Every piece in its place" line */
    endLine: 0.7,
    /** headline words */
    headline: { start: 0.0, stagger: 0.09 },
    /** the tile that grows into the next scene (match-cut) */
    carry: { start: 0.92, end: 1 },
    /** grid of flower cells [cols, rows] (each side of centre) */
    grid: { desktop: [6, 4] as [number, number], mobile: [3, 5] as [number, number] },
  },

  material: {
    length: 260,
    panelStagger: 0.12,
    sweepDuration: 0.6,
  },

  split: {
    length: 240,
    cols: 6,
    rows: 4,
  },

  collections: {
    /** per collection, in % of viewport height */
    perPanel: 110,
    tiltMax: 14, // degrees the sheet tilts toward the cursor
    tiltEase: 0.6,
  },

  wall: {
    length: 280,
    cols: 12,
    rows: 8,
    groutPhase: [0, 0.3] as [number, number],
    tilePhase: [0.2, 0.95] as [number, number],
    crossfade: 0.8, // seconds, style switcher
  },

  calculator: {
    countUp: 1.1, // seconds
    reserve: 0.1, // +10 %
  },

  delivery: {
    length: 200,
    arcStagger: 0.06,
  },

  interiors: {
    reveal: 1.4, // seconds
  },

  finale: {
    length: 300,
    scatter: 18,
  },

  header: {
    hideAfter: 120, // px scrolled before the header may hide
  },

  /** Mobile = same story, lighter 3D */
  mobile: {
    breakpoint: 768,
    dpr: [1, 1.5] as [number, number],
  },
  desktop: {
    dpr: [1, 2] as [number, number],
  },
} as const;

export type Motion = typeof motion;
