"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";

type Props = {
  restaurantId: string;
  restaurantName: string;
  phoneNumbers: string[];
  whatsapp?: string;
  locale: Locale;
};

type EventType = "call" | "whatsapp" | "share" | "page_view";

async function trackEvent(restaurantId: string, eventType: EventType): Promise<void> {
  try {
    const { error } = await createClient()
      .from("restaurant_analytics")
      .insert({ restaurant_id: restaurantId, event_type: eventType });
    if (error) console.error(`Could not track restaurant ${eventType} event:`, error.message);
  } catch (error) {
    console.error(`Could not track restaurant ${eventType} event:`, error);
  }
}

function getTelephoneHref(phoneNumber: string): string {
  return `tel:${phoneNumber.replace(/[^\d+]/g, "")}`;
}

async function copyPageUrl(): Promise<boolean> {
  const url = window.location.href;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch (error) {
    console.warn("Clipboard API could not copy the restaurant link:", error);
  }

  const textarea = document.createElement("textarea");
  textarea.value = url;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export default function RestaurantActions({
  restaurantId,
  restaurantName,
  phoneNumbers,
  whatsapp,
  locale,
}: Props) {
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const pageViewTracked = useRef(false);
  const isArabic = locale === "ar";

  useEffect(() => {
    if (pageViewTracked.current) return;
    pageViewTracked.current = true;
    void trackEvent(restaurantId, "page_view");
  }, [restaurantId]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isPhoneModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPhoneModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPhoneModalOpen]);

  const shareRestaurant = async () => {
    void trackEvent(restaurantId, "share");
    const shareData = { title: restaurantName, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Native sharing could not share the restaurant link; trying clipboard:", error);
      }
    }

    try {
      const copied = await copyPageUrl();
      setToast(copied
        ? (isArabic ? "تم نسخ الرابط" : "Link copied")
        : (isArabic ? "تعذر نسخ الرابط" : "Could not copy the link"));
    } catch (error) {
      console.error("Could not copy the restaurant link:", error);
      setToast(isArabic ? "تعذر نسخ الرابط" : "Could not copy the link");
    }
  };

  const callButton = (
    <button
      type="button"
      onClick={() => setIsPhoneModalOpen(true)}
      className={actionClassName}
    >
      <span aria-hidden="true">☎</span>
      {isArabic ? "اتصل بالمطعم" : "Call restaurant"}
    </button>
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {phoneNumbers.length === 0 ? (
          <button type="button" disabled className={unavailableActionClassName}>
            <span aria-hidden="true">☎</span>
            {isArabic ? "الاتصال غير متاح" : "Call unavailable"}
          </button>
        ) : phoneNumbers.length === 1 ? (
          <a
            href={getTelephoneHref(phoneNumbers[0])}
            onClick={() => void trackEvent(restaurantId, "call")}
            className={actionClassName}
          >
            <span aria-hidden="true">☎</span>
            {isArabic ? "اتصل بالمطعم" : "Call restaurant"}
          </a>
        ) : callButton}
        {whatsapp ? (
          <a
            href={`https://wa.me/${whatsapp}`}
            onClick={() => void trackEvent(restaurantId, "whatsapp")}
            className={actionClassName}
          >
            <span aria-hidden="true">◉</span>
            {isArabic ? "اطلب عبر واتساب" : "Order via WhatsApp"}
          </a>
        ) : (
          <button type="button" disabled className={unavailableActionClassName}>
            <span aria-hidden="true">◉</span>
            {isArabic ? "واتساب غير متاح" : "WhatsApp unavailable"}
          </button>
        )}
        <button
          type="button"
          onClick={shareRestaurant}
          className={actionClassName}
        >
          <span aria-hidden="true">↗</span>
          {isArabic ? "مشاركة المطعم" : "Share restaurant"}
        </button>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[1100] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}

      {isPhoneModalOpen && phoneNumbers.length > 1 && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-end bg-ink/60 p-4 backdrop-blur-sm sm:place-items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsPhoneModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="restaurant-phone-dialog-title"
            className="w-full max-w-md rounded-3xl border border-ink/10 bg-surface p-6 shadow-2xl"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="restaurant-phone-dialog-title" className="text-xl font-bold text-ink">
                {isArabic ? "اختر رقم الاتصال" : "Choose a phone number"}
              </h2>
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                aria-label={isArabic ? "إغلاق" : "Close"}
                className="rounded-full px-3 py-1 text-xl text-ink/60 hover:bg-surface-raised hover:text-ink"
              >
                ×
              </button>
            </div>
            <ul className="space-y-2">
              {phoneNumbers.map((phoneNumber) => (
                <li key={phoneNumber}>
                  <a
                    href={getTelephoneHref(phoneNumber)}
                    onClick={() => {
                      void trackEvent(restaurantId, "call");
                      setIsPhoneModalOpen(false);
                    }}
                    className="flex items-center justify-between rounded-2xl border border-ink/10 bg-surface-raised px-4 py-3 font-semibold text-ink transition hover:border-turmeric/50 hover:bg-turmeric/10"
                  >
                    <span>{phoneNumber}</span>
                    <span aria-hidden="true">☎</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}

const actionClassName =
  "inline-flex min-h-14 min-w-0 touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-surface-raised px-1.5 py-2 text-center text-[11px] font-bold leading-tight text-white transition hover:border-turmeric/50 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric sm:flex-row sm:gap-2 sm:px-3 sm:text-sm";

const unavailableActionClassName =
  "inline-flex min-h-14 min-w-0 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-2xl border border-white/5 bg-surface px-1.5 py-2 text-center text-[11px] font-semibold leading-tight text-white/45 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm";
