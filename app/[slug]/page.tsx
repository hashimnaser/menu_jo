import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/data";
import { getRestaurantMapUrl } from "@/lib/google-maps";
import RestaurantReviews from "@/components/RestaurantReviews";
import RestaurantActions, { TrackedWhatsAppLink } from "@/components/RestaurantActions";
import { getLocale, localizedValue, type Locale } from "@/lib/i18n";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

async function getRestaurant(slug: string, locale: Locale = "ar"): Promise<Restaurant | null> {
  const supabase = createClient();
  const [{ data, error }, coordinatesResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select(
        "id,name,name_en,slug,description,description_en,logo,cover_image,rating,location,location_en,phone,whatsapp,cuisine,cuisine_en,created_at,categories(id,name,name_en,restaurant_id,created_at,menu_items(id,name,name_en,description,description_en,price,image,is_available,category_id,created_at))",
      )
      .eq("slug", slug)
      .maybeSingle(),
    supabase
      .from("restaurants")
      .select("latitude,longitude,google_maps_url")
      .eq("slug", slug)
      .maybeSingle(),
  ]);

  if (error) {
    throw new Error(`Could not load restaurant "${slug}" from Supabase: ${error.message}`);
  }
  if (!data) return null;

  const coordinatesUnavailable =
    coordinatesResult.error?.code === "42703" &&
    /latitude|longitude|google_maps_url/.test(coordinatesResult.error.message);
  if (coordinatesResult.error && !coordinatesUnavailable) {
    throw new Error(`Could not load restaurant coordinates "${slug}" from Supabase: ${coordinatesResult.error.message}`);
  }

  const phoneNumbers = (data.phone ?? "")
    .split(/[,;|/\n]+/)
    .map((phone) => phone.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, ""))
    .filter((phone) => /\d/.test(phone));

  return {
    id: data.id,
    slug: data.slug,
    name: localizedValue(locale, data.name, data.name_en),
    nameEn: data.name_en,
    tagline: localizedValue(locale, data.description ?? "", data.description_en),
    taglineEn: data.description_en,
    city: localizedValue(locale, data.location ?? "الأردن", data.location_en),
    cityEn: data.location_en,
    latitude: coordinatesResult.data?.latitude ?? null,
    longitude: coordinatesResult.data?.longitude ?? null,
    googleMapsUrl: coordinatesResult.data?.google_maps_url ?? null,
    cuisine: data.cuisine
      ? [localizedValue(locale, data.cuisine, data.cuisine_en)]
      : data.categories.map((category) => localizedValue(locale, category.name, category.name_en)),
    cuisineEn: data.cuisine ? [data.cuisine_en] : data.categories.map((category) => category.name_en),
    phoneNumbers,
    whatsapp: (data.whatsapp ?? phoneNumbers[0])?.replace(/\D/g, ""),
    categories: data.categories.map((category) => ({
      title: localizedValue(locale, category.name, category.name_en),
      titleEn: category.name_en,
      items: category.menu_items
        .filter((item) => item.is_available)
        .map((item) => ({
          name: localizedValue(locale, item.name, item.name_en),
          nameEn: item.name_en,
          desc: localizedValue(locale, item.description ?? "", item.description_en) || undefined,
          descEn: item.description_en,
          price: item.price,
        })),
    })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("name")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load restaurant metadata "${params.slug}" from Supabase: ${error.message}`);
  }
  if (!restaurant) return {};

  return {
    title: { absolute: `منيو مطعم ${restaurant.name} | الأسعار والتقييمات - MenuJo` },
    description: `استكشف منيو مطعم ${restaurant.name} كاملاً مع الأسعار المحدثة وتقييمات العملاء عبر منصة MenuJo.`,
  };
}

export default async function MenuPage({ params }: Props) {
  const locale = await getLocale();
  const r = await getRestaurant(params.slug, locale);
  if (!r) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    servesCuisine: r.cuisine,
    address: { "@type": "PostalAddress", addressLocality: r.city, addressCountry: "JO" },
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: r.categories.map((c) => ({
        "@type": "MenuSection",
        name: c.title,
        hasMenuItem: c.items.map((i) => ({
          "@type": "MenuItem",
          name: i.name,
          description: i.desc,
          offers: { "@type": "Offer", price: i.price, priceCurrency: "JOD" },
        })),
      })),
    },
  };
  const mapUrl = getRestaurantMapUrl(r);

  return (
    <main className="min-h-screen px-5 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-4xl">
        <section className="restaurant-header relative mt-3 overflow-hidden rounded-[2rem] px-6 py-9 text-white sm:px-10 sm:py-12">
          <span aria-hidden="true" className="absolute -left-8 -top-20 h-56 w-56 rounded-full border-[1.75rem] border-white/10" />
          <span aria-hidden="true" className="absolute bottom-[-5rem] left-[28%] h-40 w-40 rounded-full bg-white/[0.06]" />
          <div className="relative z-10">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/85">
              {r.cuisine.join(" · ")}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{r.name}</h1>
            <p className="mt-2 text-lg text-white/75">{r.tagline}</p>
            <RestaurantActions
              restaurantId={r.id}
              restaurantName={r.name}
              phoneNumbers={r.phoneNumbers ?? []}
              locale={locale}
            />
            <div className="mt-5">
              {mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/75 transition hover:text-turmeric hover:underline hover:underline-offset-4"
                  aria-label={locale === "ar" ? `عرض موقع ${r.name} على خرائط Google` : `View ${r.name} on Google Maps`}
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current">
                    <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
                  </svg>
                  {r.city}
                  <span aria-hidden="true" className="text-xs">↗</span>
                </a>
              ) : (
                <p className="inline-flex items-center gap-2 text-sm text-white/75">
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                    <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
                  </svg>
                  {r.city}
                </p>
              )}
            </div>
          </div>
          <span aria-hidden="true" className="absolute bottom-2 left-8 hidden text-8xl opacity-70 sm:block">🍽️</span>
        </section>

        <nav aria-label={locale === "ar" ? "أقسام المنيو" : "Menu sections"} className="sticky top-0 z-10 -mx-5 mt-5 flex gap-2 overflow-x-auto bg-paper/95 px-5 py-3 backdrop-blur-xl sm:-mx-0 sm:px-0">
          {r.categories.map((c, i) => (
            <a key={c.title} href={`#c${i}`} className="shrink-0 rounded-full border border-ink/10 bg-surface px-4 py-2 text-sm font-semibold text-ink/70 shadow-sm transition hover:border-turmeric/50 hover:text-ink">
              {c.title}
            </a>
          ))}
        </nav>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {r.categories.map((c, i) => (
            <section key={c.title} id={`c${i}`} className="scroll-mt-24 overflow-hidden rounded-3xl border border-ink/[0.08] bg-surface p-5 shadow-sm shadow-black/20 sm:p-6">
              <div className="mb-3 flex items-center justify-between border-b border-ink/[0.07] pb-4">
                <h2 className="text-xl font-bold">{c.title}</h2>
                <span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium text-ink/70">{locale === "ar" ? `${c.items.length} أصناف` : `${c.items.length} items`}</span>
              </div>
              <ul className="divide-y divide-ink/[0.07]">
                {c.items.map((it) => (
                  <li key={it.name} className="flex items-start justify-between gap-4 py-4 last:pb-1">
                    <div>
                      <p className="font-semibold">{it.name}</p>
                      {it.desc && <p className="mt-1 text-sm leading-6 text-ink/55">{it.desc}</p>}
                    </div>
                    <p className="shrink-0 rounded-xl bg-turmeric/15 px-3 py-1.5 text-sm font-bold tabular-nums text-turmeric">
                      {it.price.toFixed(2)} <span className="text-xs font-medium">{locale === "ar" ? "د.أ" : "JOD"}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <RestaurantReviews restaurantId={r.id} locale={locale} />

        {r.whatsapp && (
          <TrackedWhatsAppLink
            restaurantId={r.id}
            whatsapp={r.whatsapp}
            locale={locale}
          />
        )}
      </div>
    </main>
  );
}
