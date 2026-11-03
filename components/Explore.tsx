"use client";
import { useMemo, useState } from "react";
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
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [locationRequested, setLocationRequested] = useState(false);

  const cuisines = useMemo(() => Array.from(new Set(restaurants.flatMap((r) => r.cuisine))), [restaurants]);

  const searchableRestaurants = useMemo(
    () =>
      restaurants.map((restaurant) => ({
        restaurant,
        searchText: norm([
          restaurant.name,
          restaurant.tagline,
          restaurant.city,
          ...restaurant.cuisine,
          ...restaurant.categories.flatMap((category) => category.items.map((item) => item.name)),
        ].join(" ")),
      })),
    [restaurants],
  );

  const list = useMemo(() => {
    const n = norm(q);
    const filtered = searchableRestaurants.filter(({ restaurant, searchText }) =>
      (!cuisine || restaurant.cuisine.includes(cuisine)) && (!n || searchText.includes(n)),
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
  }, [q, cuisine, searchableRestaurants, userLocation]);
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
          placeholder={locale === "ar" ? "شو نفسك تاكل؟ ابحث عن مطعم أو وجبة" : "What are you craving? Search restaurants or dishes"}
          aria-label={locale === "ar" ? "ابحث عن مطعم أو وجبة" : "Search restaurants or dishes"}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink outline-none placeholder:text-ink/40 sm:text-lg"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="rounded-xl px-3 py-2 text-sm font-medium text-ink/55 hover:bg-surface-raised" aria-label={locale === "ar" ? "مسح البحث" : "Clear search"}>
            {locale === "ar" ? "مسح" : "Clear"}
          </button>
        )}
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-2" aria-label={locale === "ar" ? "تصفية حسب نوع المطبخ" : "Filter by cuisine"}>
        <span className="me-1 text-sm font-medium text-ink/55">{locale === "ar" ? "تصفّح حسب:" : "Browse by:"}</span>
        {[null, ...cuisines].map((c) => (
          <button
            key={c ?? "all"}
            onClick={() => setCuisine(c)}
            aria-pressed={cuisine === c}
            className={`touch-manipulation rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-100 active:scale-95 ${
              cuisine === c ? "bg-turmeric text-paper shadow-md shadow-black/20" : "bg-surface text-ink/70 ring-1 ring-ink/10 hover:-translate-y-0.5 hover:ring-turmeric/40"
            }`}
          >
            {c ?? (locale === "ar" ? "الكل" : "All")}
          </button>
        ))}
      </div>

      <div id="nearby" className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3 scroll-mt-8">
        <div>
          <h3 className="font-bold">{userLocation ? (locale === "ar" ? "المطاعم الأقرب إليك" : "Nearest to you") : q || cuisine ? (locale === "ar" ? "نتائج البحث" : "Search results") : (locale === "ar" ? "أماكن تستاهل التجربة" : "Worth a visit")}</h3>
          <span className="mt-1 block text-sm text-ink/50" aria-live="polite">
            {userLocation ? (locale === "ar" ? "مرتبة من الأقرب إلى الأبعد" : "Sorted nearest to farthest") : locale === "ar" ? `${list.length} نتيجة` : `${list.length} results`}
          </span>
        </div>
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
                  className="restaurant-card group block touch-manipulation h-full overflow-hidden rounded-3xl border border-ink/[0.08] bg-surface shadow-sm shadow-black/20 transition duration-150 active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/35"
                >
                  <span className="restaurant-art relative flex h-40 items-center justify-center overflow-hidden">
                    <span aria-hidden="true" className="absolute -left-10 -top-20 h-48 w-48 rounded-full border-[1.5rem] border-white/[0.06]" />
                    <span aria-hidden="true" className="absolute -bottom-20 -right-8 h-44 w-44 rounded-full bg-turmeric/[0.08]" />
                    <span className="relative z-[1] px-5 text-center text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl">
                      {r.name}
                    </span>
                    <span className="absolute end-4 top-4 rounded-full bg-paper/85 px-3 py-1 text-xs font-bold text-ink/90 backdrop-blur">
                      {r.cuisine[0]}
                    </span>
                    <span
                      className="absolute bottom-3 end-4 inline-flex items-center gap-1.5 rounded-full border border-turmeric/35 bg-paper/90 px-3.5 py-2 text-xs font-bold text-ink shadow-lg shadow-black/20 backdrop-blur-md"
                      aria-label={locale === "ar" ? `التقييم ${r.reviewCount ? r.averageRating?.toFixed(1) : "لا يوجد"} من 5، ${r.reviewCount ?? 0} تقييم` : `Rating ${r.reviewCount ? r.averageRating?.toFixed(1) : "none"} out of 5, ${r.reviewCount ?? 0} reviews`}
                    >
                      <span aria-hidden="true" className="text-turmeric">★</span>
                      <span className="tabular-nums">
                        {r.reviewCount ? r.averageRating?.toFixed(1) : "—"}
                      </span>
                      <span className="font-medium text-ink/60">({r.reviewCount ?? 0})</span>
                    </span>
                    {r.slug === nearestRestaurantSlug && (
                      <span className="absolute start-4 top-4 rounded-full bg-turmeric px-3 py-1 text-xs font-bold text-paper shadow-md">
                        {locale === "ar" ? "الأقرب إليك" : "Nearest"}
                      </span>
                    )}
                  </span>
                  <span className="block p-5">
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="mt-1 block text-sm text-ink/55">{r.tagline}</span>
                      </span>
                      <span aria-hidden="true" className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-raised text-ink/60 transition group-hover:bg-turmeric group-hover:text-paper">{locale === "ar" ? "←" : "→"}</span>
                    </span>
                    <span className="mt-5 flex items-center justify-between gap-3 border-t border-ink/[0.07] pt-4 text-sm text-ink/55">
                      <span className="flex items-center gap-1.5">
                        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current text-sumac">
                          <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
                        </svg>
                        {r.city}
                      </span>
                      <span className="text-start text-xs text-ink/45">{locale === "ar" ? `${itemCount} أصناف` : `${itemCount} items`}</span>
                    </span>
                    {userLocation && (
                      <span className="mt-3 flex items-center justify-between rounded-xl bg-surface-raised px-3 py-2.5 text-sm">
                        <span className="flex items-center gap-2 font-medium text-ink/65">
                          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current text-turmeric">
                            <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
                          </svg>
                          {locale === "ar" ? "المسافة من موقعك" : "Distance from you"}
                        </span>
                        <span className="font-bold tabular-nums text-ink">
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
          <p className="mt-1 text-sm text-ink/55">{locale === "ar" ? "جرّب كلمة ثانية أو غيّر نوع المطبخ." : "Try another search or choose a different cuisine."}</p>
        </div>
      )}

      <div className="mt-10">
        <div className="mb-4">
          <h3 className="font-bold">{locale === "ar" ? "المطاعم على الخريطة" : "Restaurants on the map"}</h3>
          <p className="mt-1 text-sm text-ink/50">{locale === "ar" ? "مواقع المطاعم في إربد" : "Restaurant locations in Irbid"}</p>
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
