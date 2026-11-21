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

      <div
        ref={(element) => {
          if (element) element.inert = !open;
        }}
        aria-hidden={!open}
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
          <button
            type="button"
            aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-[#020617]/55"
          />
          <aside
            id="main-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={locale === "ar" ? "القائمة الرئيسية" : "Main menu"}
            className={`absolute top-0 ${locale === "ar" ? "right-0 rounded-bl-2xl border-l" : "left-0 rounded-br-2xl border-r"} flex max-h-[85dvh] w-[min(21rem,88vw)] flex-col overflow-y-auto border-white/10 bg-surface p-6 text-ink shadow-2xl transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
              open ? "translate-x-0 opacity-100" : `${locale === "ar" ? "translate-x-full" : "-translate-x-full"} opacity-0`
            }`}
          >
            <div className="border-b border-white/10 pb-5">
              <div className="relative flex h-9 items-center justify-center">
                <h2 className="text-lg font-semibold">{locale === "ar" ? "القائمة" : "Menu"}</h2>
                <button
                  type="button"
                  aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"}
                  onClick={() => setOpen(false)}
                  className={`absolute ${locale === "ar" ? "right-0" : "left-0"} top-0 grid h-9 w-9 touch-manipulation place-items-center rounded-full text-slate-300 transition-colors duration-100 active:scale-95 hover:bg-surface-raised hover:text-ink`}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                    <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="mt-3 flex flex-col gap-1">
              <Link
                href="/#top"
                onClick={() => setOpen(false)}
                className="group flex touch-manipulation items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-200 transition-colors duration-100 hover:bg-surface-raised hover:text-ink"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center text-slate-400 transition group-hover:text-turmeric">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                    <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="flex-1">{locale === "ar" ? "الصفحة الرئيسية" : "Home"}</span>
              </Link>
              <Link
                href="/#restaurants"
                onClick={() => setOpen(false)}
                className="group flex touch-manipulation items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-200 transition-colors duration-100 hover:bg-surface-raised hover:text-ink"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center text-slate-400 transition group-hover:text-turmeric">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                    <circle cx="10.8" cy="10.8" r="6.8" />
                    <path d="m16 16 4.5 4.5M10.8 7.5v6.6m-3.3-3.3h6.6" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="flex-1">{locale === "ar" ? "استكشف المطاعم" : "Explore restaurants"}</span>
              </Link>
              <Link
                href="/#about"
                onClick={() => setOpen(false)}
                className="group flex touch-manipulation items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-200 transition-colors duration-100 hover:bg-surface-raised hover:text-ink"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center text-slate-400 transition group-hover:text-turmeric">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5m0-8h.01" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="flex-1">{locale === "ar" ? "عن الموقع" : "About"}</span>
              </Link>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="group flex touch-manipulation items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-200 transition-colors duration-100 hover:bg-surface-raised hover:text-ink"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center text-slate-400 transition group-hover:text-turmeric">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                    <path d="M12 3 4.5 6v5.5c0 4.4 3.2 7.8 7.5 9.5 4.3-1.7 7.5-5.1 7.5-9.5V6L12 3Z" strokeLinejoin="round" />
                    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="flex-1">{locale === "ar" ? "لوحة الإدارة" : "Admin"}</span>
              </Link>
              <div className="mt-2 border-t border-white/10 pt-2">
                <LanguageSwitcher locale={locale} variant="brand" />
              </div>
            </nav>
          </aside>
      </div>
    </>
  );
}
