"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n, LANGS } from "@/lib/i18n";
import { Logo } from "@/components/ui/Logo";
import { useLenis, scrollToId } from "@/components/ui/SmoothScroll";
import { motion } from "@/config/motion";

const NAV = [
  { id: "spiral", key: "nav.piece" },
  { id: "stones", key: "nav.interiors" },
  { id: "delivery", key: "nav.delivery" },
  { id: "order", key: "nav.order" },
  { id: "contacts", key: "nav.contacts" },
];

/** Sticky, minimal; slides away on scroll down, returns on scroll up. */
export function Header() {
  const { t, lang, setLang } = useI18n();
  const lenis = useLenis();
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let hidden = false;
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > last && y > motion.header.hideAfter;
      if (down !== hidden) {
        hidden = down;
        ref.current?.classList.toggle("is-hidden", hidden);
      }
      ref.current?.classList.toggle("is-solid", y > 40);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    if (pathname !== "/") return; // let the link navigate home
    e.preventDefault();
    setOpen(false);
    scrollToId(lenis, id);
  };

  const links = NAV.map((n) => (
    <a key={n.id} href={`/#${n.id}`} onClick={go(n.id)}>
      {t(n.key)}
    </a>
  ));

  return (
    <>
    <header ref={ref} className={`header ${open ? "is-open" : ""}`}>
      <Link href="/" aria-label="MOSAIC.KZ" onClick={pathname === "/" ? go("top") : undefined}>
        <Logo />
      </Link>
      <nav className="header__nav" aria-label="Main">
        {links}
      </nav>
      {/* language switch hidden while the site is English-only */}
      <div className="header__lang" role="group" aria-label="Language" hidden>
        {LANGS.map((l) => (
          <button key={l.id} className={l.id === lang ? "is-active" : ""} onClick={() => setLang(l.id)} aria-pressed={l.id === lang}>
            {l.label}
          </button>
        ))}
      </div>
      <button className="header__burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t("nav.menu")}>
        <span />
        <span />
      </button>
    </header>
    {/* mobile menu lives outside the header: the header's backdrop-filter would trap a fixed child */}
    <nav className={`mnav ${open ? "is-open" : ""}`} aria-label="Mobile" aria-hidden={!open} inert={!open}>
      {links}
    </nav>
    </>
  );
}
