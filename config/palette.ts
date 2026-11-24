/**
 * "NIGHT ATELIER" — the palette.
 * Stone looks most precious in warm darkness under a single raking light,
 * so the story lives mostly in deep warm blacks; daylight sections (the wall,
 * the calculator, ordering) are the breaths in between.
 */
export const palette = {
  obsidian: "#0E0C0A", // base of the 3D scenes
  umber: "#18130F", // dark sections
  walnut: "#3B2C21", // wood, deep accents
  bone: "#F3EEE6", // text on dark
  limestone: "#E8E0D3", // daylight sections
  travertine: "#CDBB9F",
  brass: "#C9A061", // accent: used sparingly
  brassHi: "#EBCB8E",
  sage: "#26302A", // deep sage section
  sageHi: "#A9B6A1",
} as const;

export type ToneKey = keyof typeof palette;
