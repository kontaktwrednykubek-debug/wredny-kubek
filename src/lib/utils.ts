import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(grosze: number): string {
  // Kwoty okrągłe (bez groszy) pokazujemy bez ",00" → "35 zł".
  // Z groszami → pełny format "35,50 zł".
  const hasGrosze = grosze % 100 !== 0;
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: hasGrosze ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(grosze / 100);
}
