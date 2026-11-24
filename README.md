# MOSAIC.KZ — cinematic scroll site

Next.js (App Router) + TypeScript · GSAP ScrollTrigger + SplitText · Lenis · React Three Fiber + drei.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the build
```

## Where things live

| What | Where |
|---|---|
| All animation timings | `config/motion.ts` |
| Contacts, WhatsApp, Instagram, 2GIS, address | `config/site.ts` |
| Asset paths (textures, image sequence, rooms, interiors) | `config/site.ts → assets` |
| Products & collections | `data/products.json` |
| Copy (RU / KZ / EN) | `i18n/*.json` |
| Scenes 1–9 | `components/scenes/` |
| 3D (hero wall, finale logo) | `components/three/` |

## Placeholders to replace (search the code for `PLACEHOLDER`)

1. **Marble textures** → `public/textures/*.webp`, then set paths in `assets.textures`.
   Until then stone is generated procedurally in the browser.
2. **Split image sequence** (optional) → `public/seq/split/0001.webp…`, then set `assets.splitSequence`.
3. **Room photos** for the wall scene → `public/images/rooms/{bathroom,kitchen,floor}.webp`.
4. **Interior project photos** → `public/images/interiors/01…08.webp`.
5. **Prices/specs** → `data/products.json`.
6. **Address, Instagram, 2GIS, domain** → `config/site.ts`.
7. **Kazakh copy** → have a native speaker proofread `i18n/kk.json`.

The hero bathroom is a minimal 3D room built around the mosaic wall (`components/three/HeroScene.tsx → Room`),
so it works at any screen ratio without a photo.

## Real imagery pipeline

1. **Photos/textures** (e.g. from Canva): drop files into `public/_incoming/` named
   `carrara`, `onyx`, `travertine`, `sage`, `nero`, `bathroom`, `kitchen`, `floor`, `interior-01…08`
   (any image type), then run `npm run import-assets`. Files are resized and wired into `config/site.ts`.
2. **Photoreal 3D renders** (Blender 4.x/5.x, Cycles on the Apple GPU):
   `npm run render` renders one floating sheet per collection (`public/images/sheets/`) and the
   stone-splitting sequence (`public/seq/split/`), then `config/renders.json` switches the site to them.
   `npm run render -- preview` is a fast low-quality pass. Renders use the imported textures, so import first.

## Deploy

Push to GitHub → import on vercel.com → Deploy. Set `NEXT_PUBLIC_SITE_URL` to your domain in Vercel env vars.
