import Explore from "@/components/Explore";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/data";
import { getLocale, localizedValue } from "@/lib/i18n";

export const revalidate = 0;

export default async function Home() {
  const locale = await getLocale();
  const supabase = createClient();
  const [restaurantResult, coordinatesResult, reviewsResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select(
        "id,name,name_en,slug,description,description_en,logo,cover_image,rating,location,location_en,phone,whatsapp,cuisine,cuisine_en,created_at,categories(id,name,name_en,restaurant_id,created_at,menu_items(id,name,name_en,description,description_en,price,image,is_available,category_id,created_at))",
      )
      .order("name"),
    supabase.from("restaurants").select("slug,latitude,longitude,google_maps_url"),
    supabase.from("reviews").select("restaurant_id,rating"),
  ]);

  if (restaurantResult.error) {
    throw new Error(`Could not load restaurants from Supabase: ${restaurantResult.error.message}`);
  }

  const coordinatesUnavailable =
    coordinatesResult.error?.code === "42703" &&
    /latitude|longitude|google_maps_url/.test(coordinatesResult.error.message);
  if (coordinatesResult.error && !coordinatesUnavailable) {
    throw new Error(`Could not load restaurant coordinates from Supabase: ${coordinatesResult.error.message}`);
  }
  if (reviewsResult.error) {
    throw new Error(`Could not load restaurant reviews from Supabase: ${reviewsResult.error.message}`);
  }
  const coordinatesBySlug = new Map(
    (coordinatesResult.data ?? []).map((restaurant) => [restaurant.slug, restaurant]),
  );
  const reviewStats = new Map<string, { total: number; count: number }>();
  for (const review of reviewsResult.data) {
    const stats = reviewStats.get(review.restaurant_id) ?? { total: 0, count: 0 };
    stats.total += review.rating;
    stats.count += 1;
    reviewStats.set(review.restaurant_id, stats);
  }

  const restaurants: Restaurant[] = (restaurantResult.data ?? []).map((restaurant) => {
    const coordinates = coordinatesBySlug.get(restaurant.slug);
    const review = reviewStats.get(restaurant.id);
    return {
      id: restaurant.id,
      slug: restaurant.slug,
      name: localizedValue(locale, restaurant.name, restaurant.name_en),
      nameEn: restaurant.name_en,
      tagline: localizedValue(locale, restaurant.description ?? restaurant.location ?? "", restaurant.description_en ?? restaurant.location_en),
      taglineEn: restaurant.description_en,
      city: localizedValue(locale, restaurant.location ?? "الأردن", restaurant.location_en),
      cityEn: restaurant.location_en,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      googleMapsUrl: coordinates?.google_maps_url ?? null,
      averageRating: review ? review.total / review.count : 0,
      reviewCount: review?.count ?? 0,
      cuisine: restaurant.cuisine
        ? [localizedValue(locale, restaurant.cuisine, restaurant.cuisine_en)]
        : restaurant.categories.map((category) => localizedValue(locale, category.name, category.name_en)),
      cuisineEn: restaurant.cuisine ? [restaurant.cuisine_en] : restaurant.categories.map((category) => category.name_en),
      whatsapp: (restaurant.whatsapp ?? restaurant.phone)?.replace(/\D/g, ""),
      categories: restaurant.categories.map((category) => ({
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
  });

  return (
    <main className="min-h-screen overflow-x-clip">
      <section id="top" className="mx-auto max-w-6xl px-5 pb-8 pt-5 sm:px-8 sm:pt-10">
        <div className="hero-panel relative overflow-hidden rounded-[2rem] px-6 py-10 text-white shadow-2xl shadow-ink/10 sm:px-12 sm:py-14">
          <div aria-hidden="true" className="hero-orb absolute -left-12 -top-20 h-64 w-64 rounded-full" />
          <div aria-hidden="true" className="hero-orb hero-orb-small absolute bottom-[-4rem] left-[30%] h-40 w-40 rounded-full" />
          <div className="relative z-10 max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm text-white/90 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-turmeric" />
              {locale === "ar" ? "اكتشف المطاعم القريبة منك" : "Discover restaurants near you"}
            </span>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.35] tracking-tight sm:text-5xl sm:leading-[1.3]">
              {locale === "ar" ? "كل المنيوهات" : "Every menu"}
              <br />
              <span className="text-turmeric">{locale === "ar" ? "اللي بتحبها، بمكان واحد." : "you love, all in one place."}</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-8 text-white/75 sm:text-lg">
              {locale === "ar"
                ? "اكتشف مطاعم قريبة منك، تصفّح الوجبات والأسعار، واختار شو نفسك فيه اليوم."
                : "Find nearby restaurants, browse menus and prices, and choose what you’re craving today."}
            </p>
            <a
              href="#restaurants"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-turmeric px-5 py-3 font-bold text-paper transition hover:-translate-y-0.5 hover:bg-sumac"
            >
              {locale === "ar" ? "استكشف المطاعم" : "Explore restaurants"}
              <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
            </a>
          </div>
          <div aria-hidden="true" className="hero-plate absolute bottom-[-2rem] left-8 hidden h-56 w-56 place-items-center rounded-full border border-white/15 sm:grid">
            <span className="grid h-40 w-40 place-items-center rounded-full border border-white/20 bg-white/10 text-7xl shadow-inner backdrop-blur-sm">🥙</span>
          </div>
          <span aria-hidden="true" className="absolute left-[42%] top-10 hidden rotate-[-12deg] text-4xl opacity-80 sm:block">✦</span>
        </div>

        <div id="restaurants" className="scroll-mt-8 pt-12 sm:pt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-turmeric">{locale === "ar" ? "اختار على مزاجك" : "Find your next favorite"}</span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{locale === "ar" ? "اكتشف المطاعم" : "Explore restaurants"}</h2>
              <p className="mt-2 text-sm text-ink/60 sm:text-base">{locale === "ar" ? "منيوهات وأسعار واضحة، قبل ما تقرر." : "Clear menus and prices, before you decide."}</p>
            </div>
            <span className="rounded-full bg-surface px-3.5 py-2 text-sm font-medium text-ink/70">
              {locale === "ar" ? `${restaurants.length} مطاعم متاحة` : `${restaurants.length} restaurants available`}
            </span>
          </div>
          <Explore restaurants={restaurants} coordinatesAvailable={!coordinatesUnavailable} locale={locale} />
        </div>
      </section>
      <footer id="about" className="mx-auto max-w-6xl px-5 pb-8 pt-4 text-center text-xs text-ink/45 sm:px-8">
        {locale === "ar" ? "MenU — اكتشف الطعم اللي بتحبه." : "MenU — Discover the flavors you love."}
      </footer>
    </main>
  );
}
