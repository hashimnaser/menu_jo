"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Restaurant } from "@/lib/data";
import { calculateDistance } from "@/lib/distance";
import { norm } from "@/lib/search";
import type { Locale } from "@/lib/i18n";

const RestaurantMap = dynamic(() => import("@/components/RestaurantMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] animate-pulse rounded-3xl bg-surface sm:h-[460px]" />
  ),
});

const browseCategories = [
  {
    id: "fast-food",
    ar: "وجبات سريعة",
    en: "Fast food",
    keywords: ["شاورما", "سندويش", "ساندويش", "برغر", "برجر", "بروستد", "زنجر", "shawarma", "sandwich", "burger", "broasted", "zinger"],
  },
  {
    id: "grills-arabic",
    ar: "مشاوي وأكلات عربية",
    en: "Grills & Arabic",
    keywords: ["مشاوي", "مشوي", "كباب", "شيش", "منسف", "مقلوبة", "كبسة", "مندي", "مظبي", "grill", "kebab", "mansaf", "maqluba", "kabsa", "mandi"],
  },
  {
    id: "pizza-pastries",
    ar: "بيتزا ومعجنات",
    en: "Pizza & pastries",
    keywords: ["بيتزا", "معجنات", "فطائر", "مناقيش", "pizza", "pastries", "pies", "manakish"],
  },
  {
    id: "main-dishes",
    ar: "أطباق رئيسية",
    en: "Main dishes",
    keywords: ["طبق رئيسي", "وجبات", "وجبة", "دجاج", "لحوم", "سمك", "مأكولات بحرية", "باستا", "أرز", "main dish", "meals", "chicken", "meat", "fish", "seafood", "pasta", "rice"],
  },
  {
    id: "starters-salads",
    ar: "مقبلات وسلطات",
    en: "Starters & salads",
    keywords: ["مقبلات", "سلطة", "سلطات", "حمص", "متبل", "بطاطا", "appetizer", "starter", "salad", "hummus", "fries"],
  },
  {
    id: "sweets-drinks",
    ar: "حلويات ومشروبات",
    en: "Sweets & drinks",
    keywords: ["حلويات", "حلو", "كنافة", "كيك", "مشروبات", "عصير", "قهوة", "شاي", "dessert", "sweets", "kunafa", "cake", "drinks", "juice", "coffee", "tea"],
  },
] as const;

export default function Explore({
  restaurants,
  coordinatesAvailable,
  locale,
}: {
  restaurants: Restaurant[];
  coordinatesAvailable: boolean;
  locale: Locale;
}) {
  const [q, setQ] = useState("");
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);
  const browseDragStart = useRef<{ x: number; scrollLeft: number; pointerId: number; moved: boolean } | null>(null);
  const suppressBrowseClick = useRef(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [locationRequested, setLocationRequested] = useState(false);

  useEffect(() => {
    const storageKey = "menujo-home-scroll";
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const restoreHomeScroll = () => {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (!saved) return;
        const { scrollY, cardTop, cardViewportTop } = JSON.parse(saved) as {
          scrollY?: number;
          cardTop?: number;
          cardViewportTop?: number;
        };
        if (typeof scrollY !== "number") return;

        const target =
          typeof cardTop === "number" && typeof cardViewportTop === "number"
            ? cardTop - cardViewportTop
            : scrollY;

        const restore = () => window.scrollTo({ top: target, behavior: "auto" });
        window.requestAnimationFrame(restore);
        const restoreTimer = window.setInterval(restore, 100);
        window.setTimeout(() => {
          window.clearInterval(restoreTimer);
          sessionStorage.removeItem(storageKey);
        }, 2500);
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    };

    restoreHomeScroll();
    window.addEventListener("popstate", restoreHomeScroll);
    window.addEventListener("menujo:restore-home-scroll", restoreHomeScroll);
    return () => {
      window.removeEventListener("popstate", restoreHomeScroll);
      window.removeEventListener("menujo:restore-home-scroll", restoreHomeScroll);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  const searchableRestaurants = useMemo(
    () =>
      restaurants.map((restaurant) => ({
        restaurant,
        searchText: norm([
          restaurant.name,
          restaurant.nameEn,
          restaurant.tagline,
          restaurant.taglineEn,
          restaurant.city,
          ...restaurant.cuisine,
          ...(restaurant.cuisineEn ?? []),
          ...restaurant.categories.flatMap((category) => [
            category.title,
            category.titleEn,
            ...category.items.flatMap((item) => [item.name, item.nameEn, item.desc, item.descEn]),
          ]),
        ].join(" ")),
      })),
    [restaurants],
  );

  const list = useMemo(() => {
    const n = norm(q);
    const filtered = searchableRestaurants.filter(({ restaurant, searchText }) =>
      (!browseCategory || matchesBrowseCategory(browseCategory, searchText)) && (!n || searchText.includes(n)),
    );

    const withDistances = filtered.map(({ restaurant }) => ({
      restaurant,
      distance: userLocation ? getDistance(userLocation, restaurant) : null,
    }));

    if (userLocation) {
      withDistances.sort((a, b) => {
        if (a.distance === null) return b.distance === null ? 0 : 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return withDistances;
  }, [q, browseCategory, searchableRestaurants, userLocation]);
  const nearestRestaurantSlug = userLocation
    ? list.find(({ distance }) => distance !== null)?.restaurant.slug
    : undefined;

  const requestLocation = () => {
    setLocationRequested(true);
    if (!navigator.geolocation) {
      setUserLocation(null);
      setLocationStatus("error");
      setLocationMessage(locale === "ar" ? "متصفحك لا يدعم تحديد الموقع. يمكنك تصفّح المطاعم بالترتيب المعتاد." : "Your browser does not support location access. You can still browse restaurants.");
      return;
    }

    setLocationStatus("loading");
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationStatus("idle");
      },
      (error) => {
        setUserLocation(null);
        setLocationStatus("error");
        setLocationMessage(
          locale === "ar"
            ? error.code === error.PERMISSION_DENIED
              ? "لا مشكلة! سنعرض المطاعم بالترتيب المعتاد. يمكنك السماح بتحديد الموقع متى رغبت."
              : error.code === error.TIMEOUT
                ? "تأخر تحديد موقعك. سنعرض المطاعم بالترتيب المعتاد، ويمكنك المحاولة مرة ثانية."
                : "تعذر تحديد موقعك حالياً. سنعرض المطاعم بالترتيب المعتاد، ويمكنك المحاولة مرة ثانية."
            : error.code === error.PERMISSION_DENIED
              ? "No problem. Restaurants will stay in their usual order. You can allow location access anytime."
              : error.code === error.TIMEOUT
                ? "Location lookup timed out. Restaurants will stay in their usual order; please try again."
                : "Could not determine your location. Restaurants will stay in their usual order; please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <section>
      <label className="search-box flex items-center gap-3 rounded-2xl border border-ink/10 bg-surface p-2.5 shadow-lg shadow-black/20 transition focus-within:border-turmeric/50 focus-within:shadow-xl focus-within:shadow-black/30">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-raised text-ink/60">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.2 4.2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder={locale === "ar" ? "ابحث عن مطعم" : "Search for a restaurant"}
          aria-label={locale === "ar" ? "ابحث عن مطعم أو وجبة" : "Search restaurants or dishes"}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink outline-none placeholder:text-ink/40 sm:text-lg"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="rounded-xl px-3 py-2 text-sm font-medium text-ink/55 hover:bg-surface-raised" aria-label={locale === "ar" ? "مسح البحث" : "Clear search"}>
            {locale === "ar" ? "مسح" : "Clear"}
          </button>
        )}
      </label>

      <div className="mt-5 flex min-w-0 items-center gap-3">
        <p className="shrink-0 text-sm font-medium text-ink/55">{locale === "ar" ? "تصفّح حسب:" : "Browse by:"}</p>
        <div
          role="group"
          aria-label={locale === "ar" ? "تصفية حسب فئة الطعام" : "Filter by food category"}
          tabIndex={0}
          className="browse-category-scroll min-w-0 flex-1 touch-pan-x flex gap-2 overflow-x-auto overscroll-x-contain py-1"
          onPointerDown={(event) => {
            if (event.pointerType === "touch" || event.button !== 0) return;
            browseDragStart.current = {
              x: event.clientX,
              scrollLeft: event.currentTarget.scrollLeft,
              pointerId: event.pointerId,
              moved: false,
            };
          }}
          onPointerMove={(event) => {
            const drag = browseDragStart.current;
            if (!drag) return;
            const delta = event.clientX - drag.x;
            if (!drag.moved && Math.abs(delta) > 4) {
              drag.moved = true;
              event.currentTarget.setPointerCapture(drag.pointerId);
            }
            if (drag.moved) event.currentTarget.scrollLeft = drag.scrollLeft - delta;
          }}
          onPointerUp={() => {
            suppressBrowseClick.current = browseDragStart.current?.moved ?? false;
            browseDragStart.current = null;
            if (suppressBrowseClick.current) {
              window.setTimeout(() => {
                suppressBrowseClick.current = false;
              }, 0);
            }
          }}
          onPointerCancel={() => {
            browseDragStart.current = null;
          }}
          onClickCapture={(event) => {
            if (!suppressBrowseClick.current) return;
            event.preventDefault();
            event.stopPropagation();
            suppressBrowseClick.current = false;
          }}
        >
          {[null, ...browseCategories.map((category) => category.id)].map((categoryId) => (
            <button
              key={categoryId ?? "all"}
              onClick={() => setBrowseCategory(categoryId)}
              aria-pressed={browseCategory === categoryId}
              className={`shrink-0 touch-manipulation rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-100 active:scale-95 ${
                browseCategory === categoryId ? "bg-turmeric text-paper shadow-md shadow-black/20" : "bg-surface text-ink/70 ring-1 ring-ink/10 hover:-translate-y-0.5 hover:ring-turmeric/40"
              }`}
            >
              {categoryId === null
                ? locale === "ar" ? "الكل" : "All"
                : browseCategories.find((category) => category.id === categoryId)?.[locale === "ar" ? "ar" : "en"]}
            </button>
          ))}
        </div>
      </div>

      <div id="nearby" className="mb-4 mt-6 flex items-center justify-between gap-3 scroll-mt-8">
        <span className="text-sm text-ink/55" aria-live="polite">
          {locale === "ar" ? `${list.length} ${list.length === 1 ? "مطعم" : "مطاعم"}` : `${list.length} ${list.length === 1 ? "restaurant" : "restaurants"}`}
        </span>
        <button
          type="button"
          onClick={requestLocation}
          disabled={locationStatus === "loading"}
          className="inline-flex touch-manipulation items-center gap-2 rounded-full bg-turmeric px-4 py-2.5 text-sm font-bold text-paper transition-colors duration-100 active:scale-95 hover:bg-sumac disabled:cursor-wait disabled:opacity-60"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
          </svg>
          {locationStatus === "loading" ? (locale === "ar" ? "جاري تحديد موقعك..." : "Finding your location...") : userLocation ? (locale === "ar" ? "تحديث موقعي" : "Update my location") : (locale === "ar" ? "اعرض الأقرب إليّ" : "Show nearest")}
        </button>
      </div>
      {locationMessage && (
        <p role="alert" className="mb-4 rounded-2xl border border-sumac/30 bg-sumac/10 px-4 py-3 text-sm text-ink/80">
          {locationMessage}
        </p>
      )}
      {locationRequested && !coordinatesAvailable && (
        <p role="status" className="mb-4 rounded-2xl border border-turmeric/20 bg-turmeric/10 px-4 py-3 text-sm text-ink/75">
          {locale === "ar" ? <>لتفعيل المسافات، شغّل <span dir="ltr">supabase/schema.sql</span> في Supabase ثم أضف إحداثيات كل مطعم.</> : <>To enable distances, run <span dir="ltr">supabase/schema.sql</span> in Supabase and add each restaurant&apos;s coordinates.</>}
        </p>
      )}
      {coordinatesAvailable && userLocation && list.length > 0 && list.every(({ distance }) => distance === null) && (
        <p role="status" className="mb-4 rounded-2xl border border-turmeric/20 bg-turmeric/10 px-4 py-3 text-sm text-ink/75">
          {locale === "ar" ? "تم تحديد موقعك، لكن مواقع المطاعم غير محددة بعد. أضف إحداثيات المطاعم لعرض المسافات وترتيبها." : "Your location was found, but restaurant locations are missing. Add coordinates to show distances and sort by proximity."}
        </p>
      )}

      {list.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(({ restaurant: r, distance }) => {
            const itemCount = r.categories.reduce((total, category) => total + category.items.length, 0);

            return (
              <li key={r.slug} className="flex flex-col">
                <Link
                  href={`/${encodeURIComponent(r.slug)}`}
                  onClick={(event) => {
                    try {
                      window.history.scrollRestoration = "manual";
                      const cardRect = event.currentTarget.getBoundingClientRect();
                      sessionStorage.setItem(
                        "menujo-home-scroll",
                        JSON.stringify({
                          scrollY: window.scrollY,
                          cardTop: cardRect.top + window.scrollY,
                          cardViewportTop: cardRect.top,
                          href: `/${encodeURIComponent(r.slug)}`,
                        }),
                      );
                    } catch {
                      // Storage can be unavailable in restricted browser contexts.
                    }
                  }}
                  className="restaurant-card group flex h-full touch-manipulation flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-sm shadow-black/20 transition duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:border-turmeric/30 hover:shadow-xl hover:shadow-black/30"
                >
                  <span className="restaurant-art relative block h-32 shrink-0 overflow-hidden">
                    {r.coverImage && <img src={r.coverImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                  </span>
                  <span className="flex flex-1 flex-col p-4 sm:p-5">
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-3">
                        {r.logo && <img src={r.logo} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-slate-800 object-cover" />}
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-white">{r.name}</span>
                          <span
                            className="mt-1 inline-flex items-center gap-1 text-xs text-slate-300"
                            aria-label={locale === "ar" ? `التقييم ${r.reviewCount ? r.averageRating?.toFixed(1) : "لا يوجد"} من 5، ${r.reviewCount ?? 0} تقييم` : `Rating ${r.reviewCount ? r.averageRating?.toFixed(1) : "none"} out of 5, ${r.reviewCount ?? 0} reviews`}
                          >
                            <span aria-hidden="true" className="text-turmeric">★</span>
                            <span className="tabular-nums">{r.reviewCount ? r.averageRating?.toFixed(1) : "—"}</span>
                            <span className="text-slate-400">({r.reviewCount ?? 0})</span>
                          </span>
                        </span>
                      </span>
                      <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-slate-300 transition group-hover:bg-turmeric group-hover:text-slate-950">{locale === "ar" ? "←" : "→"}</span>
                    </span>
                    <span className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-slate-300">{r.tagline}</span>
                    <span className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-3 text-sm text-slate-400">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current text-sumac">
                          <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
                        </svg>
                        <span className="truncate">{r.city}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs">{locale === "ar" ? `${itemCount} أصناف` : `${itemCount} items`}</span>
                    </span>
                    {userLocation && (
                      <span className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white/[0.05] px-3 py-2.5 text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-300">
                          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current text-turmeric">
                            <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
                          </svg>
                          {locale === "ar" ? "المسافة من موقعك" : "Distance from you"}
                        </span>
                        <span className="shrink-0 font-bold tabular-nums text-white">
                          {distance !== null ? (locale === "ar" ? `${formatDistance(distance, locale)} منك` : `${formatDistance(distance, locale)} away`) : (locale === "ar" ? "الموقع غير محدد" : "Location unavailable")}
                        </span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-ink/15 bg-surface/70 px-6 py-14 text-center">
          <span aria-hidden="true" className="text-4xl">🔎</span>
          <p className="mt-3 font-bold">{locale === "ar" ? "ما لقينا نتائج" : "No results found"}</p>
          <p className="mt-1 text-sm text-ink/55">{locale === "ar" ? "جرّب كلمة ثانية أو اختر فئة طعام مختلفة." : "Try another search or choose a different food category."}</p>
        </div>
      )}

      <div className="mt-10">
        <div className="mb-4">
          <h3 className="font-bold">{locale === "ar" ? "المطاعم على الخريطة" : "Restaurants on the map"}</h3>
        </div>
        <div className="overflow-hidden rounded-3xl border border-ink/10 shadow-lg shadow-black/20">
          <RestaurantMap restaurants={list.map(({ restaurant }) => restaurant)} locale={locale} />
        </div>
        {list.length > 0 && list.every(({ restaurant }) =>
          typeof restaurant.latitude !== "number" ||
          !Number.isFinite(restaurant.latitude) ||
          Math.abs(restaurant.latitude) > 90 ||
          typeof restaurant.longitude !== "number" ||
          !Number.isFinite(restaurant.longitude) ||
          Math.abs(restaurant.longitude) > 180
        ) && (
          <p className="mt-3 text-sm text-ink/50">
            {locale === "ar" ? "أضف إحداثيات المطاعم لعرض مواقعها على الخريطة." : "Add restaurant coordinates to show their locations on the map."}
          </p>
        )}
      </div>
    </section>
  );
}

function matchesBrowseCategory(categoryId: string, searchText: string): boolean {
  const category = browseCategories.find((candidate) => candidate.id === categoryId);
  return category
    ? category.keywords.some((keyword) => searchText.includes(norm(keyword)))
    : true;
}

function getDistance(
  origin: { latitude: number; longitude: number },
  restaurant: Restaurant,
): number | null {
  const { latitude, longitude } = restaurant;
  if (latitude == null || longitude == null) return null;
  return calculateDistance(origin, { latitude, longitude });
}

function formatDistance(distance: number, locale: Locale): string {
  if (distance < 1) return locale === "ar" ? `${Math.round(distance * 1000)} م` : `${Math.round(distance * 1000)} m`;
  return locale === "ar" ? `${distance.toFixed(1)} كم` : `${distance.toFixed(1)} km`;
}
