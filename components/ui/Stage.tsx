"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "@/lib/gsap";
import { motion } from "@/config/motion";
import { emitStage, getSceneTimeline, type SceneId } from "@/lib/stage";

type TL = gsap.core.Timeline;
type Transition = (m: TL, a: HTMLElement, b: HTMLElement, at: number, d: number) => void;

const P = 1400; // perspective for the 3D turns

/** transform-origin on the brass Almaty dot of the delivery map (for zooming into / out of it) */
function almatyOrigin(scene: HTMLElement) {
  const dot = scene.querySelector<SVGElement>(".map__brass");
  if (!dot) return "50% 50%";
  const r = dot.getBoundingClientRect();
  const s = scene.getBoundingClientRect();
  return `${r.left + r.width / 2 - s.left}px ${r.top + r.height / 2 - s.top}px`;
}

/** transform-origin on any element of a scene (the centre of a flower, a medallion…) */
function anchorOrigin(scene: HTMLElement, sel: string) {
  const el = scene.querySelector<HTMLElement>(sel);
  if (!el) return "50% 50%";
  const r = el.getBoundingClientRect();
  const s = scene.getBoundingClientRect();
  return `${r.left + r.width / 2 - s.left}px ${r.top + r.height / 2 - s.top}px`;
}

/** How the camera moves from scene A to scene B. All transforms + opacity only. */
const TRANSITIONS: Record<string, Transition> = {
  // the hero already ends on a full-screen tile that *is* the next scene
  cut: (m, a, b, at, d) => {
    m.set(b, { autoAlpha: 1 }, at)
      .to(a, { autoAlpha: 0, duration: d * 0.45, ease: "power1.inOut" }, at)
      .fromTo(b, { scale: 1.12 }, { scale: 1, duration: d, ease: "power2.out" }, at);
  },
  // the softest handover: A drifts a little closer and dissolves, B settles in beneath it
  bloom: (m, a, b, at, d) => {
    m.to(a, { scale: 1.1, autoAlpha: 0, duration: d * 0.85, ease: "sine.inOut" }, at).fromTo(
      b,
      { scale: 0.95, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: d * 0.85, ease: "sine.out" },
      at + d * 0.15,
    );
  },
  // fly into scene A, scene B rises out of the blur behind it
  zoomThrough: (m, a, b, at, d) => {
    m.to(a, { scale: 2.6, autoAlpha: 0, duration: d, ease: "power2.in" }, at).fromTo(
      b,
      { scale: 0.78, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: d, ease: "power3.out" },
      at + d * 0.25,
    );
  },
  // a door swinging: A turns away on its left hinge, B swings in from the right
  turn: (m, a, b, at, d) => {
    m.to(a, { rotationY: -78, xPercent: -18, scale: 0.92, autoAlpha: 0, transformOrigin: "0% 50%", transformPerspective: P, duration: d, ease: "power2.in" }, at).fromTo(
      b,
      { rotationY: 78, xPercent: 18, scale: 0.92, autoAlpha: 0, transformOrigin: "100% 50%", transformPerspective: P },
      { rotationY: 0, xPercent: 0, scale: 1, autoAlpha: 1, duration: d, ease: "power3.out" },
      at + d * 0.3,
    );
  },
  // the camera backs away: A shrinks and twists off, B settles down from close-up
  pullBack: (m, a, b, at, d) => {
    m.to(a, { scale: 0.55, rotation: -6, autoAlpha: 0, duration: d, ease: "power2.inOut" }, at).fromTo(
      b,
      { scale: 1.35, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: d, ease: "power3.out" },
      at + d * 0.2,
    );
  },
  // A falls back like a floor seen from above, B lifts up into view
  tilt: (m, a, b, at, d) => {
    m.to(a, { rotationX: 62, yPercent: 18, scale: 0.9, autoAlpha: 0, transformOrigin: "50% 100%", transformPerspective: P, duration: d, ease: "power2.in" }, at).fromTo(
      b,
      { rotationX: -28, scale: 0.9, autoAlpha: 0, transformOrigin: "50% 0%", transformPerspective: P },
      { rotationX: 0, scale: 1, autoAlpha: 1, duration: d, ease: "power3.out" },
      at + d * 0.3,
    );
  },
  // start inside Almaty and zoom out until the whole country is in frame
  mapOut: (m, a, b, at, d) => {
    m.to(a, { scale: 0.7, autoAlpha: 0, duration: d * 0.6, ease: "power2.in" }, at).fromTo(
      b,
      { scale: 5, autoAlpha: 0, transformOrigin: () => almatyOrigin(b) },
      { scale: 1, autoAlpha: 1, duration: d, ease: "power3.inOut" },
      at + d * 0.15,
    );
  },
  // dive back into the Almaty dot, the next scene waits inside it
  dive: (m, a, b, at, d) => {
    m.to(a, { scale: 9, transformOrigin: () => almatyOrigin(a), duration: d, ease: "power3.in" }, at)
      .to(a, { autoAlpha: 0, duration: d * 0.3 }, at + d * 0.7)
      .fromTo(b, { scale: 0.82, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: d * 0.6, ease: "power3.out" }, at + d * 0.6);
  },
  // spiral into the heart of A's flower — B unfolds out of that centre
  spiralIn: (m, a, b, at, d) => {
    const origin = anchorOrigin(a, ".intro-anchor, .spiral-anchor, .order-anchor, .stones__heart");
    m.to(a, { rotation: 55, scale: 7, transformOrigin: origin, duration: d, ease: "power3.in" }, at)
      .to(a, { autoAlpha: 0, duration: d * 0.3 }, at + d * 0.65)
      .fromTo(b, { rotation: -30, scale: 0.55, autoAlpha: 0 }, { rotation: 0, scale: 1, autoAlpha: 1, duration: d * 0.7, ease: "power3.out" }, at + d * 0.5);
  },
  // a slow spiral: A turns and grows away, B unwinds into place
  spiral: (m, a, b, at, d) => {
    m.to(a, { rotation: 14, scale: 1.6, autoAlpha: 0, duration: d, ease: "power2.in" }, at).fromTo(
      b,
      { rotation: -14, scale: 0.7, autoAlpha: 0 },
      { rotation: 0, scale: 1, autoAlpha: 1, duration: d, ease: "power3.out" },
      at + d * 0.25,
    );
  },
};

/**
 * Builds the camera journey: one master timeline driven by the scroll gesture.
 * The document only holds an invisible spacer — nothing visibly scrolls.
 */
export function Stage() {
  const spacer = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const html = document.documentElement;
      html.classList.add("stage-on");
      const T = motion.stage.transition;
      const defs = motion.stage.scenes;
      const els = defs.map((s) => document.querySelector<HTMLElement>(`[data-scene="${s.id}"]`));
      if (els.some((e) => !e)) {
        console.warn("Stage: missing scene", defs.filter((_, i) => !els[i]).map((s) => s.id));
        return;
      }
      const scenes = els as HTMLElement[];

      // timing map in vh
      const windows: { id: SceneId; start: number; end: number }[] = [];
      let t = 0;
      const gap = (s: (typeof defs)[number]) => ("t" in s && s.t) || T;
      defs.forEach((s, i) => {
        if (i > 0) t += gap(s);
        windows.push({ id: s.id as SceneId, start: t, end: t + s.length });
        t += s.length;
      });
      const M = Math.max(...defs.map(gap)); // visibility margin around each scene
      const total = t;
      spacer.current!.style.height = `${total + 100}vh`;

      gsap.set(scenes, { autoAlpha: 0 });
      gsap.set(scenes[0], { autoAlpha: 1 });
      scenes.forEach((el, i) => gsap.set(el, { zIndex: scenes.length - i }));

      let lastKey = "";
      const report = (self: ScrollTrigger) => {
        const now = self.progress * total;
        const visible = windows.filter((w) => now >= w.start - M && now <= w.end + M).map((w) => w.id);
        const current = (windows.find((w) => now >= w.start - M / 2 && now < w.end + M / 2) ?? windows[windows.length - 1]).id;
        const key = current + visible.join();
        if (key !== lastKey) {
          lastKey = key;
          emitStage({ current, visible });
        }
      };
      const measure = (self: ScrollTrigger) => {
        const vh = window.innerHeight / 100;
        const starts: Partial<Record<SceneId, number>> = {};
        windows.forEach((w) => (starts[w.id] = Math.round(self.start + w.start * vh + 1)));
        emitStage({ starts, ready: true });
        report(self);
      };

      const master = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: spacer.current,
          start: "top top",
          end: "bottom bottom",
          scrub: motion.scrub,
          // no invalidateOnRefresh: re-recording start values mid-reel would resurrect old scenes
          onUpdate: report,
          onRefresh: measure,
        },
      });
      master.set({}, {}, total); // fix the reel length

      defs.forEach((s, i) => {
        const w = windows[i];
        const tl = getSceneTimeline(s.id as SceneId);
        if (tl) master.fromTo(tl, { progress: 0 }, { progress: 1, duration: s.length, ease: "none" }, w.start);
        if (i > 0) {
          const kind = ("in" in s && s.in) || "zoomThrough";
          const d = gap(s);
          (TRANSITIONS[kind] ?? TRANSITIONS.zoomThrough)(master, scenes[i - 1], scenes[i], w.start - d, d);
        }
      });

      ScrollTrigger.refresh();
      // deep links (#calculator from a product page, nav from another page)
      const hash = decodeURIComponent(location.hash.slice(1));
      const target = windows.find((w) => w.id === hash);
      if (target) requestAnimationFrame(() => window.scrollTo(0, Math.round(master.scrollTrigger!.start + target.start * (innerHeight / 100) + 2)));

      return () => {
        html.classList.remove("stage-on");
        emitStage({ ready: false, starts: {} });
        if (spacer.current) spacer.current.style.height = "0px";
      };
    });
    return () => mm.revert();
  });

  return <div ref={spacer} className="stage-spacer" aria-hidden />;
}
