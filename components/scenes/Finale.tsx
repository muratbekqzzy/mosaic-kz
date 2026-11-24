"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";
import { motion } from "@/config/motion";
import { site } from "@/config/site";
import { waLink } from "@/lib/whatsapp";
import { sceneTimeline, useSceneVisible } from "@/lib/stage";
import { rosette, SOFT } from "@/lib/ornament";
import { MosaicCanvas, type MosaicState } from "@/components/ui/MosaicCanvas";
import { WhatsAppIcon } from "@/components/ui/WhatsAppFab";

/**
 * SCENE 9 — The finale: the brand's spiral flower is laid once more, larger, in rose and
 * gold, and keeps turning slowly while the invitation rises beneath it.
 */
export function Finale() {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const state = useRef<MosaicState>({ p: 1, rot: 0, zoom: 1 });
  const visible = useSceneVisible("contacts");
  const design = useMemo(
    () =>
      rosette({
        arms: 10,
        seed: 21,
        palettes: [
          { main: [SOFT.blush, SOFT.rose, SOFT.blush], edge: [SOFT.roseDeep, SOFT.gold] },
          { main: [SOFT.goldHi, SOFT.linen, SOFT.goldHi], edge: [SOFT.gold, SOFT.terracotta] },
        ],
        centre: [SOFT.gold, SOFT.paper, SOFT.sage, SOFT.goldHi, SOFT.rose],
      }),
    [],
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        state.current.p = 0;
        sceneTimeline("contacts", { defaults: { ease: "none" } })
          .to(state.current, { p: 1, duration: 0.7, ease: "power1.inOut" }, 0)
          .fromTo(state.current, { rot: 0.6 }, { rot: -0.4, duration: 1 }, 0)
          .from(".finale__cta > *", { y: 40, opacity: 0, stagger: 0.04, duration: 0.14, ease: motion.ease.enter }, 0.55)
          .from(".finale .footer", { opacity: 0, duration: 0.1 }, 0.8);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="contacts" data-scene="contacts" className="finale" data-bg="paper" aria-labelledby="finale-title">
      <div className="finale__stage">
        <MosaicCanvas design={design} state={state} className="finale__canvas" fit={0.94} spin={-0.04} active={visible} />
      </div>
      <div className="finale__cta">
        <h2 id="finale-title" className="display">
          {t("finale.title")}
        </h2>
        <a className="btn btn--wa btn--xl" href={waLink(t("wa.hello"))} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon size={22} /> {t("finale.cta")}
        </a>
        <div className="finale__links">
          <a href={site.instagram} target="_blank" rel="noopener noreferrer">
            {t("finale.instagram")} {site.instagramHandle}
          </a>
          <a href={site.twoGis} target="_blank" rel="noopener noreferrer">
            {t("finale.map")} ↗
          </a>
          <a href={`tel:+${site.whatsapp}`}>{site.phoneDisplay}</a>
        </div>
        <address className="finale__addr">
          <span>{t("finale.address")}</span> {site.address.street}, {site.address.city} · {t("finale.hours")}
        </address>
      </div>
      <Footer />
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} MOSAIC.KZ</span>
      <span>{t("finale.rights")}</span>
    </footer>
  );
}
