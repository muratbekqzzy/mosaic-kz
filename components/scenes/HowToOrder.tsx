"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";
import { motion } from "@/config/motion";
import { waLink } from "@/lib/whatsapp";
import { sceneTimeline, useSceneVisible } from "@/lib/stage";
import { mergeDesigns, placeDesign, rosette, SOFT } from "@/lib/ornament";
import { MosaicCanvas, type MosaicState } from "@/components/ui/MosaicCanvas";
import { useIsMobile } from "@/lib/hooks";

const PALETTES = [
  [{ main: [SOFT.blush, SOFT.rose], edge: [SOFT.roseDeep] }, { main: [SOFT.goldHi], edge: [SOFT.gold] }],
  [{ main: [SOFT.celadon, SOFT.sage], edge: [SOFT.sageDeep] }, { main: [SOFT.blush], edge: [SOFT.rose] }],
  [{ main: [SOFT.sage, SOFT.teal], edge: [SOFT.sageDeep] }, { main: [SOFT.goldHi, SOFT.blush], edge: [SOFT.terracotta] }],
];

/**
 * SCENE 7 — How to order. Three small spiral flowers bloom one after another — choose,
 * calculate, message — each laid in stone as its step is told. A thread joins them.
 */
export function HowToOrder() {
  const { t, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const mobile = useIsMobile();
  const state = useRef<MosaicState>({ p: 1, rot: 0, zoom: 1 });
  const visible = useSceneVisible("order");

  const design = useMemo(() => {
    const gap = 2.3;
    const parts = [0, 1, 2].map((i) =>
      placeDesign(
        rosette({ arms: 6, seed: 10 + i, palettes: PALETTES[i], span: [0.06 + i * 0.26, 0.06 + i * 0.26 + 0.34] }),
        (i - 1) * gap,
        0,
        1,
        i * 0.4,
      ),
    );
    const d = mergeDesigns(...parts);
    d.extent = mobile ? [3.5, 1.15] : [3.4, 1.1];
    return d;
  }, [mobile]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        state.current.p = 0;
        const steps = gsap.utils.toArray<HTMLElement>(".order__step");
        const tl = sceneTimeline("order", { defaults: { ease: "none" } });
        tl.from(".order__head > *", { y: 24, opacity: 0, stagger: 0.03, duration: 0.08, ease: motion.ease.enter }, 0)
          .to(state.current, { p: 1, duration: 0.9 }, 0)
          .fromTo(state.current, { rot: -0.08 }, { rot: 0.04, duration: 1 }, 0)
          .fromTo(".order__thread", { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", duration: 0.8, ease: "power1.inOut" }, 0.05);
        steps.forEach((s, i) => tl.from(s, { opacity: 0, y: 24, duration: 0.1, ease: motion.ease.enter }, 0.2 + i * 0.26));
        tl.from(".order__cta", { opacity: 0, y: 16, duration: 0.08 }, 0.9);
      });
      return () => mm.revert();
    },
    // build once: the stage stitches this timeline into the reel; the layout switch only changes the design
    { scope: root },
  );

  return (
    <section ref={root} id="order" data-scene="order" className="order" data-bg="paper" aria-labelledby="order-title">
      <div className="order__head">
        <p className="kicker">{t("order.kicker")}</p>
        <h2 id="order-title" className="display">
          {t("order.title")}
        </h2>
      </div>
      <div className="order__art">
        <i className="order__thread" aria-hidden />
        <MosaicCanvas design={design} state={state} className="order__canvas" fit={mobile ? 0.98 : 0.92} active={visible} />
        <i className="order-anchor" aria-hidden />
      </div>
      <ol className="order__steps">
        {dict.order.steps.map((s, i) => (
          <li key={i} className="order__step">
            <span className="order__num">0{i + 1}</span>
            <h3 className="display">{s.t}</h3>
            <p>{s.d}</p>
          </li>
        ))}
      </ol>
      <div className="order__cta">
        <span>{t("order.samplesTitle")}</span>
        <a className="link-btn" href={waLink(t("order.samplesMessage"))} target="_blank" rel="noopener noreferrer">
          {t("order.samplesCta")} →
        </a>
      </div>
    </section>
  );
}
