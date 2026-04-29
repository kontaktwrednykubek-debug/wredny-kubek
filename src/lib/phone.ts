/**
 * Walidacja polskiego numeru telefonu.
 * Akceptuje formaty: 123456789, 123 456 789, 123-456-789, +48 123 456 789, 0048123456789.
 * Po normalizacji wymaga dokładnie 9 cyfr (krajowy numer mobilny/stacjonarny).
 */
export function normalizePhonePL(raw: string): string {
  return raw.replace(/[\s\-().]/g, "").replace(/^(\+?48|0048)/, "");
}

export function isValidPhonePL(raw: string): boolean {
  const digits = normalizePhonePL(raw);
  return /^[0-9]{9}$/.test(digits);
}
