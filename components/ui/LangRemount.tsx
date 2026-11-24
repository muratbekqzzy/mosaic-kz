"use client";

import { Fragment, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * Remounts the scenes when the language changes, so SplitText and
 * ScrollTrigger rebuild cleanly around the new copy.
 */
export function LangRemount({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  return <Fragment key={lang}>{children}</Fragment>;
}
