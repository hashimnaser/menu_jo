"use client";

import { FormEvent, useState } from "react";

const weekdays = [
  ["sunday", "الأحد"],
  ["monday", "الإثنين"],
  ["tuesday", "الثلاثاء"],
  ["wednesday", "الأربعاء"],
  ["thursday", "الخميس"],
  ["friday", "الجمعة"],
  ["saturday", "السبت"],
] as const;

type MenuItem = { name: string; description: string; price: string; image: string; tags: string };
type MenuCategory = { name: string; nameEn: string; items: MenuItem[] };
type WorkingHours = Record<string, { open: string; close: string }>;

const blankItem = (): MenuItem => ({ name: "", description: "", price: "", image: "", tags: "" });
const blankCategory = (): MenuCategory => ({ name: "", nameEn: "", items: [blankItem()] });
const fieldClass = "mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500";
const labelClass = "block text-sm font-medium text-slate-200";

function Field({
  label, value, onChange, required, placeholder, type = "text", dir,
  step, min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
  step?: string;
  min?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        type={type}
        step={step}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        dir={dir}
        className={fieldClass}
      />
    </label>
  );
}

export default function RestaurantEditor() {
  const [form, setForm] = useState({
    name: "", nameEn: "", slug: "", cuisine: "", cuisineEn: "", location: "", locationEn: "",
    description: "", priceLevel: "1", coverImage: "", logo: "", whatsapp: "",
  });
  const [phones, setPhones] = useState([""]);
  const [hours, setHours] = useState<WorkingHours>({});
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [categories, setCategories] = useState<MenuCategory[]>([blankCategory()]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateCategory(index: number, key: "name" | "nameEn", value: string) {
    setCategories((current) => current.map((category, i) => i === index ? { ...category, [key]: value } : category));
  }

  function updateItem(categoryIndex: number, itemIndex: number, key: keyof MenuItem, value: string) {
    setCategories((current) => current.map((category, i) => i !== categoryIndex ? category : {
      ...category,
      items: category.items.map((item, j) => j === itemIndex ? { ...item, [key]: value } : item),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      priceLevel: Number(form.priceLevel),
      phones,
      whatsapp: form.whatsapp,
      workingHours: hours,
      isOpenNow,
      categories: categories.map((category) => ({
        ...category,
        items: category.items.map((item) => ({
          ...item,
          price: Number(item.price),
          tags: item.tags.split(/[،,]/).map((tag) => tag.trim()).filter(Boolean),
        })),
      })),
    };

    try {
      const response = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string; slug?: string };
      if (!response.ok) {
        if (response.status === 401) {
          setError("انتهت جلسة الأدمن. أعد تحميل الصفحة وسجّل الدخول مجدداً.");
        } else {
          setError(result.error ?? "تعذر نشر المطعم.");
        }
        return;
      }
      setMessage(`تم نشر المطعم بنجاح: /${result.slug}`);
    } catch (requestError) {
      setError(requestError instanceof Error
        ? `تعذر إكمال الطلب: ${requestError.message}`
        : "تعذر إكمال الطلب بسبب خطأ غير معروف.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6" dir="rtl">
      <header className="mb-8">
        <p className="text-sm font-bold text-amber-400">لوحة الأدمن</p>
        <h1 className="mt-2 text-3xl font-bold">إضافة مطعم جديد</h1>
        <p className="mt-2 text-sm text-slate-400">أدخل بيانات المطعم والمنيو ثم انشرها مباشرة.</p>
      </header>

      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 sm:p-7">
          <h2 className="text-xl font-bold">بيانات المطعم</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="اسم المطعم بالعربي" value={form.name} onChange={(v) => update("name", v)} required />
            <Field label="اسم المطعم بالإنجليزي" value={form.nameEn} onChange={(v) => update("nameEn", v)} />
            <Field
              label="Slug فريد للرابط"
              value={form.slug}
              onChange={(v) => update("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
              placeholder="مثال: amman-grill"
              dir="ltr"
            />
            <Field label="التصنيف / المطبخ بالعربي" value={form.cuisine} onChange={(v) => update("cuisine", v)} required />
            <Field label="التصنيف / المطبخ بالإنجليزي" value={form.cuisineEn} onChange={(v) => update("cuisineEn", v)} />
            <Field label="المنطقة / العنوان بالعربي" value={form.location} onChange={(v) => update("location", v)} required />
            <Field label="العنوان بالإنجليزي" value={form.locationEn} onChange={(v) => update("locationEn", v)} />
            <label className={labelClass}>
              مستوى السعر
              <select value={form.priceLevel} onChange={(event) => update("priceLevel", event.target.value)} className={fieldClass}>
                <option value="1">$</option><option value="2">$$</option><option value="3">$$$</option>
              </select>
            </label>
            <Field label="رابط صورة الغلاف" value={form.coverImage} onChange={(v) => update("coverImage", v)} type="url" dir="ltr" />
            <Field label="رابط اللوجو" value={form.logo} onChange={(v) => update("logo", v)} type="url" dir="ltr" />
            <label className={`${labelClass} sm:col-span-2`}>
              وصف مختصر
              <textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                rows={3}
                maxLength={500}
                className={fieldClass}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 sm:p-7">
          <h2 className="text-xl font-bold">الاتصال وساعات العمل</h2>
          <div className="mt-5 space-y-3">
            {phones.map((phone, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <Field label={`رقم الهاتف ${index + 1}`} value={phone} onChange={(value) => setPhones((current) => current.map((item, i) => i === index ? value : item))} dir="ltr" />
                </div>
                {phones.length > 1 && (
                  <button type="button" onClick={() => setPhones((current) => current.filter((_, i) => i !== index))} className="rounded-xl border border-white/10 px-4 py-3 text-sm">حذف</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setPhones((current) => [...current, ""])} className="text-sm font-bold text-amber-400">+ إضافة رقم هاتف</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="واتساب الطلبات المباشر" value={form.whatsapp} onChange={(v) => update("whatsapp", v)} dir="ltr" />
            <label className="flex items-center gap-3 self-end rounded-xl bg-slate-900 px-4 py-4 text-sm">
              <input type="checkbox" checked={isOpenNow} onChange={(event) => setIsOpenNow(event.target.checked)} className="h-4 w-4 accent-amber-400" />
              المطعم مفتوح الآن
            </label>
          </div>
          <h3 className="mt-6 font-bold">ساعات العمل اليومية</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {weekdays.map(([day, label]) => (
              <div key={day} className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3">
                <span className="w-16 shrink-0 text-sm">{label}</span>
                <input
                  type="time"
                  aria-label={`${label} - من`}
                  value={hours[day]?.open ?? ""}
                  onChange={(event) => setHours((current) => ({ ...current, [day]: { open: event.target.value, close: current[day]?.close ?? "" } }))}
                  className="min-w-0 flex-1 rounded-lg bg-slate-800 px-2 py-2 text-sm"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="time"
                  aria-label={`${label} - إلى`}
                  value={hours[day]?.close ?? ""}
                  onChange={(event) => setHours((current) => ({ ...current, [day]: { open: current[day]?.open ?? "", close: event.target.value } }))}
                  className="min-w-0 flex-1 rounded-lg bg-slate-800 px-2 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-800/80 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">أقسام وأصناف المنيو</h2>
              <p className="mt-1 text-sm text-slate-400">الأسعار بالدينار الأردني (JOD).</p>
            </div>
            <button type="button" onClick={() => setCategories((current) => [...current, blankCategory()])} className="rounded-xl border border-amber-400/40 px-4 py-2 text-sm font-bold text-amber-300">+ إضافة قسم</button>
          </div>
          <div className="mt-5 space-y-5">
            {categories.map((category, categoryIndex) => (
              <fieldset key={categoryIndex} className="rounded-xl border border-white/10 p-4">
                <legend className="px-2 font-bold">قسم {categoryIndex + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="اسم القسم بالعربي" value={category.name} onChange={(v) => updateCategory(categoryIndex, "name", v)} required />
                  <Field label="اسم القسم بالإنجليزي" value={category.nameEn} onChange={(v) => updateCategory(categoryIndex, "nameEn", v)} />
                </div>
                <div className="mt-4 space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="rounded-xl bg-slate-900/80 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold">صنف {itemIndex + 1}</h3>
                        {category.items.length > 1 && (
                          <button type="button" onClick={() => setCategories((current) => current.map((entry, i) => i === categoryIndex ? { ...entry, items: entry.items.filter((_, j) => j !== itemIndex) } : entry))} className="text-sm text-red-300">حذف الصنف</button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="اسم الصنف" value={item.name} onChange={(v) => updateItem(categoryIndex, itemIndex, "name", v)} required />
                        <Field label="السعر (JOD)" value={item.price} onChange={(v) => updateItem(categoryIndex, itemIndex, "price", v)} type="number" step="0.01" min="0" required dir="ltr" />
                        <Field label="رابط الصورة" value={item.image} onChange={(v) => updateItem(categoryIndex, itemIndex, "image", v)} type="url" dir="ltr" />
                        <Field label="وسوم، افصل بينها بفاصلة" value={item.tags} onChange={(v) => updateItem(categoryIndex, itemIndex, "tags", v)} placeholder="حار، الأكثر طلباً" />
                        <label className={`${labelClass} sm:col-span-2`}>
                          وصف الصنف
                          <textarea value={item.description} onChange={(event) => updateItem(categoryIndex, itemIndex, "description", event.target.value)} rows={2} className={fieldClass} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setCategories((current) => current.map((entry, i) => i === categoryIndex ? { ...entry, items: [...entry.items, blankItem()] } : entry))} className="text-sm font-bold text-amber-400">+ إضافة صنف</button>
                  {categories.length > 1 && <button type="button" onClick={() => setCategories((current) => current.filter((_, i) => i !== categoryIndex))} className="text-sm text-red-300">حذف القسم</button>}
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">{error}</p>}
        {message && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-4 text-sm text-emerald-200">{message}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-amber-400 px-5 py-4 font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60">
          {loading ? "جارٍ الحفظ والنشر..." : "حفظ ونشر"}
        </button>
      </form>
    </main>
  );
}
