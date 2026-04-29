/**
 * Globalny motyw aplikacji.
 * Zmieniaj kolory w JEDNYM miejscu — wszystkie komponenty (Tailwind + CSS vars)
 * automatycznie się zaktualizują.
 *
 * Wartości HSL bez funkcji `hsl(...)` — Tailwind dokleja alpha:
 *   "H S% L%"  →  hsl(H S% L% / <alpha>)
 */
export type ThemePalette = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
};

export const lightTheme: ThemePalette = {
  background: "40 33% 97%",        // ciepła kość słoniowa
  foreground: "180 25% 12%",
  card: "0 0% 100%",
  cardForeground: "180 25% 12%",
  muted: "40 20% 93%",
  mutedForeground: "180 8% 40%",
  primary: "172 55% 28%",          // głęboka zieleń morska (jak w mockupie)
  primaryForeground: "40 33% 97%",
  accent: "150 35% 75%",           // pastelowa mięta
  accentForeground: "180 25% 12%",
  border: "40 15% 88%",
  input: "40 15% 88%",
  ring: "172 55% 28%",
};

export const darkTheme: ThemePalette = {
  background: "180 18% 8%",
  foreground: "40 30% 95%",
  card: "180 18% 11%",
  cardForeground: "40 30% 95%",
  muted: "180 12% 16%",
  mutedForeground: "40 10% 65%",
  primary: "150 60% 55%",
  primaryForeground: "180 25% 8%",
  accent: "172 35% 30%",
  accentForeground: "40 30% 95%",
  border: "180 12% 20%",
  input: "180 12% 20%",
  ring: "150 60% 55%",
};

export const brand = {
  name: "WrednyKubek",
  tagline: "Stwórz swój własny merch",
} as const;
