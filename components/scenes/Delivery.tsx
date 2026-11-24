"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";
import { motion } from "@/config/motion";
import { sceneTimeline } from "@/lib/stage";
import { CITIES, CITY_IDS, MAP_H, MAP_W, arcPath, outlinePath, project } from "@/components/scenes/kazakhstan";

/** five round petals — the bloom that opens at every city */
const BLOOM = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
  return `M0,0 C${(Math.cos(a - 0.5) * 9).toFixed(1)},${(Math.sin(a - 0.5) * 9).toFixed(1)} ${(Math.cos(a + 0.5) * 9).toFixed(1)},${(Math.sin(a + 0.5) * 9).toFixed(1)} 0,0Z`;
}).join("");

/** SCENE 6 — Delivery: arcs from Almaty draw in across a minimal map of Kazakhstan. */
export function Delivery() {
  const { t, dict, lang } = useI18n();
  const root = useRef<HTMLElement>(null);
  const others = CITY_IDS.filter((c) => c !== "almaty");
  const [ax, ay] = project(CITIES.almaty);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const arcs = gsap.utils.toArray<SVGPathElement>(".map__arc");
        arcs.forEach((p) => {
          const len = p.getTotalLength();
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        });
        sceneTimeline("delivery")
          .from(".map__outline", { opacity: 0, scale: 0.96, transformOrigin: "50% 50%", duration: 0.15, ease: motion.ease.enter }, 0)
          .from(".map__almaty", { scale: 0, transformOrigin: `${ax}px ${ay}px`, duration: 0.08, ease: motion.ease.settle }, 0.08)
          .to(arcs, { strokeDashoffset: 0, duration: 0.3, stagger: motion.delivery.arcStagger, ease: motion.ease.move }, 0.14)
          .from(".map__city", { opacity: 0, duration: 0.06, stagger: motion.delivery.arcStagger }, 0.3)
          .from(".map__bloom", { scale: 0, rotation: -90, transformOrigin: "50% 50%", duration: 0.1, stagger: motion.delivery.arcStagger, ease: motion.ease.settle }, 0.3)
          .from(".delivery__terms li", { y: 30, opacity: 0, stagger: 0.05, duration: 0.15, ease: motion.ease.enter }, 0.45);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="delivery" data-scene="delivery" className="delivery" data-bg="paper" aria-labelledby="delivery-title">
      <div className="delivery__text">
        <p className="kicker">{t("delivery.kicker")}</p>
        <h2 id="delivery-title" className="display">
          {t("delivery.title")}
        </h2>
        <ul className="delivery__terms">
          {dict.delivery.terms.map((x) => (
            <li key={x.k}>
              <strong>{x.k}</strong>
              <span>{x.v}</span>
            </li>
          ))}
        </ul>
      </div>
      <svg className="map" viewBox={`-20 -40 ${MAP_W + 40} ${MAP_H + 60}`} role="img" aria-label={t("delivery.title")}>
        <path className="map__outline" d={outlinePath()} />
        {others.map((c) => (
          <path key={c} className="map__arc" d={arcPath(CITIES.almaty, CITIES[c])} />
        ))}
        {others.map((c) => {
          const [x, y] = project(CITIES[c]);
          return (
            <g key={c} className="map__city">
              <path className="map__bloom" d={BLOOM} transform={`translate(${x} ${y})`} />
              <circle cx={x} cy={y} r={1.6} className="map__seed" />
              <text x={x + 8} y={y + 4}>
                {t(`cities.${c}`)}
              </text>
            </g>
          );
        })}
        <g className="map__almaty">
          <circle cx={ax} cy={ay} r={18} className="map__pulse" />
          <circle cx={ax} cy={ay} r={8} className="map__brass" />
          <text x={ax + 14} y={ay + 26}>
            {t("cities.almaty")}
          </text>
        </g>
      </svg>
    </section>
  );
}
