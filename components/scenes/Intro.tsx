"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap, SplitText, useGSAP, MOTION_OK } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";
import { motion } from "@/config/motion";
import { sceneTimeline, useSceneVisible } from "@/lib/stage";
import { buildIntro, INTRO_T, strokeAt, type Ribbon } from "@/lib/brush";
import { rand } from "@/lib/ornament";
import { useIsMobile } from "@/lib/hooks";

type View = { zoom: number; rot: number };

/**
 * SCENE 1 — Painted into stone.
 * On blank paper, six brushstrokes are painted in (watercolour that builds up in
 * layers, darker at the bristle edges) and curl into one spiral flower. A beat behind
 * each brush the pigment condenses into stone: every soft bloom of colour tightens
 * into a cut tessera of the same hue, while the watercolour fades to a ghost beneath.
 * It plays on its own; scrolling then carries the camera into the flower's heart.
 */
export function Intro() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const view = useRef<View>({ zoom: 1, rot: 0 });
  const mobile = useIsMobile();
  const visible = useSceneVisible("top");
  const visibleRef = useRef(true);
  visibleRef.current = visible;
  const { ribbons, tiles } = useMemo(() => buildIntro(6), []);

  /* ---------------------------------------------------------- the painting */
  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    const paint = document.createElement("canvas"); // accumulating watercolour layer
    const pctx = paint.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;
    let W = 0,
      H = 0,
      dpr = 1,
      cx = 0,
      cy = 0,
      k0 = 1;
    const painted = ribbons.map(() => 0); // how far each stroke has been laid on the paint layer
    let idle = 0;
    let prev = t0;

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.clientWidth;
      H = c.clientHeight;
      c.width = paint.width = Math.round(W * dpr);
      c.height = paint.height = Math.round(H * dpr);
      const narrow = W < 900;
      cx = W * (narrow ? 0.5 : 0.6);
      cy = H * (narrow ? 0.4 : 0.5);
      k0 = (Math.min(W, H) / 2) * (narrow ? 0.98 : 0.9);
      pctx.setTransform(1, 0, 0, 1, 0, 0);
      pctx.clearRect(0, 0, paint.width, paint.height);
      painted.fill(0);
    };

    /** lay watercolour dabs along a ribbon between two stroke positions */
    const dab = (r: Ribbon, from: number, to: number, ri: number) => {
      const N = r.pts.length - 1;
      const i0 = Math.floor(from * N),
        i1 = Math.floor(to * N);
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = Math.max(1, i0); i <= i1; i++) {
        const [x, y] = r.pts[i];
        const a = r.ang[i];
        const w = r.width[i] * k0;
        const px = cx + x * k0,
          py = cy + y * k0;
        const sd = ri * 7919 + i;
        // body of the stroke: soft, translucent, builds up where it overlaps
        pctx.save();
        pctx.translate(px, py);
        pctx.rotate(a);
        pctx.globalAlpha = 0.075 + rand(sd) * 0.04;
        pctx.fillStyle = r.color;
        pctx.beginPath();
        pctx.ellipse(0, 0, w * 0.62, w * (0.5 + rand(sd + 1) * 0.05), 0, 0, Math.PI * 2);
        pctx.fill();
        // bristles: pigment gathers at the edges and in faint streaks
        for (const off of [-0.42, -0.18, 0.2, 0.44]) {
          pctx.globalAlpha = 0.05 + rand(sd + off * 10) * 0.07;
          pctx.beginPath();
          pctx.ellipse(0, off * w, w * 0.5, w * 0.06 + rand(sd + 3) * w * 0.04, 0, 0, Math.PI * 2);
          pctx.fill();
        }
        // a little bleed into the paper
        if (rand(sd + 5) < 0.18) {
          pctx.globalAlpha = 0.025;
          pctx.beginPath();
          pctx.arc((rand(sd + 6) - 0.5) * w, (rand(sd + 7) - 0.5) * w, w * (0.7 + rand(sd + 8) * 0.6), 0, Math.PI * 2);
          pctx.fill();
        }
        pctx.restore();
      }
    };

    const ease = (x: number) => 1 - Math.pow(1 - x, 3);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visibleRef.current) return;
      const now = performance.now();
      const T = reduce ? INTRO_T.total : (now - t0) / 1000;
      idle += 0.012 * Math.min(0.05, (now - prev) / 1000) * Math.min(1, Math.max(0, (T - 6) / 3));
      prev = now;

      // 1 · paint: extend each stroke on the watercolour layer
      ribbons.forEach((r, i) => {
        const u = strokeAt(r, T);
        if (u > painted[i]) {
          dab(r, painted[i], u, i);
          painted[i] = u;
        }
      });

      // 2 · compose: paper → fading watercolour → stone
      const v = view.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      const fade = Math.min(1, Math.max(0, (T - INTRO_T.paintFadeFrom) / (INTRO_T.paintFadeTo - INTRO_T.paintFadeFrom)));
      const paintAlpha = 1 - (1 - INTRO_T.paintGhost) * (fade * fade * (3 - 2 * fade));
      // camera: rotate/zoom around the flower's heart
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(cx, cy);
      ctx.rotate(v.rot + idle);
      ctx.scale(v.zoom, v.zoom);
      ctx.translate(-cx, -cy);
      ctx.globalAlpha = paintAlpha;
      ctx.drawImage(paint, 0, 0, W, H);
      ctx.globalAlpha = 1;

      ctx.translate(cx, cy);
      ctx.scale(k0, k0);
      const px = 1 / k0;
      for (const tl of tiles) {
        const q = (T - tl.t) / INTRO_T.condense;
        if (q <= 0) continue;
        const e = ease(Math.min(1, q));
        ctx.save();
        ctx.translate(tl.x, tl.y);
        ctx.rotate(tl.a + (1 - e) * 0.25);
        // a soft bloom of pigment tightening into a cut stone
        const s = 1.45 - 0.45 * e;
        const w = tl.w * s,
          h = tl.h * s;
        const r = Math.min(w, h) * (0.5 - 0.3 * e);
        ctx.globalAlpha = Math.min(1, 0.25 + e * 0.9);
        ctx.fillStyle = tl.c;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, r);
        ctx.fill();
        if (e > 0.55) {
          const k = (e - 0.55) / 0.45;
          // the polish: a lit upper edge and a fine cut line
          ctx.globalAlpha = 0.2 * k;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.roundRect(-w / 2, -h / 2, w, h * 0.4, r);
          ctx.fill();
          ctx.globalAlpha = 0.16 * k;
          ctx.lineWidth = 0.6 * px;
          ctx.strokeStyle = "#2B2521";
          ctx.beginPath();
          ctx.roundRect(-w / 2, -h / 2, w, h, r);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    layout();
    frame();
    const onResize = () => {
      layout();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [ribbons, tiles]);

  /* ---------------------------------------------------------- words + camera */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const title = SplitText.create(".intro__title .line", { type: "words", mask: "words" });
        // the words arrive as the stone sets (time-based, independent of scroll)
        gsap
          .timeline({ delay: INTRO_T.centre - 0.6 })
          .from(".intro__kicker", { opacity: 0, y: 12, duration: 1.2, ease: motion.ease.enter })
          .from(title.words, { yPercent: 115, duration: 1.6, stagger: 0.09, ease: motion.ease.enter }, 0.2)
          .from(".intro__sub", { opacity: 0, y: 14, duration: 1.4, ease: motion.ease.enter }, 0.9)
          .from(".intro__scroll", { opacity: 0, duration: 1.2 }, 1.6);

        // scrolling: the words leave and the camera turns in toward the heart
        sceneTimeline("top", { defaults: { ease: "none" } })
          .to(".intro__copy", { yPercent: -30, opacity: 0, duration: 0.45, ease: "power2.in" }, 0)
          .to(".intro__scroll", { opacity: 0, duration: 0.15 }, 0)
          .to(view.current, { zoom: 1.35, rot: 0.35, duration: 1, ease: "power1.inOut" }, 0);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" data-scene="top" className="intro" data-bg="paper" aria-labelledby="intro-title">
      <canvas ref={canvas} className="intro__canvas" aria-hidden />
      <i className="intro-anchor" style={{ left: mobile ? "50%" : "60%", top: mobile ? "40%" : "50%" }} aria-hidden />
      <div className="intro__copy">
        <p className="kicker intro__kicker">{t("intro.kicker")}</p>
        <h1 id="intro-title" className="display intro__title">
          <span className="line">{t("intro.line1")}</span>
          <span className="line">
            <em>{t("intro.line2")}</em>
          </span>
        </h1>
        <p className="intro__sub">{t("intro.sub")}</p>
      </div>
      <div className="intro__scroll" aria-hidden>
        <span>{t("intro.scroll")}</span>
        <i />
      </div>
    </section>
  );
}
