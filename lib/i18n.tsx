"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import ru from "@/i18n/ru.json";
import kk from "@/i18n/kk.json";
import en from "@/i18n/en.json";
import type { Lang } from "@/lib/catalog";

export type Dict = typeof ru;
const dicts: Record<Lang, Dict> = { ru, kk: kk as Dict, en: en as Dict };
export const LANGS: { id: Lang; label: string }[] = [
  { id: "ru", label: "RU" },
  { id: "kk", label: "KZ" },
  { id: "en", label: "EN" },
];

type Ctx = {
  lang: Lang;
  dict: Dict;
  setLang: (l: Lang) => void;
  /** t("hero.line1") or t("calc.waMessage", { product: "…" }) */
  t: (path: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "mosaic-lang-v2";

function lookup(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), obj);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en"); // English for now

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && saved in dicts) setLangState(saved);
    } catch {
      /* storage blocked: stay on ru */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "kk" ? "kk" : lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(() => {
    const dict = dicts[lang];
    const t = (path: string, vars?: Record<string, string | number>) => {
      let s = lookup(dict, path);
      if (typeof s !== "string") s = lookup(ru, path);
      let out = typeof s === "string" ? s : path;
      if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
      return out;
    };
    return { lang, dict, setLang, t };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
