/**
 * Walidacja numeru telefonu (PL + międzynarodowy E.164).
 *
 * Akceptuje:
 *  - 9 cyfr PL: 600100200, 600 100 200, 600-100-200
 *  - PL z prefiksem: +48 600 100 200, 0048 600100200
 *  - Dowolny międzynarodowy E.164: +41 78 206 73 79, +44 7700 900123
 *
 * Po normalizacji (usunięcie spacji/myślników/nawiasów):
 *  - albo 9 cyfr (krajowy PL),
 *  - albo + i 8–15 cyfr (E.164).
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw.replace(/[\s\-().]/g, "");
  // Zamień prefiks 00 na +
  return trimmed.replace(/^00/, "+");
}

export function isValidPhone(raw: string): boolean {
  const v = normalizePhone(raw);
  if (/^\+[1-9]\d{7,14}$/.test(v)) return true; // E.164
  if (/^\d{9}$/.test(v)) return true; // krajowy PL
  return false;
}

/** Wstecznie kompatybilne aliasy. */
export const normalizePhonePL = normalizePhone;
export const isValidPhonePL = isValidPhone;
