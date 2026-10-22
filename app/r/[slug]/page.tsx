import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Brand from "@/components/Brand";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/data";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

async function getRestaurant(slug: string): Promise<Restaurant | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id,name,slug,description,logo,cover_image,rating,location,phone,created_at,categories(id,name,restaurant_id,created_at,menu_items(id,name,description,price,image,is_available,category_id,created_at))",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load restaurant "${slug}" from Supabase: ${error.message}`);
  }
  if (!data) return null;

  return {
    slug: data.slug,
    name: data.name,
    tagline: data.description ?? "",
    city: data.location ?? "الأردن",
    cuisine: data.categories.map((category) => category.name),
    whatsapp: data.phone?.replace(/\D/g, ""),
    categories: data.categories.map((category) => ({
      title: category.name,
      items: category.menu_items
        .filter((item) => item.is_available)
        .map((item) => ({
          name: item.name,
          desc: item.description ?? undefined,
          price: item.price,
        })),
    })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getRestaurant(params.slug);
  if (!r) return {};
  return {
    title: `منيو ${r.name} - ${r.city}`,
    description: `قائمة طعام ${r.name} في ${r.city}: ${r.cuisine.join("، ")}.`,
  };
}

export default async function MenuPage({ params }: Props) {
  const r = await getRestaurant(params.slug);
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

  return (
    <main className="min-h-screen px-5 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-ink/65 transition hover:text-ink">
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-xl bg-surface text-ink shadow-sm">→</span>
            كل المطاعم
          </Link>
          <Brand compact />
        </header>

        <section className="restaurant-header relative mt-3 overflow-hidden rounded-[2rem] px-6 py-9 text-white sm:px-10 sm:py-12">
          <span aria-hidden="true" className="absolute -left-8 -top-20 h-56 w-56 rounded-full border-[1.75rem] border-white/10" />
          <span aria-hidden="true" className="absolute bottom-[-5rem] left-[28%] h-40 w-40 rounded-full bg-white/[0.06]" />
          <div className="relative z-10">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/85">
              {r.cuisine.join(" · ")}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{r.name}</h1>
            <p className="mt-2 text-lg text-white/75">{r.tagline}</p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm text-white/75">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
              </svg>
              {r.city}
            </p>
          </div>
          <span aria-hidden="true" className="absolute bottom-2 left-8 hidden text-8xl opacity-70 sm:block">🍽️</span>
        </section>

        <nav aria-label="أقسام المنيو" className="sticky top-0 z-10 -mx-5 mt-5 flex gap-2 overflow-x-auto bg-paper/95 px-5 py-3 backdrop-blur-xl sm:-mx-0 sm:px-0">
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
                <span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium text-ink/70">{c.items.length} أصناف</span>
              </div>
              <ul className="divide-y divide-ink/[0.07]">
                {c.items.map((it) => (
                  <li key={it.name} className="flex items-start justify-between gap-4 py-4 last:pb-1">
                    <div>
                      <p className="font-semibold">{it.name}</p>
                      {it.desc && <p className="mt-1 text-sm leading-6 text-ink/55">{it.desc}</p>}
                    </div>
                    <p className="shrink-0 rounded-xl bg-turmeric/15 px-3 py-1.5 text-sm font-bold tabular-nums text-turmeric">
                      {it.price.toFixed(2)} <span className="text-xs font-medium">د.أ</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {r.whatsapp && (
          <a href={`https://wa.me/${r.whatsapp}`} className="mt-8 block rounded-2xl bg-turmeric px-6 py-4 text-center font-bold text-paper shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-sumac">
            اطلب عبر واتساب
          </a>
        )}
      </div>
    </main>
  );
}
