import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/relative-time";
import { getLocale, localizedValue } from "@/lib/i18n";

type Props = { params: { userId: string } };

const REVIEW_POINTS = 15;

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: locale === "ar" ? "ملف المراجع | MenU" : "Reviewer Profile | MenU" };
}

export default async function CustomerPage({ params }: Props) {
  const locale = await getLocale();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.userId)) {
    notFound();
  }

  const supabase = createClient();
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id,user_id,author_name,author_avatar,rating,comment,created_at,restaurants(name,name_en,slug,location,location_en)")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load customer reviews: ${error.message}`);
  }
  if (reviews.length === 0) notFound();

  const name = reviews.find((review) => review.author_name?.trim())?.author_name?.trim()
    ?? (locale === "ar" ? "مستخدم Google" : "Google user");
  const avatar = reviews.find((review) => review.author_avatar)?.author_avatar ?? null;
  const points = reviews.length * REVIEW_POINTS;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const label = (arabic: string, english: string) => locale === "ar" ? arabic : english;

  return (
    <main className="min-h-screen px-5 pb-16">
      <header className="sticky top-0 z-40 -mx-5 border-b border-white/10 bg-[#0F172A]/95 px-5 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-3 sm:h-[4.5rem] sm:px-8">
          <Link
            href="/"
            aria-label={label("العودة إلى المطاعم", "Back to restaurants")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/10 bg-surface text-ink/70 transition hover:border-turmeric/50 hover:text-turmeric sm:h-11 sm:w-11"
          >
            <span aria-hidden="true" className="text-xl">{locale === "ar" ? "→" : "←"}</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl">
        <section className="mt-4 rounded-3xl border border-ink/[0.08] bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
            <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-turmeric/15 text-3xl font-bold text-turmeric">
              <span aria-hidden="true">{name.charAt(0) || "م"}</span>
              {avatar && (
                <Image
                  src={avatar}
                  alt=""
                  fill
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-turmeric">{label("ملف المراجع", "Reviewer profile")}</p>
              <h1 className="mt-1 text-2xl font-bold text-ink">{name}</h1>
              <p className="mt-1 text-sm text-ink/55">{label("مراجع عبر Google", "Reviewer via Google")}</p>
            </div>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-paper p-4 text-center">
              <dt className="text-xs text-ink/55">{label("النقاط", "Points")}</dt>
              <dd className="mt-1 text-2xl font-black tabular-nums text-turmeric">{points}</dd>
            </div>
            <div className="rounded-2xl bg-paper p-4 text-center">
              <dt className="text-xs text-ink/55">{label("عدد التقييمات", "Reviews")}</dt>
              <dd className="mt-1 text-2xl font-black tabular-nums text-ink">{reviews.length}</dd>
            </div>
            <div className="col-span-2 rounded-2xl bg-paper p-4 text-center sm:col-span-1">
              <dt className="text-xs text-ink/55">{label("متوسط التقييم", "Average rating")}</dt>
              <dd className="mt-1 text-2xl font-black tabular-nums text-ink">
                <span className="text-turmeric">★</span> {averageRating.toFixed(1)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-center text-xs text-ink/45">{label("تُحتسب 15 نقطة لكل تقييم منشور.", "15 points are awarded for each published review.")}</p>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-turmeric">{label("مساهمات المجتمع", "Community contributions")}</p>
              <h2 className="mt-1 text-xl font-bold text-ink">{label(`تقييمات ${name}`, `${name}'s reviews`)}</h2>
            </div>
            <span className="rounded-full bg-surface px-3 py-1.5 text-sm text-ink/60">
              {locale === "ar" ? `${reviews.length} تقييم` : `${reviews.length} reviews`}
            </span>
          </div>

          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-2xl border border-ink/[0.08] bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {review.restaurants ? (
                      <Link
                        href={`/${encodeURIComponent(review.restaurants.slug)}`}
                        className="font-bold text-ink transition hover:text-turmeric"
                      >
                        {localizedValue(locale, review.restaurants.name, review.restaurants.name_en)}
                      </Link>
                    ) : (
                      <p className="font-bold text-ink">{label("مطعم", "Restaurant")}</p>
                    )}
                    {review.restaurants?.location && (
                      <p className="mt-1 text-xs text-ink/50">
                        {localizedValue(locale, review.restaurants.location, review.restaurants.location_en)}
                      </p>
                    )}
                  </div>
                  <div className="text-start">
                    <time
                      dateTime={review.created_at}
                      className="block text-xs font-medium text-ink/60"
                      dir="auto"
                    >
                      {formatRelativeTime(review.created_at, locale)}
                    </time>
                    <span className="mt-1 block text-[11px] text-ink/40" dir="auto">
                      {new Date(review.created_at).toLocaleString(locale === "ar" ? "ar-JO" : "en")}
                    </span>
                  </div>
                </div>
                <p
                  className="mt-4 text-sm tracking-wide text-turmeric"
                  aria-label={locale === "ar" ? `${review.rating} من 5 نجوم` : `${review.rating} out of 5 stars`}
                >
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </p>
                {review.comment && (
                  <p dir="rtl" className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink/75">
                    {review.comment}
                  </p>
                )}
                <p className="mt-4 border-t border-ink/[0.06] pt-3 text-xs font-semibold text-turmeric">
                  +{REVIEW_POINTS} {label("نقطة", "points")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
