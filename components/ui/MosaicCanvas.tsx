"use client";

import { useEffect, useRef } from "react";
import type { Design } from "@/lib/ornament";
import { SOFT } from "@/lib/ornament";

/**
 * Draws a mosaic design on a canvas. The scene's timeline only moves numbers in `state`:
 *   p     reveal 0..1 — the gold line draws, the stone pieces settle in behind its tip
 *   rot   rotation (radians) — the slow spiral turn
 *   zoom  scale multiplier
 * Each piece is a hand-cut tessera: a soft rounded body, a lit edge, a little shadow.
 */
export type MosaicState = { p: number; rot: number; zoom: number };

export function MosaicCanvas({
  design,
  state,
  className,
  fit = 0.9,
  anchor = [0.5, 0.5],
  guideColor = SOFT.gold,
  spin = 0,
  active = true,
}: {
  design: Design;
  state: React.RefObject<MosaicState>;
  className?: string;
  /** fraction of the canvas's smaller side the design's diameter fills */
  fit?: number;
  /** centre of the design inside the canvas (fractions) */
  anchor?: [number, number];
  guideColor?: string;
  /** idle rotation in radians per second — the flower breathes even when the page is still */
  spin?: number;
  /** false while the scene is off screen: stops redrawing */
  active?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const idleRef = useRef(0); // survives effect re-runs, so the idle turn never jumps

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    let last = "";
    const cache = document.createElement("canvas");
    let cacheKey = "";
    let prev = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const back = (t: number) => {
      const k = 1.7;
      return 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2);
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const s = state.current;
      if (!s || !active) return;
      const now = performance.now();
      // ease the idle turn in as the flower completes, so assembly reads first
      idleRef.current += spin * Math.min(0.05, (now - prev) / 1000) * Math.min(1, Math.max(0, (s.p - 0.6) / 0.4));
      const idle = idleRef.current;
      prev = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = c.clientWidth,
        H = c.clientHeight;
      if (!W || !H) return;
      const key = `${W}x${H}:${s.p.toFixed(4)}:${(s.rot + idle).toFixed(4)}:${s.zoom.toFixed(4)}`;
      if (key === last) return;
      last = key;
      if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
      }
      const [ex, ey] = design.extent ?? [design.radius, design.radius];
      const k = Math.min((W * fit) / (2 * ex), (H * fit) / (2 * ey)) * s.zoom;

      // finished: draw the whole mosaic once, then only turn the picture (keeps scrolling light)
      if (s.p >= 1) {
        const ck = `${c.width}x${c.height}:${k.toFixed(3)}`;
        if (cacheKey !== ck) {
          cache.width = c.width;
          cache.height = c.height;
          render(cache.getContext("2d")!, 0, 1, W, H, dpr, k);
          cacheKey = ck;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.setTransform(dpr, 0, 0, dpr, W * anchor[0] * dpr, H * anchor[1] * dpr);
        ctx.rotate(s.rot + idle);
        ctx.drawImage(cache, -W * anchor[0], -H * anchor[1], W, H);
        return;
      }
      render(ctx, s.rot + idle, s.p, W, H, dpr, k);
    };

    /** draws guides + stones at reveal p, rotated by rot */
    const render = (g: CanvasRenderingContext2D, rot: number, p: number, W: number, H: number, dpr: number, k: number) => {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, c.width, c.height);
      g.setTransform(dpr, 0, 0, dpr, W * anchor[0] * dpr, H * anchor[1] * dpr);
      g.rotate(rot);
      g.scale(k, k);
      const px = 1 / k; // one css pixel in design units

      // gold guides: they lead, then fade once the stone has caught up
      g.lineCap = "round";
      g.lineJoin = "round";
      for (const gd of design.guides) {
        const u = Math.min(1, Math.max(0, (p - gd.t0) / (gd.t1 - gd.t0)));
        if (u <= 0) continue;
        const fade = Math.max(0, 1 - Math.max(0, p - gd.t1) * 8);
        if (fade <= 0) continue;
        const n = Math.max(2, Math.floor(u * gd.pts.length));
        g.beginPath();
        g.moveTo(gd.pts[0][0], gd.pts[0][1]);
        for (let i = 1; i < n; i++) g.lineTo(gd.pts[i][0], gd.pts[i][1]);
        g.strokeStyle = guideColor;
        g.globalAlpha = 0.9 * fade;
        g.lineWidth = 1.1 * px;
        g.stroke();
        // the drawing tip: a tiny bead of gold
        if (u < 1) {
          const [tx, ty] = gd.pts[n - 1];
          g.beginPath();
          g.arc(tx, ty, 2.2 * px, 0, Math.PI * 2);
          g.fillStyle = guideColor;
          g.fill();
        }
      }
      g.globalAlpha = 1;

      // stone pieces
      for (const t of design.tesserae) {
        const a = (p - t.t) / 0.035;
        if (a <= 0) continue;
        const q = Math.min(1, a);
        const sc = back(q);
        const lift = (1 - ease(q)) * 6 * px;
        g.save();
        g.translate(t.x, t.y - lift);
        g.rotate(t.a + (1 - ease(q)) * 0.6);
        g.scale(sc, sc);
        g.globalAlpha = Math.min(1, q * 1.6);
        const w = t.w,
          h = t.h,
          r = Math.min(w, h) * 0.28;
        g.beginPath();
        g.roundRect(-w / 2, -h / 2, w, h, r);
        g.fillStyle = t.c;
        g.fill();
        // the cut stone catches light on one edge
        g.beginPath();
        g.roundRect(-w / 2, -h / 2, w, h * 0.42, r);
        g.fillStyle = "rgba(255,255,255,0.16)";
        g.fill();
        g.lineWidth = 0.6 * px;
        g.strokeStyle = "rgba(43,37,33,0.14)";
        g.stroke();
        g.restore();
      }
      g.globalAlpha = 1;
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [design, state, fit, anchor, guideColor, spin, active]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
