/**
 * Katalog czcionek (Canva-style). Wszystkie z Google Fonts.
 * Ładujemy je jednym linkiem `<link>` w EditorContainer (tylko na /edytor),
 * żeby nie spowalniać reszty sklepu.
 */

export type FontCategory =
  | "sans"
  | "serif"
  | "display"
  | "handwriting"
  | "mono";

export type FontDef = {
  family: string;
  category: FontCategory;
  /** waga do załadowania, np. "400;700" */
  weights?: string;
  /** czy obsługuje italic */
  italic?: boolean;
};

export const FONTS: FontDef[] = [
  // sans-serif
  { family: "Inter", category: "sans", weights: "400;500;700", italic: true },
  { family: "Roboto", category: "sans", weights: "400;700", italic: true },
  { family: "Poppins", category: "sans", weights: "400;600;800", italic: true },
  { family: "Montserrat", category: "sans", weights: "400;700;900", italic: true },
  { family: "Lato", category: "sans", weights: "400;700;900", italic: true },
  { family: "Open Sans", category: "sans", weights: "400;700", italic: true },
  { family: "Raleway", category: "sans", weights: "400;700;900", italic: true },
  { family: "Bebas Neue", category: "sans", weights: "400" },
  { family: "Oswald", category: "sans", weights: "400;700" },

  // serif
  { family: "Playfair Display", category: "serif", weights: "400;700;900", italic: true },
  { family: "Merriweather", category: "serif", weights: "400;700;900", italic: true },
  { family: "Lora", category: "serif", weights: "400;700", italic: true },
  { family: "EB Garamond", category: "serif", weights: "400;700", italic: true },
  { family: "Cormorant Garamond", category: "serif", weights: "400;700", italic: true },
  { family: "Libre Baskerville", category: "serif", weights: "400;700", italic: true },

  // display
  { family: "Lobster", category: "display", weights: "400" },
  { family: "Pacifico", category: "display", weights: "400" },
  { family: "Anton", category: "display", weights: "400" },
  { family: "Righteous", category: "display", weights: "400" },
  { family: "Permanent Marker", category: "display", weights: "400" },
  { family: "Press Start 2P", category: "display", weights: "400" },
  { family: "Bungee", category: "display", weights: "400" },
  { family: "Russo One", category: "display", weights: "400" },
  { family: "Abril Fatface", category: "display", weights: "400" },

  // handwriting
  { family: "Dancing Script", category: "handwriting", weights: "400;700" },
  { family: "Caveat", category: "handwriting", weights: "400;700" },
  { family: "Shadows Into Light", category: "handwriting", weights: "400" },
  { family: "Indie Flower", category: "handwriting", weights: "400" },
  { family: "Sacramento", category: "handwriting", weights: "400" },
  { family: "Great Vibes", category: "handwriting", weights: "400" },
  { family: "Satisfy", category: "handwriting", weights: "400" },
  { family: "Kalam", category: "handwriting", weights: "400;700" },
  { family: "Amatic SC", category: "handwriting", weights: "400;700" },

  // mono
  { family: "JetBrains Mono", category: "mono", weights: "400;700", italic: true },
  { family: "Fira Code", category: "mono", weights: "400;700" },
  { family: "Source Code Pro", category: "mono", weights: "400;700" },
];

export const CATEGORY_LABELS: Record<FontCategory, string> = {
  sans: "Bezszeryfowe",
  serif: "Szeryfowe",
  display: "Ozdobne",
  handwriting: "Pisane",
  mono: "Monospace",
};

/**
 * Buduje URL do Google Fonts API z całym katalogiem fontów,
 * z odpowiednimi wagami i italic.
 *
 * Przykład pojedynczego wpisu:
 *   family=Inter:ital,wght@0,400;0,700;1,400;1,700
 */
export function buildGoogleFontsUrl(): string {
  const parts = FONTS.map((f) => {
    const weights = (f.weights ?? "400").split(";");
    if (f.italic) {
      const ital = weights
        .flatMap((w) => [`0,${w}`, `1,${w}`])
        .join(";");
      return `family=${encodeURIComponent(f.family)}:ital,wght@${ital}`;
    }
    return `family=${encodeURIComponent(f.family)}:wght@${weights.join(";")}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}
