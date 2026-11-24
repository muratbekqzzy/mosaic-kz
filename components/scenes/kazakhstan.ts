/**
 * Simplified outline of Kazakhstan (lon, lat) — a stylised, minimal map,
 * not survey-accurate. Replace OUTLINE with a precise path if you need one.
 */
export const OUTLINE: [number, number][] = [
  [46.6, 48.4], [47.2, 49.2], [46.9, 49.9], [48.2, 50.6], [48.7, 51.5], [50.8, 51.7], [52.5, 51.5],
  [54.6, 50.6], [55.7, 50.6], [56.5, 51.1], [58.4, 51.1], [59.5, 50.6], [60.9, 50.8], [61.6, 51.3],
  [60.0, 51.9], [61.0, 52.9], [62.1, 53.0], [61.2, 54.0], [63.0, 54.2], [65.0, 54.6], [68.2, 54.9],
  [69.2, 55.4], [70.8, 55.3], [71.2, 54.1], [73.4, 54.0], [73.8, 53.6], [76.1, 54.3], [76.5, 53.8],
  [78.0, 52.9], [80.0, 51.2], [81.4, 50.9], [83.4, 51.0], [85.0, 50.2], [86.2, 49.5], [87.3, 49.1],
  [85.5, 48.3], [85.6, 47.2], [83.0, 47.2], [82.3, 45.5], [80.0, 45.1], [80.3, 44.0], [80.8, 43.2],
  [80.2, 42.2], [79.2, 42.8], [77.0, 42.9], [75.0, 42.7], [73.5, 42.5], [71.1, 42.7], [70.9, 42.2],
  [69.0, 41.4], [68.2, 40.7], [66.6, 41.2], [66.0, 42.9], [62.0, 43.5], [58.6, 45.6], [56.0, 45.0],
  [56.0, 41.3], [55.4, 41.3], [53.0, 42.2], [52.8, 42.8], [51.3, 43.2], [51.0, 44.4], [50.3, 44.6],
  [51.5, 45.3], [53.0, 45.3], [53.2, 46.5], [51.2, 47.0], [49.2, 46.4], [48.6, 47.4], [46.6, 48.4],
];

export const CITIES: Record<string, [number, number]> = {
  almaty: [76.9, 43.25],
  astana: [71.45, 51.17],
  shymkent: [69.6, 42.32],
  karaganda: [73.1, 49.8],
  aktobe: [57.2, 50.28],
  atyrau: [51.92, 47.1],
  aktau: [51.2, 43.65],
  oskemen: [82.6, 49.95],
  pavlodar: [76.95, 52.29],
  kostanay: [63.62, 53.21],
  taraz: [71.37, 42.9],
  kyzylorda: [65.5, 44.85],
  uralsk: [51.37, 51.23],
  petropavl: [69.15, 54.87],
  semey: [80.25, 50.41],
  turkestan: [68.25, 43.3],
};
export const CITY_IDS = Object.keys(CITIES);

// equirectangular projection with latitude correction, into a 1000 × 560 box
const LON0 = 46,
  LON1 = 88,
  LAT0 = 40.4,
  LAT1 = 55.8;
const KX = Math.cos((48 * Math.PI) / 180);
export const MAP_W = 1000;
export const MAP_H = Math.round((MAP_W * ((LAT1 - LAT0) / ((LON1 - LON0) * KX))));
export const project = ([lon, lat]: [number, number]): [number, number] => [
  ((lon - LON0) / (LON1 - LON0)) * MAP_W,
  ((LAT1 - lat) / (LAT1 - LAT0)) * MAP_H,
];
export const outlinePath = () => "M" + OUTLINE.map((p) => project(p).map((v) => v.toFixed(1)).join(",")).join("L") + "Z";

/** Quadratic arc from a to b, bowed upward. */
export function arcPath(a: [number, number], b: [number, number]) {
  const [x1, y1] = project(a),
    [x2, y2] = project(b);
  const mx = (x1 + x2) / 2,
    my = (y1 + y2) / 2;
  const d = Math.hypot(x2 - x1, y2 - y1);
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${(my - d * 0.28).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}
