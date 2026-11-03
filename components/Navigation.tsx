"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { Locale } from "@/lib/i18n";

export default function Navigation({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 touch-manipulation place-items-center rounded-full border border-white/15 bg-surface text-ink transition-colors duration-100 active:scale-95 hover:border-turmeric hover:text-turmeric"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]" dir={locale === "ar" ? "rtl" : "ltr"}>
          <button
            type="button"
            aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-[#020617]"
          />
          <aside
            id="main-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={locale === "ar" ? "القائمة الرئيسية" : "Main menu"}
            className={`absolute inset-y-0 ${locale === "ar" ? "right-0 border-l" : "left-0 border-r"} flex w-[min(21rem,88vw)] flex-col border-white/10 bg-surface p-6 text-ink shadow-2xl`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <h2 className="text-lg font-semibold">{locale === "ar" ? "القائمة" : "Menu"}</h2>
              <button
                type="button"
                aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"}
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 touch-manipulation place-items-center rounded-full text-slate-300 transition-colors duration-100 active:scale-95 hover:bg-surface-raised hover:text-ink"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                  <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="mt-3 flex flex-col">
              <LanguageSwitcher locale={locale} variant="brand" />
              <Link
                href="/#about"
                onClick={() => setOpen(false)}
                className="group flex touch-manipulation items-center gap-3 border-b border-white/10 px-2 py-4 text-sm font-medium text-slate-200 transition-colors duration-100 active:scale-[0.99] hover:text-turmeric"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center text-slate-400 transition group-hover:text-turmeric">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5m0-8h.01" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="flex-1">{locale === "ar" ? "عن الموقع" : "About"}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current text-slate-500 transition group-hover:text-turmeric" strokeWidth="1.8">
                  <path d={locale === "ar" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/admin/add-restaurant"
                onClick={() => setOpen(false)}
                className="group flex touch-manipulation items-center gap-3 border-b border-white/10 px-2 py-4 text-sm font-medium text-slate-200 transition-colors duration-100 active:scale-[0.99] hover:text-turmeric"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center text-slate-400 transition group-hover:text-turmeric">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                    <path d="M12 3 4.5 6v5.5c0 4.4 3.2 7.8 7.5 9.5 4.3-1.7 7.5-5.1 7.5-9.5V6L12 3Z" strokeLinejoin="round" />
                    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="flex-1">{locale === "ar" ? "لوحة الإدارة" : "Admin"}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current text-slate-500 transition group-hover:text-turmeric" strokeWidth="1.8">
                  <path d={locale === "ar" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
