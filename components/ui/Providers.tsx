"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { TexturesProvider } from "@/components/ui/Textures";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <TexturesProvider>
        <SmoothScroll>{children}</SmoothScroll>
      </TexturesProvider>
    </I18nProvider>
  );
}
