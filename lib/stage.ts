"use client";

import { useEffect, useState } from "react";
import { gsap } from "@/lib/gsap";

/**
 * THE STAGE — the site is a camera journey, not a scrolling page.
 * Every scene is a full-screen layer fixed in place; the scroll gesture only
 * drives one master timeline that plays each scene and the zooms / turns between them.
 *
 * Scenes call sceneTimeline(id) to get a paused timeline (0 → 1 = the scene's story);
 * <Stage/> stitches them together in config/motion.ts → stage.scenes order.
 */
export type SceneId = string;

const timelines = new Map<SceneId, gsap.core.Timeline>();

export function sceneTimeline(id: SceneId, vars: gsap.TimelineVars = {}) {
  const tl = gsap.timeline({ ...vars, paused: true });
  timelines.set(id, tl);
  return tl;
}
export const getSceneTimeline = (id: SceneId) => timelines.get(id);

/* ---------- live state: which scenes are on screen, where each starts ---------- */
type State = { current: SceneId; visible: SceneId[]; starts: Partial<Record<SceneId, number>>; ready: boolean };
export const stage: State = { current: "top", visible: ["top"], starts: {}, ready: false };
const listeners = new Set<() => void>();
export function emitStage(next: Partial<State>) {
  Object.assign(stage, next);
  listeners.forEach((l) => l());
}
function useStage<T>(select: () => T) {
  const [v, setV] = useState(select);
  useEffect(() => {
    const on = () => setV(select);
    listeners.add(on);
    on();
    return () => {
      listeners.delete(on);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

/** true while the scene is on screen (including the transitions in and out). */
export const useSceneVisible = (id: SceneId) => useStage(() => !stage.ready || stage.visible.includes(id));

/** true once the camera is within `distance` scenes of this one (for lazy 3D). */
export function useSceneNear(id: SceneId, order: readonly SceneId[], distance = 1) {
  return useStage(() => {
    if (!stage.ready) return false;
    return Math.abs(order.indexOf(stage.current) - order.indexOf(id)) <= distance;
  });
}

/** Scroll position (px) where a scene starts; null when the stage is off. */
export const sceneScrollY = (id: string) => (stage.ready ? (stage.starts[id as SceneId] ?? null) : null);

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") Object.assign(window, { __stage: stage });
