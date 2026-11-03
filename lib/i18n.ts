import { cookies } from "next/headers";

export type Locale = "ar" | "en";

export async function getLocale(): Promise<Locale> {
  const value = cookies().get("menu-locale")?.value;
  return value === "en" ? "en" : "ar";
}

export function localizedText(locale: Locale, arabic: string, english: string) {
  return locale === "en" ? english : arabic;
}

export function localizedValue(locale: Locale, arabic: string, english?: string | null) {
  return locale === "en" ? english?.trim() || arabic : arabic;
}
