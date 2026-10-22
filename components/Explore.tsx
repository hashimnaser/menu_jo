"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Restaurant } from "@/lib/data";
import { norm } from "@/lib/search";

export default function Explore({ restaurants }: { restaurants: Restaurant[] }) {
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);

  const cuisines = useMemo(() => Array.from(new Set(restaurants.flatMap((r) => r.cuisine))), [restaurants]);

  const list = useMemo(() => {
    const n = norm(q);
    return restaurants.filter((r) => {
      if (cuisine && !r.cuisine.includes(cuisine)) return false;
      if (!n) return true;
      const hay = [r.name, r.tagline, r.city, ...r.cuisine, ...r.categories.flatMap((c) => c.items.map((i) => i.name))].join(" ");
      return norm(hay).includes(n);
    });
  }, [q, cuisine, restaurants]);

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
          placeholder="شو نفسك تاكل؟ ابحث عن مطعم أو وجبة"
          aria-label="ابحث عن مطعم أو وجبة"
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink outline-none placeholder:text-ink/40 sm:text-lg"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="rounded-xl px-3 py-2 text-sm font-medium text-ink/55 hover:bg-surface-raised" aria-label="مسح البحث">
            مسح
          </button>
        )}
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="تصفية حسب نوع المطبخ">
        <span className="ml-1 text-sm font-medium text-ink/55">تصفّح حسب:</span>
        {[null, ...cuisines].map((c) => (
          <button
            key={c ?? "all"}
            onClick={() => setCuisine(c)}
            aria-pressed={cuisine === c}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              cuisine === c ? "bg-turmeric text-paper shadow-md shadow-black/20" : "bg-surface text-ink/70 ring-1 ring-ink/10 hover:-translate-y-0.5 hover:ring-turmeric/40"
            }`}
          >
            {c ?? "الكل"}
          </button>
        ))}
      </div>

      <div className="mb-4 mt-8 flex items-center justify-between">
        <h3 className="font-bold">{q || cuisine ? "نتائج البحث" : "أماكن تستاهل التجربة"}</h3>
        <span className="text-sm text-ink/50" aria-live="polite">{list.length} نتيجة</span>
      </div>

      {list.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => {
            const itemCount = r.categories.reduce((total, category) => total + category.items.length, 0);

            return (
              <li key={r.slug}>
                <Link
                  href={`/r/${r.slug}`}
                  className="restaurant-card group block h-full overflow-hidden rounded-3xl border border-ink/[0.08] bg-surface shadow-sm shadow-black/20 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/35"
                >
                  <span className="restaurant-art relative flex h-40 items-center justify-center overflow-hidden">
                    <span aria-hidden="true" className="absolute -left-10 -top-20 h-48 w-48 rounded-full border-[1.5rem] border-white/[0.06]" />
                    <span aria-hidden="true" className="absolute -bottom-20 -right-8 h-44 w-44 rounded-full bg-turmeric/[0.08]" />
                    <span className="relative z-[1] px-5 text-center text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl">
                      {r.name}
                    </span>
                    <span className="absolute right-4 top-4 rounded-full bg-paper/85 px-3 py-1 text-xs font-bold text-ink/90 backdrop-blur">
                      {r.cuisine[0]}
                    </span>
                  </span>
                  <span className="block p-5">
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="mt-1 block text-sm text-ink/55">{r.tagline}</span>
                      </span>
                      <span aria-hidden="true" className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-raised text-ink/60 transition group-hover:bg-turmeric group-hover:text-paper">←</span>
                    </span>
                    <span className="mt-5 flex items-center justify-between border-t border-ink/[0.07] pt-4 text-sm text-ink/55">
                      <span className="flex items-center gap-1.5">
                        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-current text-sumac">
                          <path d="M10 1.8a6.2 6.2 0 0 0-6.2 6.2c0 4.5 6.2 10.2 6.2 10.2s6.2-5.7 6.2-10.2A6.2 6.2 0 0 0 10 1.8Zm0 8.5a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6Z" />
                        </svg>
                        {r.city}
                      </span>
                      <span>{itemCount} أصناف</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-ink/15 bg-surface/70 px-6 py-14 text-center">
          <span aria-hidden="true" className="text-4xl">🔎</span>
          <p className="mt-3 font-bold">ما لقينا نتائج</p>
          <p className="mt-1 text-sm text-ink/55">جرّب كلمة ثانية أو غيّر نوع المطبخ.</p>
        </div>
      )}
    </section>
  );
}
