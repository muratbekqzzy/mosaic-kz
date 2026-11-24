"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";
import { motion } from "@/config/motion";
import { assets } from "@/config/site";
import { sceneTimeline } from "@/lib/stage";
import { paisley, toPathD, SOFT } from "@/lib/ornament";
import { STONE_FALLBACK, type StoneKey } from "@/lib/marble";

const STONES: StoneKey[] = ["carrara", "onyx", "travertine", "sage", "nero"];
const STEP = 360 / STONES.length;

/**
 * SCENE 3 — Five stones, one flower. Five paisley petals (the ram's horn given a body)
 * form a pinwheel; each is cut from a different stone. Gold outlines draw first, the
 * stone fills in, then the flower turns petal by petal as each stone is introduced.
 */
export function Stones() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const petalD = useMemo(() => toPathD(paisley(1.05, 0.22)) + "Z", []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const petals = gsap.utils.toArray<SVGGElement>(".stones__petal");
        const outlines = gsap.utils.toArray<SVGPathElement>(".stones__outline");
        const fills = gsap.utils.toArray<SVGPathElement>(".stones__fill");
        const items = gsap.utils.toArray<HTMLElement>(".stones__item");
        gsap.set(items, { autoAlpha: 0 });
        // rotate the flower and its petals around the flower's heart (0,0 of the viewBox)
        gsap.set([".stones__flower", ...petals], { svgOrigin: "0 0" });

        const tl = sceneTimeline("stones", { defaults: { ease: "none" } });
        tl.from(".stones__head > *", { y: 24, opacity: 0, stagger: 0.03, duration: 0.08, ease: motion.ease.enter }, 0)
          .fromTo(outlines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.16, stagger: 0.025, ease: "power2.inOut" }, 0.02)
          .from(fills, { opacity: 0, duration: 0.1, stagger: 0.025 }, 0.12)
          .from(".stones__heart", { scale: 0, transformOrigin: "50% 50%", duration: 0.06, ease: motion.ease.settle }, 0.16)
          .fromTo(".stones__flower", { rotation: -40, svgOrigin: "0 0" }, { rotation: 0, duration: 0.22, ease: "power3.out", svgOrigin: "0 0" }, 0);

        // the flower turns one petal per stone; the active petal comes forward
        const seg = 0.74 / STONES.length;
        STONES.forEach((_, i) => {
          const at = 0.24 + i * seg;
          tl.to(".stones__flower", { rotation: -i * STEP, duration: seg * 0.55, ease: "power2.inOut", svgOrigin: "0 0" }, at)
            .to(petals, { opacity: (j) => (j === i ? 1 : 0.42), scale: (j) => (j === i ? 1.08 : 0.96), svgOrigin: "0 0", duration: seg * 0.5 }, at)
            .to(items[i], { autoAlpha: 1, y: 0, duration: seg * 0.35, ease: motion.ease.enter }, at + seg * 0.15);
          if (i > 0) tl.to(items[i - 1], { autoAlpha: 0, y: -16, duration: seg * 0.25 }, at);
        });
        gsap.set(items, { y: 16 });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="stones" data-scene="stones" className="stones" data-bg="linen" aria-labelledby="stones-title">
      <div className="stones__head">
        <p className="kicker">{t("stones.kicker")}</p>
        <h2 id="stones-title" className="display">
          {t("stones.title")}
        </h2>
      </div>

      <svg className="stones__svg" viewBox="-0.95 -0.95 1.9 1.9" aria-hidden>
        <defs>
          {STONES.map((s) => (
            <pattern key={s} id={`stone-${s}`} patternUnits="userSpaceOnUse" x="-0.6" y="-0.6" width="1.2" height="1.2">
              <rect width="1.2" height="1.2" fill={STONE_FALLBACK[s]} />
              {assets.textures[s] && <image href={assets.textures[s]!} width="1.2" height="1.2" preserveAspectRatio="xMidYMid slice" />}
            </pattern>
          ))}
          <radialGradient id="stones-sheen" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="stones__flower">
          {STONES.map((s, i) => (
            <g key={s} className="stones__petal" transform={`rotate(${i * STEP - 90})`}>
              <g transform="translate(0.06 0) scale(0.95)">
                <path className="stones__fill" d={petalD} fill={`url(#stone-${s})`} />
                <path d={petalD} fill="url(#stones-sheen)" opacity="0.7" />
                <path className="stones__outline" d={petalD} pathLength={1} strokeDasharray="1" fill="none" stroke={SOFT.gold} strokeWidth="0.006" />
              </g>
            </g>
          ))}
          <g className="stones__heart">
            <circle r="0.07" fill={SOFT.paper} stroke={SOFT.gold} strokeWidth="0.006" />
            <circle r="0.03" fill={SOFT.pomegranate} />
          </g>
        </g>
      </svg>

      <ol className="stones__list">
        {STONES.map((s, i) => (
          <li key={s} className="stones__item">
            <span className="stones__index">0{i + 1} · {t(`stones.items.${i}.origin`)}</span>
            <h3 className="display">{t(`stones.items.${i}.name`)}</h3>
            <p>{t(`stones.items.${i}.note`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
