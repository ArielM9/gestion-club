/**
 * Normalizes a string by removing accents/diacritics and converting to lowercase.
 * Useful for accent-insensitive search.
 */
export function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
