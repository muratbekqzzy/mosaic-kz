"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { assets } from "@/config/site";
import { getStone, STONE_KEYS, type StoneKey } from "@/lib/marble";

type TexMap = Partial<Record<StoneKey, string>>;
const TexContext = createContext<TexMap>({});

/**
 * Generates (or loads) one texture per stone and exposes it two ways:
 *  - CSS variable  --tex-<stone>  for DOM elements (class .stone-<stone>)
 *  - context URL   useTextures()  for SVG <image> and three.js
 */
export function TexturesProvider({ children }: { children: ReactNode }) {
  const [tex, setTex] = useState<TexMap>({});

  useEffect(() => {
    let cancelled = false;
    const queue = [...STONE_KEYS];
    const result: TexMap = {};
    const step = () => {
      if (cancelled) return;
      const key = queue.shift();
      if (!key) return;
      const real = assets.textures[key];
      const url = real ?? getStone(key, 384).toDataURL("image/webp", 0.9);
      result[key] = url;
      document.documentElement.style.setProperty(`--tex-${key}`, `url("${url}")`);
      setTex({ ...result });
      // spread the work over idle frames so the hero stays smooth
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
      if (ric) ric(step);
      else setTimeout(step, 16);
    };
    step();
    return () => {
      cancelled = true;
    };
  }, []);

  return <TexContext.Provider value={tex}>{children}</TexContext.Provider>;
}

export const useTextures = () => useContext(TexContext);
