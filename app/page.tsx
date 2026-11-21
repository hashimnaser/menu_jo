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
        "id,name,name_ar,name_en,slug,description,description_en,logo,logo_url,cover_image,cover_url,rating,location,location_en,phone,whatsapp,cuisine,cuisine_en,created_at,categories(id,name,name_en,sort_order,restaurant_id,created_at,items(id,name_ar,name_en,description_ar,description_en,price,image_url,meal_type,is_available,category_id,created_at)),branches(id,branch_name_ar,branch_name_en,address_ar,address_en,latitude,longitude,google_maps_url,phone,whatsapp,working_hours,is_open,area_id,areas(id,name_ar,name_en,slug,city_id,cities(id,name_ar,name_en,slug)))",
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
    const branchRows = Array.isArray(restaurant.branches)
      ? restaurant.branches
      : restaurant.branches
        ? [restaurant.branches]
        : [];
    const primaryBranch = branchRows[0];
    const area = primaryBranch?.areas;
    const city = area?.cities;
    const localizedCity = localizedValue(locale, city?.name_ar ?? restaurant.location ?? "الأردن", city?.name_en ?? restaurant.location_en);
    const localizedArea = localizedValue(locale, area?.name_ar ?? "", area?.name_en);
    return {
      id: restaurant.id,
      slug: restaurant.slug,
      name: localizedValue(locale, restaurant.name, restaurant.name_en),
      nameEn: restaurant.name_en,
      logo: restaurant.logo_url ?? restaurant.logo,
      coverImage: restaurant.cover_url ?? restaurant.cover_image,
      tagline: localizedValue(locale, restaurant.description ?? restaurant.location ?? "", restaurant.description_en ?? restaurant.location_en),
      taglineEn: restaurant.description_en,
      city: localizedArea ? `${localizedCity} - ${localizedArea}` : localizedCity,
      cityEn: city?.name_en ?? restaurant.location_en,
      area: area?.name_ar ?? null,
      areaEn: area?.name_en ?? null,
      latitude: primaryBranch?.latitude ?? coordinates?.latitude ?? null,
      longitude: primaryBranch?.longitude ?? coordinates?.longitude ?? null,
      googleMapsUrl: primaryBranch?.google_maps_url ?? coordinates?.google_maps_url ?? null,
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
        items: (Array.isArray(category.items) ? category.items : category.items ? [category.items] : [])
          .filter((item) => item.is_available)
          .map((item) => ({
            name: localizedValue(locale, item.name_ar, item.name_en),
            nameEn: item.name_en,
            desc: localizedValue(locale, item.description_ar ?? "", item.description_en) || undefined,
            descEn: item.description_en,
            price: item.price,
            image: item.image_url,
            mealType: item.meal_type,
          })),
      })),
    };
  });

  return (
    <main className="min-h-screen overflow-x-clip">
      <section id="top" className="mx-auto max-w-6xl px-5 pb-8 pt-5 sm:px-8 sm:pt-10">
        <div className="hero-panel relative overflow-hidden rounded-[2rem] px-6 py-8 text-white shadow-2xl shadow-ink/10 sm:px-12 sm:py-14">
          <div aria-hidden="true" className="hero-orb absolute -left-12 -top-20 h-64 w-64 rounded-full" />
          <div aria-hidden="true" className="hero-orb hero-orb-small absolute bottom-[-4rem] left-[30%] h-40 w-40 rounded-full" />
          <div className="relative z-10 max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm text-white/90 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-turmeric" />
              {locale === "ar" ? "منيوهات الأردن بين إيديك" : "Discover restaurants near you"}
            </span>
            <h1 className="max-w-xl text-[2rem] font-bold leading-[1.25] tracking-tight text-balance sm:text-5xl sm:leading-[1.3]">
              {locale === "ar" ? "كل المنيوهات" : "Every menu"}
              <br />
              <span className="text-turmeric">{locale === "ar" ? "اللي بتحبها، بمكان واحد." : "you love, all in one place."}</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              {locale === "ar"
                ? "تصفّح الوجبات والأسعار المحدثة، واطلب مباشرة بكل سهولة."
                : "Find nearby restaurants, browse menus and prices, and choose what you’re craving today."}
            </p>
            <a
              href="#restaurants"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-turmeric px-5 py-3 font-bold text-[#241300] shadow-lg shadow-turmeric/20 transition hover:-translate-y-0.5 hover:bg-[#FFB52E]"
            >
              {locale === "ar" ? "تصفّح المطاعم" : "Explore restaurants"}
              <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
            </a>
          </div>
        </div>

        <div id="restaurants" className="scroll-mt-8 pt-8 sm:pt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{locale === "ar" ? "وين حابب تطلب اليوم؟" : "Explore restaurants"}</h2>
            <p className="mt-1.5 text-sm text-ink/60 sm:text-base">{locale === "ar" ? "منيوهات وأسعار واضحة، قبل ما تقرر." : "Clear menus and prices, before you decide."}</p>
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
