"use client";

import { useEffect, useState } from "react";

type RestaurantSummary = {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
};

type ApiResponse = {
  restaurants?: RestaurantSummary[];
  error?: string;
  success?: boolean;
};

export default function AdminRestaurantList() {
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function loadRestaurants(signal?: AbortSignal) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/restaurants", { signal });
      const result = await response.json() as ApiResponse;
      if (!response.ok) {
        setError(result.error ?? "تعذر تحميل قائمة المطاعم.");
        return;
      }
      if (!Array.isArray(result.restaurants)) {
        setError("تعذر تحميل قائمة المطاعم: استجابة الخادم غير صالحة.");
        return;
      }
      setRestaurants(result.restaurants);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError("تعذر الاتصال بالخادم أثناء تحميل المطاعم.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadRestaurants(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedRestaurant || deleting) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedRestaurant(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedRestaurant, deleting]);

  async function deleteRestaurant() {
    if (!selectedRestaurant) return;
    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/restaurants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: selectedRestaurant.id }),
      });
      const result = await response.json() as ApiResponse;
      if (!response.ok) {
        setError(result.error ?? "تعذر حذف المطعم.");
        return;
      }

      setRestaurants((current) => current.filter((restaurant) => restaurant.id !== selectedRestaurant.id));
      setSelectedRestaurant(null);
    } catch {
      setError("تعذر الاتصال بالخادم أثناء حذف المطعم.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-5xl px-4 sm:px-6" dir="rtl">
      <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-amber-400">إدارة المطاعم</p>
            <h1 className="mt-1 text-2xl font-bold">المطاعم الحالية</h1>
          </div>
          <button
            type="button"
            onClick={() => void loadRestaurants()}
            disabled={loading}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-amber-400/50 disabled:opacity-60"
          >
            {loading ? "جارٍ التحميل..." : "تحديث القائمة"}
          </button>
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}

        {loading ? (
          <p role="status" className="mt-5 text-sm text-slate-400">جارٍ تحميل المطاعم...</p>
        ) : restaurants.length === 0 ? (
          <p className="mt-5 text-sm text-slate-400">لا توجد مطاعم حالياً.</p>
        ) : (
          <ul className="mt-5 divide-y divide-white/10">
            {restaurants.map((restaurant) => (
              <li key={restaurant.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-semibold">{restaurant.name}</p>
                  {restaurant.name_en && <p dir="ltr" className="mt-1 text-sm text-slate-400">{restaurant.name_en}</p>}
                  <a href={`/${restaurant.slug}`} dir="ltr" className="mt-1 inline-block text-sm text-amber-300 hover:text-amber-200">
                    /{restaurant.slug}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className="shrink-0 rounded-xl border border-red-400/40 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-950/40"
                >
                  حذف المطعم
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedRestaurant && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-restaurant-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800 p-6 shadow-2xl"
          >
            <h2 id="delete-restaurant-title" className="text-xl font-bold text-red-300">تأكيد حذف المطعم</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              هل أنت متأكد من حذف <strong>{selectedRestaurant.name}</strong>؟ سيتم حذف المطعم وجميع أقسامه وأصنافه
              والتقييمات والإحصائيات المرتبطة به نهائياً.
            </p>
            {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedRestaurant(null)}
                disabled={deleting}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 disabled:opacity-60"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => void deleteRestaurant()}
                disabled={deleting}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
              >
                {deleting ? "جارٍ الحذف..." : "حذف المطعم"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
