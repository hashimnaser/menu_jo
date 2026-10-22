import Explore from "@/components/Explore";
import Brand from "@/components/Brand";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id,name,slug,description,logo,cover_image,rating,location,phone,created_at,categories(id,name,restaurant_id,created_at,menu_items(id,name,description,price,image,is_available,category_id,created_at))",
    )
    .order("name");

  if (error) {
    throw new Error(`Could not load restaurants from Supabase: ${error.message}`);
  }

  const restaurants: Restaurant[] = (data ?? []).map((restaurant) => ({
    slug: restaurant.slug,
    name: restaurant.name,
    tagline: restaurant.description ?? restaurant.location ?? "",
    city: restaurant.location ?? "الأردن",
    cuisine: restaurant.categories.map((category) => category.name),
    whatsapp: restaurant.phone?.replace(/\D/g, ""),
    categories: restaurant.categories.map((category) => ({
      title: category.name,
      items: category.menu_items
        .filter((item) => item.is_available)
        .map((item) => ({
          name: item.name,
          desc: item.description ?? undefined,
          price: item.price,
        })),
    })),
  }));

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Brand />
        <span className="hidden items-center gap-2 rounded-full border border-ink/10 bg-surface/80 px-4 py-2 text-sm text-ink/70 sm:flex">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
          </svg>
          اكتشف مطاعم الأردن
        </span>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-8 pt-5 sm:px-8 sm:pt-10">
        <div className="hero-panel relative overflow-hidden rounded-[2rem] px-6 py-10 text-white shadow-2xl shadow-ink/10 sm:px-12 sm:py-14">
          <div aria-hidden="true" className="hero-orb absolute -left-12 -top-20 h-64 w-64 rounded-full" />
          <div aria-hidden="true" className="hero-orb hero-orb-small absolute bottom-[-4rem] left-[30%] h-40 w-40 rounded-full" />
          <div className="relative z-10 max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm text-white/90 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-turmeric" />
              دليلك لمذاق الأردن
            </span>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.35] tracking-tight sm:text-5xl sm:leading-[1.3]">
              كل المنيوهات
              <br />
              <span className="text-turmeric">اللي بتحبها، بمكان واحد.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-8 text-white/75 sm:text-lg">
              اكتشف مطاعم قريبة منك، تصفّح الوجبات والأسعار، واختار شو نفسك فيه اليوم.
            </p>
            <a
              href="#restaurants"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-turmeric px-5 py-3 font-bold text-paper transition hover:-translate-y-0.5 hover:bg-sumac"
            >
              استكشف المطاعم
              <span aria-hidden="true">←</span>
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
              <span className="text-sm font-bold text-turmeric">اختار على مزاجك</span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">اكتشف المطاعم</h2>
              <p className="mt-2 text-sm text-ink/60 sm:text-base">منيوهات وأسعار واضحة، قبل ما تقرر.</p>
            </div>
            <span className="rounded-full bg-surface px-3.5 py-2 text-sm font-medium text-ink/70">
              {restaurants.length} مطاعم متاحة
            </span>
          </div>
          <Explore restaurants={restaurants} />
        </div>
      </section>
      <footer className="mx-auto max-w-6xl px-5 pb-8 pt-4 text-center text-xs text-ink/45 sm:px-8">
        MenU — اكتشف الطعم اللي بتحبه.
      </footer>
    </main>
  );
}
