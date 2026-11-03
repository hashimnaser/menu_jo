import { getLocale } from "@/lib/i18n";

export default async function RestaurantLoading() {
  const locale = await getLocale();
  const isArabic = locale === "ar";

  return (
    <main
      className="mx-auto min-h-screen max-w-4xl px-5 pb-16"
      aria-busy="true"
      aria-label={isArabic ? "جارٍ تحميل قائمة المطعم" : "Loading restaurant menu"}
    >
      <div className="mt-6 animate-pulse space-y-5">
        <div className="h-52 rounded-[2rem] bg-surface sm:h-60" />
        <div className="h-12 rounded-full bg-surface" />
        <div className="h-32 rounded-3xl bg-surface" />
      </div>
      <p role="status" className="sr-only">
        {isArabic ? "جارٍ تحميل قائمة المطعم..." : "Loading restaurant menu..."}
      </p>
    </main>
  );
}
