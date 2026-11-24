"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Custom cursor: a brass point and a ring that swells over anything interactive,
 * showing a label from [data-cursor]. Elements with [data-magnetic] lean toward the pointer.
 * Disabled on touch devices and for reduced motion.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    document.documentElement.classList.add("has-cursor");

    const dx = gsap.quickTo(dot.current, "x", { duration: 0.12, ease: "power3.out" });
    const dy = gsap.quickTo(dot.current, "y", { duration: 0.12, ease: "power3.out" });
    const rx = gsap.quickTo(ring.current, "x", { duration: 0.55, ease: "power3.out" });
    const ry = gsap.quickTo(ring.current, "y", { duration: 0.55, ease: "power3.out" });

    let magnet: HTMLElement | null = null;
    let mx: ((v: number) => void) | null = null;
    let my: ((v: number) => void) | null = null;

    const onMove = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      if (magnet && mx && my) {
        const r = magnet.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.35);
        my((e.clientY - (r.top + r.height / 2)) * 0.35);
      }
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const hit = t.closest<HTMLElement>("a, button, select, input, [data-cursor]");
      const text = hit?.dataset.cursor ?? "";
      label.current!.textContent = text;
      ring.current!.classList.toggle("is-hover", !!hit);
      ring.current!.classList.toggle("has-label", !!text);

      const m = t.closest<HTMLElement>("[data-magnetic], .btn, .wa-fab");
      if (m !== magnet) {
        if (magnet) gsap.to(magnet, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
        magnet = m;
        mx = m ? gsap.quickTo(m, "x", { duration: 0.6, ease: "power3.out" }) : null;
        my = m ? gsap.quickTo(m, "y", { duration: 0.6, ease: "power3.out" }) : null;
      }
    };
    const onDown = () => ring.current!.classList.add("is-down");
    const onUp = () => ring.current!.classList.remove("is-down");
    const onLeave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.3 });
    const onEnter = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, []);

  return (
    <div className="cursor" aria-hidden>
      <div ref={ring} className="cursor__ring">
        <span ref={label} className="cursor__label" />
      </div>
      <div ref={dot} className="cursor__dot" />
    </div>
  );
}
