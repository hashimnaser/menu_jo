import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <div className="mb-6 flex justify-center"><LanguageSwitcher locale={locale} /></div>
        <p className="text-sm font-bold text-turmeric">404</p>
        <h1 className="mt-2 text-3xl font-bold">{locale === "ar" ? "المطعم غير موجود" : "Restaurant not found"}</h1>
        <p className="mt-3 text-ink/60">{locale === "ar" ? "قد يكون الرابط غير صحيح أو أن المطعم لم يعد متاحًا." : "The link may be incorrect, or the restaurant is no longer available."}</p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-full bg-turmeric px-5 py-3 font-bold text-paper transition hover:bg-sumac"
        >
          {locale === "ar" ? "العودة إلى المطاعم" : "Back to restaurants"}
        </Link>
      </div>
    </main>
  );
}
