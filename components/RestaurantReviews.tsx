"use client";

import { useEffect, useMemo, useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";
import type { Review } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";

export default function RestaurantReviews({ restaurantId, locale }: { restaurantId: string; locale: Locale }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      setLoading(true);
      setError("");
      const { data, error: queryError } = await supabase
        .from("reviews")
        .select("id,restaurant_id,user_id,author_name,author_avatar,rating,comment,created_at,updated_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (!active) return;
      if (queryError) {
        setError(`${locale === "ar" ? "تعذر تحميل التقييمات" : "Could not load reviews"}: ${queryError.message}`);
      } else {
        setReviews(data);
      }
      setLoading(false);
    }

    void loadReviews();
    return () => {
      active = false;
    };
  }, [restaurantId, supabase]);

  const average = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  }, [reviews]);

  const handleSaved = (savedReview: Review) => {
    setReviews((current) =>
      [savedReview, ...current.filter((review) => review.id !== savedReview.id)]
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    );
  };

  return (
    <section className="mt-10 rounded-3xl border border-ink/[0.08] bg-surface p-5 shadow-sm shadow-black/10 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] pb-4">
        <div>
          <span className="text-sm font-bold text-turmeric">{locale === "ar" ? "آراء الزوار" : "Guest reviews"}</span>
          <h2 className="mt-1 text-xl font-bold">{locale === "ar" ? "تقييمات المطعم" : "Restaurant reviews"}</h2>
        </div>
        <div className="text-start" aria-live="polite">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-turmeric/10 px-3 py-2 font-bold tabular-nums text-ink">
            <span aria-hidden="true" className="text-amber-500">★</span>
            {average > 0 ? average.toFixed(1) : "—"}
            <span className="font-medium text-ink/50">({reviews.length})</span>
          </span>
        </div>
      </div>
      {loading ? (
        <p className="mt-3 text-sm text-ink/50">{locale === "ar" ? "جارٍ تحميل التقييمات..." : "Loading reviews..."}</p>
      ) : error ? (
        <p role="alert" className="mt-4 text-sm text-sumac">{error}</p>
      ) : (
        <ReviewList reviews={reviews} locale={locale} />
      )}
      <ReviewForm
        restaurantId={restaurantId}
        reviews={reviews}
        onSaved={handleSaved}
        locale={locale}
      />
    </section>
  );
}
