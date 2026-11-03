"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import type { Locale } from "@/lib/i18n";

export default function Brand({ locale = "ar" }: { locale?: Locale }) {
  const pathname = usePathname();
  const isRestaurantPage = pathname.split("/").filter(Boolean).length === 1;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0F172A]">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-[4.5rem] sm:px-8">
        {isRestaurantPage ? (
          <Link
            href="/"
            aria-label={locale === "ar" ? "العودة إلى المطاعم" : "Back to restaurants"}
            className="grid h-10 w-10 touch-manipulation shrink-0 place-items-center rounded-full border border-white/10 bg-surface text-ink/80 transition-colors duration-100 active:scale-95 hover:border-turmeric/50 hover:text-turmeric sm:h-11 sm:w-11"
          >
            <span aria-hidden="true" className="text-xl">{locale === "ar" ? "→" : "←"}</span>
          </Link>
        ) : (
          <Navigation locale={locale} />
        )}
        <Link
          href="/"
          aria-label={locale === "ar" ? "MenU - الصفحة الرئيسية" : "MenU - Home"}
          className="absolute left-1/2 inline-flex -translate-x-1/2 items-center"
        >
          <span dir="ltr" className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Men<span className="text-turmeric">U</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
