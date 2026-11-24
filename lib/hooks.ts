"use client";

import { useEffect, useState } from "react";
import { motion } from "@/config/motion";

export function useMediaQuery(query: string, initial = false) {
  const [match, setMatch] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

export const useIsMobile = () => useMediaQuery(`(max-width: ${motion.mobile.breakpoint}px)`);
export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** true once the element is within `margin` of the viewport (for lazy 3D). */
export function useNearViewport(ref: React.RefObject<Element | null>, margin = "100% 0px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);
  return near;
}
