/**
 * Centralna konfiguracja produktów.
 *
 * Aby dodać nowy produkt (np. bluzę):
 *   1. dopisz nowy obiekt do `productsConfig`
 *   2. (opcjonalnie) dorzuć grafiki do /public/products/<id>/
 * Edytor i katalog automatycznie go wykryją.
 */

export type ProductId = "mug" | "tshirt" | "notebook" | "keychain";

export type CanvasDimensions = {
  /** Wymiary pola nadruku w mm — używane do eksportu PDF/PNG w 300 DPI */
  widthMm: number;
  heightMm: number;
  /** Wymiary pola nadruku w pikselach na podglądzie (Konva Stage) */
  widthPx: number;
  heightPx: number;
  /** Pozycja pola nadruku na zdjęciu produktu (px, względem previewImage) */
  offsetXPx: number;
  offsetYPx: number;
};

export type ProductConfig = {
  id: ProductId;
  name: string;
  description: string;
  /** cena bazowa w groszach (PLN) */
  basePrice: number;
  currency: "PLN";
  canvas: CanvasDimensions;
  /** zdjęcie "czystego" produktu (background canvasu) */
  previewImage: string;
  /** opcjonalna maska/cień nakładana na nadruk dla realizmu */
  overlayImage?: string;
  /** kolor tła sceny pod produktem */
  sceneBg: string;
  /** dla sublimacji kubków — wymuszenie lustrzanego odbicia przy eksporcie */
  requiresMirrorPrint: boolean;
  /** dostępne warianty kolorystyczne produktu */
  colorVariants: { id: string; name: string; hex: string }[];
};

export const productsConfig: Record<ProductId, ProductConfig> = {
  mug: {
    id: "mug",
    name: "Kubek ceramiczny 330 ml",
    description: "Klasyczny biały kubek z nadrukiem sublimacyjnym.",
    basePrice: 3900,
    currency: "PLN",
    canvas: {
      widthMm: 200,
      heightMm: 90,
      widthPx: 600,
      heightPx: 270,
      offsetXPx: 110,
      offsetYPx: 165,
    },
    previewImage: "/kubek_merch.png",
    sceneBg: "#e9e6df",
    requiresMirrorPrint: true,
    colorVariants: [
      { id: "white", name: "Biały", hex: "#ffffff" },
      { id: "black", name: "Czarny", hex: "#1a1a1a" },
    ],
  },
  tshirt: {
    id: "tshirt",
    name: "Koszulka bawełniana premium",
    description: "100% bawełna, 180 g/m². Nadruk DTG.",
    basePrice: 7900,
    currency: "PLN",
    canvas: {
      widthMm: 300,
      heightMm: 400,
      widthPx: 360,
      heightPx: 480,
      offsetXPx: 180,
      offsetYPx: 140,
    },
    previewImage: "/products/tshirt/preview.png",
    sceneBg: "#cfd8d3",
    requiresMirrorPrint: false,
    colorVariants: [
      { id: "white", name: "Biały", hex: "#ffffff" },
      { id: "heather", name: "Szary melanż", hex: "#b8bdb8" },
      { id: "black", name: "Czarny", hex: "#111111" },
    ],
  },
  notebook: {
    id: "notebook",
    name: "Notes A5 z personalizacją",
    description: "Twardooprawiony notes z grawerowaną okładką.",
    basePrice: 5900,
    currency: "PLN",
    canvas: {
      widthMm: 140,
      heightMm: 200,
      widthPx: 280,
      heightPx: 400,
      offsetXPx: 160,
      offsetYPx: 120,
    },
    previewImage: "/products/notebook/preview.png",
    sceneBg: "#d8d2c3",
    requiresMirrorPrint: false,
    colorVariants: [
      { id: "kraft", name: "Kraft", hex: "#c9b48a" },
      { id: "black", name: "Czarny", hex: "#1a1a1a" },
    ],
  },
  keychain: {
    id: "keychain",
    name: "Brelok akrylowy",
    description: "Brelok 6×6 cm z full-color UV print.",
    basePrice: 1900,
    currency: "PLN",
    canvas: {
      widthMm: 60,
      heightMm: 60,
      widthPx: 240,
      heightPx: 240,
      offsetXPx: 120,
      offsetYPx: 120,
    },
    previewImage: "/products/keychain/preview.png",
    sceneBg: "#dde7e2",
    requiresMirrorPrint: false,
    colorVariants: [{ id: "clear", name: "Przezroczysty", hex: "#ffffff" }],
  },
};

export const productList: ProductConfig[] = Object.values(productsConfig);

/**
 * Lista produktów dostępnych aktualnie do personalizacji w UI.
 * Pozostałe pozycje (tshirt, notebook, keychain) tymczasowo ukryte —
 * konfiguracja zostaje, by nie psuć importów w innych modułach.
 */
export const availableProductList: ProductConfig[] = productList.filter((p) =>
  p.id === "mug",
);

export function getProduct(id: ProductId): ProductConfig {
  return productsConfig[id];
}
