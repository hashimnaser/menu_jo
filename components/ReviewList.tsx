import Link from "next/link";
import type { Review } from "@/lib/reviews";
import { formatRelativeTime } from "@/lib/relative-time";
import type { Locale } from "@/lib/i18n";

export default function ReviewList({ reviews, locale }: { reviews: Review[]; locale: Locale }) {
  if (reviews.length === 0) {
    return <p className="mt-3 text-sm text-ink/50">{locale === "ar" ? "لا توجد تقييمات بعد. كن أول من يقيّم المطعم." : "No reviews yet. Be the first to review this restaurant."}</p>;
  }

  return (
    <ul className="mt-5 space-y-4">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-2xl border border-ink/[0.07] bg-paper/70 p-4 shadow-sm shadow-black/[0.03] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/customer/${encodeURIComponent(review.user_id)}`}
              className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-turmeric"
              aria-label={locale === "ar" ? `عرض ملف ${review.author_name?.trim() || "مستخدم Google"}` : `View ${review.author_name?.trim() || "Google user"}'s profile`}
            >
              <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-turmeric/15 text-base font-bold text-turmeric">
                <span aria-hidden="true">{review.author_name?.trim().charAt(0) || "م"}</span>
                {review.author_avatar && (
                  <img
                    src={review.author_avatar}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">
                  {review.author_name?.trim() || (locale === "ar" ? "مستخدم Google" : "Google user")}
                </p>
                <p className="mt-0.5 text-xs text-ink/45">{locale === "ar" ? "مراجع عبر Google" : "Reviewed via Google"}</p>
              </div>
            </Link>
            <time
              dateTime={review.created_at}
              title={new Date(review.created_at).toLocaleString(locale === "ar" ? "ar-JO" : "en")}
              className="shrink-0 pt-1 text-xs text-ink/45"
              dir="auto"
            >
              {formatRelativeTime(review.created_at, locale)}
            </time>
          </div>
          <p className="mt-3 text-sm tracking-wide text-turmeric" aria-label={locale === "ar" ? `${review.rating} من 5 نجوم` : `${review.rating} out of 5 stars`}>
            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
          </p>
          {review.comment && (
            <p dir="rtl" className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink/75">{review.comment}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
