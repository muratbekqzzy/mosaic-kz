import data from "@/data/products.json";
import type { StoneKey } from "@/lib/marble";

export type Lang = "ru" | "kk" | "en";
export type L10n = Record<Lang, string>;

export type Product = {
  slug: string;
  collection: string;
  name: L10n;
  stone: L10n;
  texture: StoneKey;
  sizes: string[];
  pricePerSheet: number;
  pricePerM2: number;
  sheetsPerM2: number;
  images: string[];
};

export type Pattern = "flora" | "hex" | "square" | "arabesque" | "flex";

export type Collection = {
  id: string;
  pattern: Pattern;
  tone: string;
  ink: string;
  name: L10n;
  line: L10n;
};

export const products = data.products as Product[];
export const collections = data.collections as Collection[];

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const productsIn = (collectionId: string) => products.filter((p) => p.collection === collectionId);
export const collectionById = (id: string) => collections.find((c) => c.id === id);

export const formatTenge = (n: number, lang: Lang = "ru") =>
  new Intl.NumberFormat(lang === "en" ? "en-US" : "ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₸";
