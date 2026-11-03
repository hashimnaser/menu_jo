"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Review } from "@/lib/reviews";
import type { Locale } from "@/lib/i18n";

export default function ReviewForm({
  restaurantId,
  reviews,
  onSaved,
  locale,
}: {
  restaurantId: string;
  reviews: Review[];
  onSaved: (review: Review) => void;
  locale: Locale;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [signingIn, setSigningIn] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();
  const isGoogleUser = user?.app_metadata.provider === "google";
  const existingReview = reviews.find((review) => review.user_id === user?.id);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error && error.name !== "AuthSessionMissingError") {
        setMessage(`${locale === "ar" ? "تعذر التحقق من تسجيل الدخول" : "Could not verify sign-in"}: ${error.message}`);
      }
      setUser(data.user);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, locale]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("auth") !== "error") return;
    setMessage(locale === "ar" ? "لم يكتمل تسجيل الدخول عبر Google. حاول مرة أخرى." : "Google sign-in did not complete. Please try again.");
    setIsOpen(true);
    url.searchParams.delete("auth");
    window.history.replaceState(window.history.state, "", url);
  }, [locale]);

  useEffect(() => {
    setRating(existingReview?.rating ?? 0);
    setComment(existingReview?.comment ?? "");
  }, [existingReview?.id, existingReview?.rating, existingReview?.comment]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const signInWithGoogle = async () => {
    setMessage("");
    setSigningIn(true);
    const returnPath = `${window.location.pathname}${window.location.search}`;
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", returnPath);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() },
      });
      if (error) {
        setMessage(`${locale === "ar" ? "تعذر بدء تسجيل الدخول عبر Google" : "Could not start Google sign-in"}: ${error.message}`);
        setSigningIn(false);
      }
    } catch (error) {
      setMessage(
        `${locale === "ar" ? "تعذر بدء تسجيل الدخول عبر Google" : "Could not start Google sign-in"}: ${error instanceof Error ? error.message : locale === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred."}`,
      );
      setSigningIn(false);
    }
  };

  const getProfileValue = (keys: string[]) => {
    for (const key of keys) {
      const value = user?.user_metadata?.[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !isGoogleUser) {
      setMessage(locale === "ar" ? "سجّل الدخول عبر Google أولاً لإرسال تقييمك." : "Sign in with Google before submitting a review.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setMessage(locale === "ar" ? "اختر تقييماً من نجمة إلى خمس نجوم." : "Choose a rating from one to five stars.");
      return;
    }

    setStatus("submitting");
    setMessage("");
    const { data, error } = await supabase
      .from("reviews")
      .upsert(
        {
          restaurant_id: restaurantId,
          user_id: user.id,
          author_name: getProfileValue(["full_name", "name"]) ?? existingReview?.author_name,
          author_avatar: getProfileValue(["avatar_url", "picture"]) ?? existingReview?.author_avatar,
          rating,
          comment: comment.trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "restaurant_id,user_id" },
      )
      .select("id,restaurant_id,user_id,author_name,author_avatar,rating,comment,created_at,updated_at")
      .single();

    setStatus("idle");
    if (error) {
      setMessage(`${locale === "ar" ? "تعذر حفظ تقييمك" : "Could not save your review"}: ${error.message}`);
      return;
    }

    onSaved(data);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage("");
          setIsOpen(true);
        }}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-turmeric px-5 py-3 text-sm font-bold text-paper shadow-md shadow-turmeric/20 transition hover:-translate-y-0.5 hover:bg-sumac hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric active:translate-y-0"
      >
        <span aria-hidden="true">★</span>
        {existingReview ? (locale === "ar" ? "عدّل تقييمك" : "Edit your review") : (locale === "ar" ? "أضف تقييمك" : "Add your review")}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            className="w-full max-w-md rounded-3xl border border-ink/10 bg-surface p-6 shadow-2xl"
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="review-dialog-title" className="text-xl font-bold text-ink">
                  {authLoading
                    ? (locale === "ar" ? "تقييم المطعم" : "Restaurant review")
                    : isGoogleUser
                      ? existingReview ? (locale === "ar" ? "عدّل تقييمك" : "Edit your review") : (locale === "ar" ? "أضف تقييمك" : "Add your review")
                      : (locale === "ar" ? "سجّل الدخول للتقييم" : "Sign in to review")}
                </h3>
                <p className="mt-1 text-sm leading-6 text-ink/60">
                  {authLoading
                    ? (locale === "ar" ? "جارٍ التحقق من تسجيل الدخول..." : "Checking sign-in...")
                    : isGoogleUser
                      ? (locale === "ar" ? "شاركنا رأيك ليساعد الزوار الآخرين." : "Share your thoughts to help other visitors.")
                      : (locale === "ar" ? "يلزم تسجيل الدخول بحساب Google لإضافة تقييم أو تعديله." : "Sign in with Google to add or edit a review.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={locale === "ar" ? "إغلاق" : "Close"}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-raised text-ink/60 transition hover:bg-ink/10 hover:text-ink"
              >
                ×
              </button>
            </div>

            {authLoading ? (
              <div className="mt-5 h-10 animate-pulse rounded-xl bg-surface-raised" />
            ) : isGoogleUser ? (
              <form onSubmit={submitReview} className="mt-5">
                <div className="flex gap-1" role="radiogroup" aria-label={locale === "ar" ? "اختر عدد النجوم" : "Choose a star rating"}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={locale === "ar" ? `${value} ${value === 1 ? "نجمة" : "نجوم"}` : `${value} ${value === 1 ? "star" : "stars"}`}
                      onClick={() => setRating(value)}
                      className={`text-3xl leading-none transition hover:scale-110 ${value <= rating ? "text-turmeric" : "text-ink/25"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <label className="mt-4 block">
                  <span className="sr-only">{locale === "ar" ? "تعليقك (اختياري)" : "Your comment (optional)"}</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder={locale === "ar" ? "شاركنا رأيك (اختياري)" : "Share your thoughts (optional)"}
                    dir="rtl"
                    className="w-full resize-y rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-turmeric/50"
                  />
                </label>
                <button
                  type="submit"
                  disabled={status === "submitting" || rating === 0}
                  className="mt-3 w-full rounded-full bg-turmeric px-5 py-3 font-bold text-paper transition hover:bg-sumac disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "submitting" ? (locale === "ar" ? "جارٍ الحفظ..." : "Saving...") : existingReview ? (locale === "ar" ? "حفظ التعديل" : "Save changes") : (locale === "ar" ? "إرسال التقييم" : "Submit review")}
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={signingIn}
                className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-turmeric/30 bg-paper px-5 py-3.5 font-bold text-ink shadow-md shadow-black/15 transition hover:-translate-y-0.5 hover:border-turmeric/60 hover:bg-surface hover:shadow-lg"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 shrink-0">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.05 5.05 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.15a11 11 0 0 0 0 9.88l3.69-2.84Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.37c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.85 6.06L5.84 9.9C6.71 7.3 9.14 5.37 12 5.37Z"
                  />
                </svg>
                {signingIn ? (locale === "ar" ? "جارٍ الانتقال إلى Google..." : "Redirecting to Google...") : (locale === "ar" ? "المتابعة باستخدام Google" : "Continue with Google")}
              </button>
            )}

            {message && (
              <p role="alert" className="mt-3 text-sm text-sumac">{message}</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
