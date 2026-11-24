import rendersJson from "./renders.json";

const renders = rendersJson as { sheets: Record<string, string>; split: null | { count: number; ext: string } };

/**
 * SITE CONFIG — contacts and asset paths.
 * Anything marked PLACEHOLDER must be replaced before launch.
 */
export const site = {
  name: "MOSAIC.KZ",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mosaic.kz", // PLACEHOLDER: your real domain
  whatsapp: "77751515688",
  instagram: "https://instagram.com/mosaic.kz", // PLACEHOLDER
  instagramHandle: "@mosaic.kz", // PLACEHOLDER
  twoGis: "https://2gis.kz/almaty/search/mosaic.kz", // PLACEHOLDER: your 2GIS card URL
  phoneDisplay: "+7 775 151 56 88",
  address: {
    street: "PLACEHOLDER: ул. Примерная, 1", // PLACEHOLDER
    city: "Алматы",
    region: "Алматы",
    postalCode: "050000", // PLACEHOLDER
    country: "KZ",
    lat: 43.2389, // PLACEHOLDER: showroom coordinates
    lng: 76.8897,
  },
  hours: "Mo-Sa 10:00-19:00", // PLACEHOLDER
};

/**
 * ASSETS — set a path once you have the real file in /public.
 * `null` = use the built-in generated placeholder (no 404s, no broken images).
 */
export const assets = {
  textures: {
    // Seamless marble photos, 1024–2048px, .webp. Put them in /public/textures/
    carrara: "/textures/carrara.jpg", // Canva-generated photo
    onyx: "/textures/onyx.jpg", // derived from the Carrara photo — replace with a real photo via npm run import-assets
    travertine: "/textures/travertine.jpg", // derived from the Carrara photo — replace with a real photo via npm run import-assets
    sage: "/textures/sage.jpg", // derived from the Carrara photo — replace with a real photo via npm run import-assets
    nero: "/textures/nero.jpg", // derived from the Carrara photo — replace with a real photo via npm run import-assets
  },
  /** Image sequence of a stone block splitting: /public/seq/split/0001.webp … */
  splitSequence: (renders.split
    ? { count: renders.split.count, pattern: (i: number) => `/seq/split/${String(i + 1).padStart(4, "0")}.${renders.split!.ext}` }
    : null) as null | { count: number; pattern: (i: number) => string },
  /** Blender renders of each collection sheet (npm run render), keyed by collection id */
  sheets: renders.sheets as Record<string, string>,
  // example once you have frames:
  // splitSequence: { count: 120, pattern: (i) => `/seq/split/${String(i + 1).padStart(4, "0")}.webp` },
  rooms: {
    bathroom: "/images/rooms/bathroom.svg", // PLACEHOLDER
    kitchen: "/images/rooms/kitchen.svg", // PLACEHOLDER
    floor: "/images/rooms/floor.svg", // PLACEHOLDER
  },
  interiors: ["/images/interiors/01.svg","/images/interiors/02.svg","/images/interiors/03.svg","/images/interiors/04.svg","/images/interiors/05.svg","/images/interiors/06.svg","/images/interiors/07.svg","/images/interiors/08.svg"],
};
