import Link from "next/link";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="MenU - الصفحة الرئيسية"
      className="inline-flex items-center"
    >
      <span
        dir="ltr"
        className={`font-bold tracking-tight text-ink ${compact ? "text-lg" : "text-2xl"}`}
      >
        Men<span className="text-turmeric">U</span>
      </span>
    </Link>
  );
}
