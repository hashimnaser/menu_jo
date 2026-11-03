"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export default function LanguageSwitcher({
  locale,
  variant = "light",
}: {
  locale: Locale;
  variant?: "light" | "brand";
}) {
  const [changing, setChanging] = useState(false);

  function changeLanguage() {
    if (changing) return;
    setChanging(true);
    const nextLocale = locale === "ar" ? "en" : "ar";
    document.cookie = `menu-locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={changeLanguage}
      disabled={changing}
      lang={locale === "ar" ? "en" : "ar"}
      aria-label={locale === "ar" ? "Switch language to English" : "غيّر اللغة إلى العربية"}
      className={`touch-manipulation text-sm transition-colors duration-100 active:scale-95 disabled:opacity-60 ${
        variant === "brand"
          ? "flex w-full items-center gap-3 border-b border-white/10 px-2 py-4 font-medium text-slate-200 hover:text-turmeric"
          : "rounded-full border border-slate-200 bg-slate-100 px-3 py-2 font-bold text-slate-700 hover:border-amber-400 hover:text-amber-600"
      }`}
    >
      {variant === "brand" && (
        <span className="grid h-8 w-8 shrink-0 place-items-center text-slate-400">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18" strokeLinecap="round" />
          </svg>
        </span>
      )}
      {variant === "brand" && <span className="flex-1 text-start">{locale === "ar" ? "اللغة" : "Language"}</span>}
      <span className={variant === "brand" ? "text-sm text-slate-400" : undefined}>{locale === "ar" ? "English" : "العربية"}</span>
    </button>
  );
}
