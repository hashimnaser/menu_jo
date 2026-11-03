import { cookies } from "next/headers";
import AdminLogin from "./AdminLogin";
import AdminRestaurantList from "./AdminRestaurantList";
import RestaurantEditor from "./RestaurantEditor";
import { ADMIN_COOKIE_NAME, isAdminConfigured, isValidAdminSession } from "@/lib/admin-auth";

export const metadata = { title: "لوحة الإدارة | MenU" };

export default function AddRestaurantPage() {
  if (!isAdminConfigured()) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16" dir="rtl">
        <p role="alert" className="rounded-2xl border border-amber-400/30 bg-slate-800 p-6 text-amber-100">
          إعدادات دخول الأدمن غير مكتملة. أضف متغيرات الأدمن المطلوبة إلى إعدادات الخادم.
        </p>
      </main>
    );
  }
  const isAdmin = isValidAdminSession(cookies().get(ADMIN_COOKIE_NAME)?.value);
  return isAdmin ? (
    <>
      <AdminRestaurantList />
      <RestaurantEditor />
    </>
  ) : <AdminLogin />;
}
