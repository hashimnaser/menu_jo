import { cookies } from "next/headers";
import AdminLogin from "./add-restaurant/AdminLogin";
import { ADMIN_COOKIE_NAME, isAdminConfigured, isValidAdminSession } from "@/lib/admin-auth";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  if (!isAdminConfigured()) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16" dir="rtl">
        <p role="alert" className="rounded-2xl border border-amber-400/30 bg-slate-800 p-6 text-amber-100">
          إعدادات دخول الأدمن غير مكتملة. أضف متغيرات الأدمن المطلوبة إلى إعدادات الخادم.
        </p>
      </main>
    );
  }
  if (!isValidAdminSession(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    return <AdminLogin />;
  }

  return (
    <>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pt-7 sm:px-6">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-amber-300">MENUJO · ADMIN</p>
          <p className="mt-1 text-sm text-slate-400">مساحة مرتبة لإدارة مطاعمك</p>
        </div>
        <nav aria-label="روابط لوحة الإدارة" className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-1.5">
          <a href="/admin" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">الرئيسية</a>
          <a href="/admin/restaurants" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">المطاعم</a>
          <a href="/admin/add-restaurant" className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-300">إضافة مطعم</a>
        </nav>
      </header>
      {children}
    </>
  );
}
