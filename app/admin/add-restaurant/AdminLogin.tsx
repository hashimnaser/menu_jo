"use client";

import { FormEvent, useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "تعذر تسجيل الدخول.");
        return;
      }
      window.location.reload();
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-[75vh] max-w-lg px-4 py-16" dir="rtl">
      <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-slate-800 p-8 shadow-xl">
        <p className="text-sm font-bold text-amber-400">مساحة خاصة</p>
        <h1 className="mt-2 text-2xl font-bold">دخول الأدمن</h1>
        <label className="mt-6 block text-sm font-medium" htmlFor="admin-password">كلمة المرور</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3"
        />
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-60"
        >
          {loading ? "جارٍ التحقق..." : "دخول"}
        </button>
      </form>
    </main>
  );
}
