"use client";

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/data";
import type { Locale } from "@/lib/i18n";

export default function RestaurantMenu({
  categories,
  locale,
}: {
  categories: Category[];
  locale: Locale;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);
  const imageTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeImageButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragStart = useRef<{
    x: number;
    scrollLeft: number;
    pointerId: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    if (!selectedImage) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedImage(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    closeImageButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      imageTriggerRef.current?.focus();
    };
  }, [selectedImage]);

  if (categories.length === 0) return null;

  const activeCategory = categories[activeIndex] ?? categories[0];
  const categoryTitle = (category: Category) =>
    locale === "en" ? category.titleEn?.trim() || category.title : category.title;

  return (
    <>
      <nav
        aria-label={locale === "ar" ? "أقسام المنيو" : "Menu sections"}
        className="menu-category-scroll sticky top-16 z-20 -mx-5 mt-5 flex cursor-grab touch-pan-x gap-2 overflow-x-auto bg-paper/95 px-5 py-3 backdrop-blur-xl active:cursor-grabbing sm:-mx-0 sm:top-[4.5rem] sm:px-0"
        onPointerDown={(event) => {
          if (event.pointerType === "touch" || event.button !== 0) return;
          dragStart.current = {
            x: event.clientX,
            scrollLeft: event.currentTarget.scrollLeft,
            pointerId: event.pointerId,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const drag = dragStart.current;
          if (!drag) return;
          const delta = event.clientX - drag.x;
          if (!drag.moved && Math.abs(delta) > 4) {
            drag.moved = true;
            event.currentTarget.setPointerCapture(drag.pointerId);
          }
          if (drag.moved) event.currentTarget.scrollLeft = drag.scrollLeft - delta;
        }}
        onPointerUp={() => {
          suppressClick.current = dragStart.current?.moved ?? false;
          dragStart.current = null;
          if (suppressClick.current) {
            window.setTimeout(() => {
              suppressClick.current = false;
            }, 0);
          }
        }}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
      >
        {categories.map((category, index) => (
          <button
            key={`${category.title}-${index}`}
            type="button"
            aria-pressed={activeIndex === index}
            onClick={() => setActiveIndex(index)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeIndex === index
                ? "bg-turmeric text-paper shadow-sm"
                : "border border-ink/10 bg-surface text-ink/70 hover:border-turmeric/50 hover:text-ink"
            }`}
          >
            {categoryTitle(category)}
          </button>
        ))}
      </nav>

      <section className="mt-4 overflow-hidden rounded-3xl border border-ink/[0.08] bg-surface p-5 shadow-sm shadow-black/20 sm:p-6">
        <div className="mb-3 flex items-center justify-between border-b border-ink/[0.07] pb-4">
          <h2 className="text-xl font-bold">{categoryTitle(activeCategory)}</h2>
          <span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium text-ink/70">
            {locale === "ar" ? `${activeCategory.items.length} أصناف` : `${activeCategory.items.length} items`}
          </span>
        </div>
        <ul className="divide-y divide-ink/[0.07]">
          {activeCategory.items.map((item, index) => {
            const name = locale === "en" ? item.nameEn?.trim() || item.name : item.name;
            const description = locale === "en"
              ? item.descEn?.trim() || item.desc
              : item.desc;
            const image = item.image?.trim();

            return (
              <li key={`${item.name}-${index}`} className="flex items-start gap-3 py-4 last:pb-1">
                {image && (
                  <button
                    type="button"
                    aria-label={locale === "ar" ? `تكبير صورة ${name}` : `View larger image of ${name}`}
                    onClick={(event) => {
                      imageTriggerRef.current = event.currentTarget;
                      setSelectedImage({ src: image, alt: name });
                    }}
                    className="group relative h-16 w-16 shrink-0 touch-manipulation overflow-hidden rounded-xl border border-ink/10 bg-surface-raised sm:h-20 sm:w-20"
                  >
                    <img
                      src={image}
                      alt={name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                )}
                <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{name}</p>
                    {description && <p className="mt-1 text-sm leading-6 text-ink/55">{description}</p>}
                  </div>
                  <p className="shrink-0 rounded-xl bg-turmeric/15 px-3 py-1.5 text-sm font-bold tabular-nums text-turmeric">
                    {item.price.toFixed(2)} <span className="text-xs font-medium">{locale === "ar" ? "د.أ" : "JOD"}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {selectedImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={locale === "ar" ? "إغلاق الصورة" : "Close image"}
            onClick={() => setSelectedImage(null)}
            className="absolute inset-0 h-full w-full bg-[#020617]/90 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={locale === "ar" ? `صورة ${selectedImage.alt}` : `Image of ${selectedImage.alt}`}
            className="relative z-10 flex max-h-[90dvh] max-w-[92vw] items-center justify-center"
          >
            <button
              ref={closeImageButtonRef}
              type="button"
              aria-label={locale === "ar" ? "إغلاق الصورة" : "Close image"}
              onClick={() => setSelectedImage(null)}
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-[#020617]/70 text-white transition-colors hover:bg-[#020617]"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
                <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-h-[85dvh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
