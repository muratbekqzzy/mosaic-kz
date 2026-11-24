"use client";

import { useEffect, useRef } from "react";

/**
 * The living background: soft pastel colour fields drifting behind the whole site.
 * Rendered at 1/10 resolution and upscaled with a blur, so it is silky and nearly free.
 * Fields drift on slow, independent orbits, lean a little toward the pointer and
 * shift with scroll — floaty and alive, never busy.
 */
type Field = { c: [number, number, number]; x: number; y: number; r: number; ax: number; ay: number; f: number; ph: number; depth: number; a: number };

const FIELDS: Field[] = [
  { c: [236, 206, 196], x: 0.22, y: 0.28, r: 0.62, ax: 0.08, ay: 0.06, f: 0.021, ph: 0.0, depth: 0.6, a: 0.75 }, // blush
  { c: [199, 219, 199], x: 0.8, y: 0.68, r: 0.66, ax: 0.07, ay: 0.08, f: 0.017, ph: 1.7, depth: 0.9, a: 0.7 }, // celadon
  { c: [239, 222, 180], x: 0.74, y: 0.18, r: 0.5, ax: 0.09, ay: 0.05, f: 0.025, ph: 3.1, depth: 0.4, a: 0.6 }, // pale gold
  { c: [219, 210, 233], x: 0.3, y: 0.84, r: 0.55, ax: 0.06, ay: 0.07, f: 0.019, ph: 4.4, depth: 0.7, a: 0.55 }, // lavender
  { c: [247, 228, 214], x: 0.52, y: 0.5, r: 0.42, ax: 0.1, ay: 0.08, f: 0.029, ph: 5.6, depth: 1.0, a: 0.6 }, // peach light
];

export function FluidBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d", { alpha: false })!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SCALE = 10;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;
    let last = 0;
    const t0 = performance.now();

    const size = () => {
      c.width = Math.max(32, Math.ceil(window.innerWidth / SCALE));
      c.height = Math.max(32, Math.ceil(window.innerHeight / SCALE));
    };
    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 33) return; // ~30 fps is plenty for drifting colour
      last = now;
      const t = (now - t0) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      const scroll = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const W = c.width,
        H = c.height,
        M = Math.max(W, H);
      ctx.fillStyle = "#F4EEE3";
      ctx.fillRect(0, 0, W, H);
      for (const f of FIELDS) {
        const x = (f.x + Math.sin(t * f.f * 6.283 + f.ph) * f.ax + pointer.x * 0.05 * f.depth + Math.sin(scroll * 6.283 + f.ph) * 0.06) * W;
        const y = (f.y + Math.cos(t * f.f * 5.1 + f.ph) * f.ay + pointer.y * 0.05 * f.depth + Math.cos(scroll * 4.2 + f.ph) * 0.05) * H;
        const r = f.r * M * (1 + Math.sin(t * f.f * 3.7 + f.ph) * 0.08);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const [cr, cg, cb] = f.c;
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${f.a})`);
        g.addColorStop(0.55, `rgba(${cr},${cg},${cb},${f.a * 0.35})`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    };

    size();
    if (reduce) draw(performance.now());
    else {
      raf = requestAnimationFrame(draw);
      window.addEventListener("pointermove", onMove, { passive: true });
    }
    window.addEventListener("resize", size);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", size);
    };
  }, []);

  return <canvas ref={ref} className="fluid-bg" aria-hidden />;
}
