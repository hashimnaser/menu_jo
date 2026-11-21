import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/data";
import { getRestaurantMapUrl } from "@/lib/google-maps";
import RestaurantReviews from "@/components/RestaurantReviews";
import RestaurantMenu from "@/components/RestaurantMenu";
import RestaurantActions from "@/components/RestaurantActions";
import { getLocale, localizedValue, type Locale } from "@/lib/i18n";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

const serviceLabels: Record<string, { ar: string; en: string }> = {
  dine_in: { ar: "محلي", en: "Dine-in" },
  takeaway: { ar: "تيك أوي", en: "Takeaway" },
  delivery: { ar: "توصيل", en: "Delivery" },
};

function isSafeSocialUrl(value: string | null | undefined, domain: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

async function getRestaurant(slug: string, locale: Locale = "ar"): Promise<Restaurant | null> {
  const supabase = createClient();
  const [restaurantResult, coordinatesResult, enhancementsResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select(
        "id,name,name_ar,name_en,slug,description,description_en,logo,logo_url,cover_image,cover_url,rating,location,location_en,phone,whatsapp,cuisine,cuisine_en,price_level,created_at,categories(id,name,name_en,sort_order,restaurant_id,created_at,items(id,name_ar,name_en,description_ar,description_en,price,image_url,meal_type,is_available,category_id,created_at)),branches(id,branch_name_ar,branch_name_en,address_ar,address_en,latitude,longitude,google_maps_url,phone,whatsapp,working_hours,is_open,area_id,areas(id,name_ar,name_en,slug,city_id,cities(id,name_ar,name_en,slug)))",
      )
      .eq("slug", slug)
      .maybeSingle(),
    supabase
      .from("restaurants")
      .select("latitude,longitude,google_maps_url")
      .eq("slug", slug)
      .maybeSingle(),
    supabase
      .from("restaurants")
      .select("service_types,instagram_url,facebook_url,tiktok_url")
      .eq("slug", slug)
      .maybeSingle(),
  ]);

  const { data, error } = restaurantResult;
  if (error) {
    throw new Error(`Could not load restaurant "${slug}" from Supabase: ${error.message}`);
  }
  if (!data) return null;

  if (enhancementsResult.error) {
    throw new Error(`Could not load restaurant enhancements "${slug}" from Supabase: ${enhancementsResult.error.message}`);
  }

  const coordinatesUnavailable =
    coordinatesResult.error?.code === "42703" &&
    /latitude|longitude|google_maps_url/.test(coordinatesResult.error.message);
  if (coordinatesResult.error && !coordinatesUnavailable) {
    throw new Error(`Could not load restaurant coordinates "${slug}" from Supabase: ${coordinatesResult.error.message}`);
  }

  const branchRows = Array.isArray(data.branches)
    ? data.branches
    : data.branches
      ? [data.branches]
      : [];
  const primaryBranch = branchRows[0];
  const area = primaryBranch?.areas;
  const city = area?.cities;
  const phoneSource = primaryBranch?.phone ?? data.phone ?? "";
  const phoneNumbers = phoneSource
    .split(/[,;|/\n]+/)
    .map((phone: string) => phone.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, ""))
    .filter((phone: string) => /\d/.test(phone));

  return {
    id: data.id,
    slug: data.slug,
    name: localizedValue(locale, data.name, data.name_en),
    nameEn: data.name_en,
    logo: data.logo_url ?? data.logo,
    coverImage: data.cover_url ?? data.cover_image,
    tagline: localizedValue(locale, data.description ?? "", data.description_en),
    taglineEn: data.description_en,
    city: area
      ? `${localizedValue(locale, city?.name_ar ?? "الأردن", city?.name_en)} - ${localizedValue(locale, area.name_ar, area.name_en)}`
      : localizedValue(locale, data.location ?? "الأردن", data.location_en),
    cityEn: city?.name_en ?? data.location_en,
    area: area?.name_ar ?? null,
    areaEn: area?.name_en ?? null,
    latitude: primaryBranch?.latitude ?? coordinatesResult.data?.latitude ?? null,
    longitude: primaryBranch?.longitude ?? coordinatesResult.data?.longitude ?? null,
    googleMapsUrl: primaryBranch?.google_maps_url ?? coordinatesResult.data?.google_maps_url ?? null,
    branches: branchRows.map((branch) => ({
      id: branch.id,
      name: localizedValue(locale, branch.branch_name_ar, branch.branch_name_en),
      nameEn: branch.branch_name_en,
      address: localizedValue(locale, branch.address_ar ?? "", branch.address_en),
      addressEn: branch.address_en,
      area: branch.areas?.name_ar ?? "",
      areaEn: branch.areas?.name_en,
      city: branch.areas?.cities?.name_ar ?? "",
      cityEn: branch.areas?.cities?.name_en,
      latitude: branch.latitude,
      longitude: branch.longitude,
      googleMapsUrl: branch.google_maps_url,
      phone: branch.phone,
      whatsapp: branch.whatsapp,
      workingHours: branch.working_hours,
      isOpen: branch.is_open,
    })),
    cuisine: data.cuisine
      ? [localizedValue(locale, data.cuisine, data.cuisine_en)]
      : data.categories.map((category) => localizedValue(locale, category.name, category.name_en)),
    cuisineEn: data.cuisine ? [data.cuisine_en] : data.categories.map((category) => category.name_en),
    phoneNumbers,
    whatsapp: (primaryBranch?.whatsapp ?? data.whatsapp ?? phoneNumbers[0])?.replace(/\D/g, ""),
    priceLevel: data.price_level,
    serviceTypes: enhancementsResult.data?.service_types ?? [],
    instagramUrl: enhancementsResult.data?.instagram_url ?? null,
    facebookUrl: enhancementsResult.data?.facebook_url ?? null,
    tiktokUrl: enhancementsResult.data?.tiktok_url ?? null,
    categories: data.categories.map((category) => ({
      title: localizedValue(locale, category.name, category.name_en),
      titleEn: category.name_en,
      items: (Array.isArray(category.items) ? category.items : category.items ? [category.items] : [])
        .filter((item) => item.is_available)
        .map((item) => ({
          name: localizedValue(locale, item.name_ar, item.name_en),
          nameEn: item.name_en,
          desc: localizedValue(locale, item.description_ar ?? "", item.description_en) || undefined,
          descEn: item.description_en,
          image: item.image_url,
          price: item.price,
          mealType: item.meal_type,
        })),
    })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("name,name_ar,name_en,location,location_en")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load restaurant metadata "${params.slug}" from Supabase: ${error.message}`);
  }
  if (!restaurant) return {};

  const name = restaurant.name_ar ?? restaurant.name;
  const location = restaurant.location ?? restaurant.location_en;
  const locationText = location ? ` - ${location}` : "";
  return {
    title: { absolute: `منيو وأسعار ${name}${locationText} | MenuJo` },
    description: `تصفح منيو وأسعار ${name}${locationText}، وتعرّف على الأطباق وطرق التواصل وموقع المطعم عبر MenuJo.`,
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
    telephone: r.phoneNumbers?.[0],
    priceRange: "$".repeat(Math.max(1, Math.min(3, r.priceLevel ?? 1))),
    address: {
      "@type": "PostalAddress",
      addressLocality: r.area ?? r.city,
      addressRegion: r.city.split(" - ")[0],
      addressCountry: "JO",
    },
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
  const priceRange = "$".repeat(Math.max(1, Math.min(3, r.priceLevel ?? 1)));
  const socialLinks = [
    { href: r.instagramUrl, domain: "instagram.com", label: "Instagram", icon: "ig" },
    { href: r.facebookUrl, domain: "facebook.com", label: "Facebook", icon: "f" },
    { href: r.tiktokUrl, domain: "tiktok.com", label: "TikTok", icon: "♪" },
  ].filter((social): social is typeof social & { href: string } =>
    isSafeSocialUrl(social.href, social.domain),
  );

  return (
    <main className="min-h-screen px-5 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-4xl">
        <section className="mt-3 overflow-hidden rounded-[2rem] border border-white/10 bg-surface shadow-xl shadow-black/20">
          <div className="restaurant-art relative flex min-h-40 items-center justify-center overflow-hidden bg-slate-950/70 sm:min-h-56">
            {r.coverImage ? (
              <img src={r.coverImage} alt="" className="relative z-10 max-h-64 w-full object-contain sm:max-h-80" />
            ) : (
              <span aria-hidden="true" className="py-12 text-6xl opacity-70">🍽️</span>
            )}
          </div>
          <div className="p-4 sm:p-6">
            <RestaurantActions
              restaurantId={r.id}
              restaurantName={r.name}
              phoneNumbers={r.phoneNumbers ?? []}
              whatsapp={r.whatsapp}
              locale={locale}
            />
            <div className="mt-5 flex flex-wrap items-center gap-4">
              {r.logo && <img src={r.logo} alt={`شعار ${r.name}`} className="h-16 w-16 rounded-2xl border border-white/10 bg-slate-900/70 object-contain p-2 sm:h-20 sm:w-20" />}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{r.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {r.cuisine.length > 0 && (
                    <span className="inline-flex max-w-full rounded-full border border-white/10 bg-slate-900/40 px-3 py-1.5 text-sm text-white/75">
                      {r.cuisine.join(" · ")}
                    </span>
                  )}
                  <span className="inline-flex rounded-full border border-turmeric/25 bg-turmeric/10 px-3 py-1.5 text-sm font-bold tracking-widest text-turmeric" aria-label={locale === "ar" ? `مستوى السعر ${priceRange}` : `Price level ${priceRange}`}>
                    {priceRange}
                  </span>
                </div>
              </div>
            </div>
            {r.tagline && (
              <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                {r.tagline}
              </p>
            )}
            <div className="mt-4">
              {mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-turmeric hover:underline hover:underline-offset-4"
                  aria-label={locale === "ar" ? `عرض موقع ${r.name} على خرائط Google` : `View ${r.name} on Google Maps`}
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current">
                    <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
                  </svg>
                  {r.city}
                  <span aria-hidden="true" className="text-xs">↗</span>
                </a>
              ) : (
                <p className="inline-flex items-center gap-2 text-sm text-white/70">
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                    <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
                  </svg>
                  {r.city}
                </p>
              )}
            </div>
            {r.serviceTypes && r.serviceTypes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2" aria-label={locale === "ar" ? "أنواع الخدمة" : "Service options"}>
                {r.serviceTypes.map((service) => {
                  const label = serviceLabels[service];
                  if (!label) return null;
                  return (
                    <span key={service} className="rounded-full border border-white/10 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-white/75">
                      {locale === "ar" ? label.ar : label.en}
                    </span>
                  );
                })}
              </div>
            )}
            {socialLinks.length > 0 && (
              <nav className="mt-4 flex items-center gap-2" aria-label={locale === "ar" ? "حسابات التواصل الاجتماعي" : "Social media"}>
                {socialLinks.map((social) => (
                  <a
                    key={social.domain}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-slate-900/50 text-sm font-bold text-white/75 transition hover:border-turmeric/50 hover:text-turmeric"
                  >
                    {social.icon}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </section>

        <RestaurantMenu categories={r.categories} locale={locale} />

        <RestaurantReviews restaurantId={r.id} locale={locale} />
      </div>
    </main>
  );
}
