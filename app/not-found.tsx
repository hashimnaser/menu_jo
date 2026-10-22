import Link from "next/link";
import Brand from "@/components/Brand";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <p className="text-sm font-bold text-turmeric">404</p>
        <h1 className="mt-2 text-3xl font-bold">المطعم غير موجود</h1>
        <p className="mt-3 text-ink/60">قد يكون الرابط غير صحيح أو أن المطعم لم يعد متاحًا.</p>
        <Link
          href="/"
          className="mt-7 inline-flex rounded-full bg-turmeric px-5 py-3 font-bold text-paper transition hover:bg-sumac"
        >
          العودة إلى المطاعم
        </Link>
      </div>
    </main>
  );
}
