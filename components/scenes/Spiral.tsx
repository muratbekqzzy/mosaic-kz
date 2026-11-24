"use client";

import { useMemo, useRef } from "react";
import { gsap, SplitText, useGSAP, MOTION_OK } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";
import { motion } from "@/config/motion";
import { sceneTimeline, useSceneVisible } from "@/lib/stage";
import { rosette } from "@/lib/ornament";
import { MosaicCanvas, type MosaicState } from "@/components/ui/MosaicCanvas";

/**
 * SCENE 2 — The spiral flower. Out of the hero's white tile, a gold line draws the
 * ram's-horn arms; the stone pieces settle in behind its tip, one by one, until the
 * flower is whole and turning. The camera then spirals into its centre.
 */
export function Spiral() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const design = useMemo(() => rosette({ arms: 8, seed: 3 }), []);
  const state = useRef<MosaicState>({ p: 1, rot: 0, zoom: 1 });
  const visible = useSceneVisible("spiral");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        state.current.p = 0;
        const title = SplitText.create(".spiral__title .line", { type: "words", mask: "words" });
        const num = root.current!.querySelector<HTMLElement>(".spiral__num")!;
        const total = design.tesserae.length;
        sceneTimeline("spiral", { defaults: { ease: "none" } })
          .to(state.current, { p: 1, duration: 0.78, ease: "power1.inOut" }, 0)
          .fromTo(state.current, { rot: -0.35 }, { rot: 0.5, duration: 1 }, 0)
          .fromTo(state.current, { zoom: 0.92 }, { zoom: 1, duration: 0.8, ease: "power2.out" }, 0)
          .from(".spiral__kicker", { opacity: 0, y: 14, duration: 0.08 }, 0.02)
          .from(title.words, { yPercent: 115, duration: 0.14, stagger: 0.03, ease: motion.ease.enter }, 0.04)
          .from(".spiral__copy", { opacity: 0, y: 20, duration: 0.12, ease: motion.ease.enter }, 0.2)
          .from(".spiral__count", { opacity: 0, duration: 0.1 }, 0.22)
          .to(
            { v: 0 },
            {
              v: total,
              duration: 0.78,
              ease: "power1.inOut",
              onUpdate(this: gsap.core.Tween) {
                num.textContent = String(Math.round((this.targets()[0] as { v: number }).v)).padStart(4, "0");
              },
            },
            0,
          );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="spiral" data-scene="spiral" className="spiral" data-bg="paper" aria-labelledby="spiral-title">
      <div className="spiral__art">
        <MosaicCanvas design={design} state={state} className="spiral__canvas" fit={0.92} spin={0.05} active={visible} />
        <i className="spiral-anchor" aria-hidden />
      </div>
      <div className="spiral__text">
        <p className="kicker spiral__kicker">{t("spiral.kicker")}</p>
        <h2 id="spiral-title" className="display spiral__title">
          <span className="line">{t("spiral.title1")}</span>
          <span className="line">
            <em>{t("spiral.title2")}</em>
          </span>
        </h2>
        <p className="spiral__copy">{t("spiral.copy")}</p>
        <p className="spiral__count">
          <span className="spiral__num">{String(design.tesserae.length).padStart(4, "0")}</span>
          <span>{t("spiral.count")}</span>
        </p>
      </div>
    </section>
  );
}
