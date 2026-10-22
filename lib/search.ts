// Normalizes Arabic so "شاورما" matches "شَاوِرْمَا", "أ/إ/آ" -> "ا", "ة" -> "ه", "ى" -> "ي"
export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}
