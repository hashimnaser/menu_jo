"use client";

import { FormEvent, useEffect, useState } from "react";

const weekdays = [
  ["sunday", "الأحد"],
  ["monday", "الإثنين"],
  ["tuesday", "الثلاثاء"],
  ["wednesday", "الأربعاء"],
  ["thursday", "الخميس"],
  ["friday", "الجمعة"],
  ["saturday", "السبت"],
] as const;

const mealTypes = [
  "شاورما دجاج عربي",
  "ساندويتش شاورما",
  "بروستد",
  "منسف",
  "برغر لحم",
  "برغر دجاج",
  "مناقيش",
  "مشاوي",
  "وجبات عائلية",
  "مشروبات",
  "أخرى",
] as const;
const serviceOptions = [
  { value: "dine_in", label: "محلي" },
  { value: "takeaway", label: "تيك أوي" },
  { value: "delivery", label: "توصيل" },
] as const;

type MenuItem = {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: string;
  image: string;
  tags: string;
  isAvailable: boolean;
  mealType: string;
};
type MenuCategory = { name: string; nameEn: string; items: MenuItem[] };
type WorkingHours = Record<string, { open: string; close: string }>;
type LocationOption = { id: string; name_ar: string; name_en: string | null; slug: string };
type AreaOption = LocationOption & { city_id: string };
type AdminBranch = {
  branchName: string;
  branchNameEn: string;
  cityId: string;
  areaId: string;
  address: string;
  addressEn: string;
  latitude: string;
  longitude: string;
  googleMapsUrl: string;
  phone: string;
  whatsapp: string;
  workingHours: WorkingHours;
  isOpen: boolean;
};

const blankItem = (): MenuItem => ({
  name: "", nameEn: "", description: "", descriptionEn: "", price: "", image: "", tags: "", isAvailable: true, mealType: "أخرى",
});
const blankCategory = (): MenuCategory => ({ name: "", nameEn: "", items: [blankItem()] });
const fieldClass = "mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500";
const labelClass = "block text-sm font-medium text-slate-200";

function Field({
  label, value, onChange, required, placeholder, type = "text", dir, language = "ar",
  step, min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  language?: "ar" | "en";
  dir?: "ltr" | "rtl";
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className={labelClass}>
      <span className="flex items-center justify-between gap-2">
        {label}
        <span aria-hidden="true" className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${language === "en" ? "bg-sky-400/10 text-sky-200" : "bg-emerald-400/10 text-emerald-200"}`}>
          {language === "en" ? "EN" : "ع"}
        </span>
      </span>
      <input
        type={type}
        lang={language}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        dir={dir ?? (language === "en" ? "ltr" : "rtl")}
        className={`${fieldClass} transition focus:border-amber-300/60 focus:outline-none focus:ring-2 focus:ring-amber-300/10`}
      />
    </label>
  );
}

export default function RestaurantEditor({
  restaurantId,
  onCancel,
  onSaved,
}: {
  restaurantId?: string;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const blankBranch = (): AdminBranch => ({
    branchName: "الفرع الرئيسي",
    branchNameEn: "",
    cityId: "",
    areaId: "",
    address: "",
    addressEn: "",
    latitude: "",
    longitude: "",
    googleMapsUrl: "",
    phone: "",
    whatsapp: "",
    workingHours: {},
    isOpen: true,
  });
  const [branches, setBranches] = useState<AdminBranch[]>([blankBranch()]);
  const [form, setForm] = useState({
    name: "", nameEn: "", slug: "", cuisine: "", cuisineEn: "", location: "", locationEn: "",
    latitude: "", longitude: "", googleMapsUrl: "",
    description: "", priceLevel: "1", coverImage: "", logo: "", whatsapp: "",
    instagramUrl: "", facebookUrl: "", tiktokUrl: "",
  });
  const [serviceTypes, setServiceTypes] = useState<string[]>(["dine_in", "takeaway", "delivery"]);
  const [phones, setPhones] = useState([""]);
  const [hours, setHours] = useState<WorkingHours>({});
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [categories, setCategories] = useState<MenuCategory[]>([blankCategory()]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRestaurant, setLoadingRestaurant] = useState(Boolean(restaurantId));
  const [uploadingImages, setUploadingImages] = useState(0);

  useEffect(() => {
    void fetch("/api/admin/restaurants?options=1")
      .then(async (response) => {
        const result = await response.json() as {
          error?: string;
          cities?: LocationOption[];
          areas?: AreaOption[];
        };
        if (!response.ok) throw new Error(result.error ?? "تعذر تحميل المدن والمناطق.");
        setCities(result.cities ?? []);
        setAreas(result.areas ?? []);
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "تعذر تحميل المدن والمناطق.");
      });
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    const controller = new AbortController();
    setLoadingRestaurant(true);
    setError("");

    void fetch(`/api/admin/restaurants?id=${encodeURIComponent(restaurantId)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as {
          error?: string;
          restaurant?: {
            name: string;
            name_en: string | null;
            slug: string;
            cuisine: string | null;
            cuisine_en: string | null;
            location: string | null;
            location_en: string | null;
            latitude: number | null;
            longitude: number | null;
            google_maps_url: string | null;
            description: string | null;
            price_level: number | null;
            service_types: string[] | null;
            instagram_url: string | null;
            facebook_url: string | null;
            tiktok_url: string | null;
            cover_image: string | null;
            logo: string | null;
            phone: string | null;
            whatsapp: string | null;
            working_hours: unknown;
            is_open_now: boolean;
            categories: Array<{
              name: string;
              name_en: string | null;
              items: Array<{
                name_ar: string;
                name_en: string | null;
                description_ar: string | null;
                description_en: string | null;
                price: number;
                image_url: string | null;
                tags: string[];
                is_available: boolean;
                meal_type: string;
              }>;
            }>;
            branches: Array<{
              id: string;
              area_id: string;
              branch_name_ar: string;
              branch_name_en: string | null;
              address_ar: string | null;
              address_en: string | null;
              google_maps_url: string | null;
              latitude: number | null;
              longitude: number | null;
              phone: string | null;
              whatsapp: string | null;
              working_hours: unknown;
              is_open: boolean;
              areas: { city_id: string } | null;
            }>;
          };
        };
        if (!response.ok || !result.restaurant) {
          throw new Error(result.error ?? "تعذر تحميل بيانات المطعم.");
        }

        const restaurant = result.restaurant;
        setForm({
          name: restaurant.name,
          nameEn: restaurant.name_en ?? "",
          slug: restaurant.slug,
          cuisine: restaurant.cuisine ?? "",
          cuisineEn: restaurant.cuisine_en ?? "",
          location: restaurant.location ?? "",
          locationEn: restaurant.location_en ?? "",
          latitude: restaurant.latitude == null ? "" : String(restaurant.latitude),
          longitude: restaurant.longitude == null ? "" : String(restaurant.longitude),
          googleMapsUrl: restaurant.google_maps_url ?? "",
          description: restaurant.description ?? "",
          priceLevel: String(restaurant.price_level ?? 1),
          coverImage: restaurant.cover_image ?? "",
          logo: restaurant.logo ?? "",
          whatsapp: restaurant.whatsapp ?? "",
          instagramUrl: restaurant.instagram_url ?? "",
          facebookUrl: restaurant.facebook_url ?? "",
          tiktokUrl: restaurant.tiktok_url ?? "",
        });
        setServiceTypes(restaurant.service_types ?? ["dine_in", "takeaway", "delivery"]);
        const phones = (restaurant.phone ?? "").split(/[,;|/\n]+/).map((phone) => phone.trim()).filter(Boolean);
        setPhones(phones.length ? phones : [""]);
        setHours(
          typeof restaurant.working_hours === "object" &&
            restaurant.working_hours !== null &&
            !Array.isArray(restaurant.working_hours)
            ? restaurant.working_hours as WorkingHours
            : {},
        );
        setIsOpenNow(restaurant.is_open_now);
        setCategories(restaurant.categories.length
          ? restaurant.categories.map((category) => ({
            name: category.name,
            nameEn: category.name_en ?? "",
            items: (category.items ?? []).length
              ? (category.items ?? []).map((item) => ({
                name: item.name_ar,
                nameEn: item.name_en ?? "",
                description: item.description_ar ?? "",
                descriptionEn: item.description_en ?? "",
                price: String(item.price),
                image: item.image_url ?? "",
                tags: item.tags.join(", "),
                isAvailable: item.is_available,
                mealType: item.meal_type ?? "أخرى",
              }))
              : [blankItem()],
          }))
          : [blankCategory()]);
        setBranches(restaurant.branches?.length
          ? restaurant.branches.map((branch) => ({
            branchName: branch.branch_name_ar,
            branchNameEn: branch.branch_name_en ?? "",
            cityId: branch.areas?.city_id ?? "",
            areaId: branch.area_id,
            address: branch.address_ar ?? "",
            addressEn: branch.address_en ?? "",
            latitude: branch.latitude == null ? "" : String(branch.latitude),
            longitude: branch.longitude == null ? "" : String(branch.longitude),
            googleMapsUrl: branch.google_maps_url ?? "",
            phone: branch.phone ?? "",
            whatsapp: branch.whatsapp ?? "",
            workingHours: typeof branch.working_hours === "object" && branch.working_hours !== null && !Array.isArray(branch.working_hours)
              ? branch.working_hours as WorkingHours
              : {},
            isOpen: branch.is_open,
          }))
          : [blankBranch()]);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "تعذر تحميل بيانات المطعم.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRestaurant(false);
      });

    return () => controller.abort();
  }, [restaurantId]);

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

  function updateBranch(index: number, key: keyof AdminBranch, value: string | boolean) {
    setBranches((current) => current.map((branch, i) => i === index ? { ...branch, [key]: value } : branch));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const latitude = form.latitude.trim() ? Number(form.latitude) : null;
    const longitude = form.longitude.trim() ? Number(form.longitude) : null;
    const invalidBranch = branches.some((branch) =>
      !branch.cityId ||
      !branch.areaId ||
      !branch.branchName.trim() ||
      (branch.latitude.trim() !== "" && !Number.isFinite(Number(branch.latitude))) ||
      (branch.longitude.trim() !== "" && !Number.isFinite(Number(branch.longitude))) ||
      (branch.latitude.trim() === "") !== (branch.longitude.trim() === "")
    );
    if (invalidBranch) {
      setError("أكمل بيانات كل فرع واختر المدينة والمنطقة وأدخل خط العرض والطول معاً.");
      setLoading(false);
      return;
    }
    if (
      (latitude === null) !== (longitude === null) ||
      (latitude !== null && (!Number.isFinite(latitude) || Math.abs(latitude) > 90)) ||
      (longitude !== null && (!Number.isFinite(longitude) || Math.abs(longitude) > 180))
    ) {
      setError("أدخل خط العرض والطول معاً، وتأكد أن خط العرض بين -90 و90 وخط الطول بين -180 و180.");
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      priceLevel: Number(form.priceLevel),
      serviceTypes,
      latitude,
      longitude,
      googleMapsUrl: form.googleMapsUrl.trim(),
      phones,
      whatsapp: form.whatsapp,
      workingHours: hours,
      isOpenNow,
      branches: branches.map((branch) => ({
        ...branch,
        latitude: branch.latitude.trim() ? Number(branch.latitude) : null,
        longitude: branch.longitude.trim() ? Number(branch.longitude) : null,
      })),
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
        method: restaurantId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...(restaurantId ? { restaurantId } : {}) }),
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
      if (restaurantId) {
        onSaved?.();
      } else {
        setMessage(`تم نشر المطعم بنجاح: /${result.slug}`);
      }
    } catch (requestError) {
      setError(requestError instanceof Error
        ? `تعذر إكمال الطلب: ${requestError.message}`
        : "تعذر إكمال الطلب بسبب خطأ غير معروف.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-9 sm:px-6 sm:pt-12" dir="rtl">
      <header className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-l from-slate-800/90 to-slate-900/70 p-6 sm:p-8">
        <p className="text-sm font-bold text-amber-300">مساحة العمل <span className="mx-1 text-slate-600">/</span> {restaurantId ? "تعديل مطعم" : "إضافة مطعم"}</p>
        <h1 className="mt-3 text-3xl font-bold">{restaurantId ? "تعديل بيانات المطعم" : "إضافة مطعم جديد"}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-300">{restaurantId ? "عدّل بيانات المطعم والمنيو ثم احفظ التغييرات." : "أدخل بيانات المطعم والمنيو ثم انشرها مباشرة."}</p>
        <p className="mt-3 text-xs leading-6 text-slate-400">حقول العربي والإنجليزي منفصلة. على الهاتف قد يقترح المتصفح لوحة المفاتيح المناسبة لكل حقل.</p>
      </header>

      <form onSubmit={submit} className="space-y-6">
        {loadingRestaurant && <p role="status" className="text-sm text-slate-300">جارٍ تحميل بيانات المطعم...</p>}
        <section className="rounded-3xl border border-white/10 bg-slate-800/70 p-5 shadow-lg shadow-black/10 sm:p-7">
          <h2 className="flex items-center gap-3 text-xl font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/10 text-amber-300">١</span>بيانات المطعم</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="اسم المطعم بالعربي" value={form.name} onChange={(v) => update("name", v)} required />
            <Field label="اسم المطعم بالإنجليزي" value={form.nameEn} onChange={(v) => update("nameEn", v)} language="en" />
            <Field
              label="Slug فريد للرابط"
              value={form.slug}
              onChange={(v) => update("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
              placeholder="مثال: amman-grill"
              dir="ltr"
              language="en"
            />
            <Field label="التصنيف / المطبخ بالعربي" value={form.cuisine} onChange={(v) => update("cuisine", v)} required />
            <Field label="التصنيف / المطبخ بالإنجليزي" value={form.cuisineEn} onChange={(v) => update("cuisineEn", v)} language="en" />
            <Field label="المنطقة / العنوان بالعربي" value={form.location} onChange={(v) => update("location", v)} required />
            <Field label="العنوان بالإنجليزي" value={form.locationEn} onChange={(v) => update("locationEn", v)} language="en" />
            <Field label="رابط الموقع على خرائط Google" value={form.googleMapsUrl} onChange={(v) => update("googleMapsUrl", v)} type="url" dir="ltr" language="en" placeholder="https://maps.google.com/..." />
            <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
              <Field label="خط العرض (Latitude)" value={form.latitude} onChange={(v) => update("latitude", v)} type="number" step="any" min="-90" max="90" dir="ltr" language="en" />
              <Field label="خط الطول (Longitude)" value={form.longitude} onChange={(v) => update("longitude", v)} type="number" step="any" min="-180" max="180" dir="ltr" language="en" />
            </div>
            <p className="text-xs leading-6 text-slate-400 sm:col-span-2">أدخل الإحداثيات معاً لتحديد دبوس المطعم على الخريطة؛ يمكنك نسخها من Google Maps.</p>
            <label className={labelClass}>
              مستوى السعر
              <select value={form.priceLevel} onChange={(event) => update("priceLevel", event.target.value)} className={fieldClass}>
                <option value="1">$ — اقتصادي</option><option value="2">$$ — متوسط</option><option value="3">$$$ — مرتفع</option>
              </select>
            </label>
            <fieldset className="rounded-xl border border-white/10 p-4">
              <legend className="px-2 text-sm font-medium text-slate-200">أنواع الخدمة</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                {serviceOptions.map((service) => (
                  <label key={service.value} className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={serviceTypes.includes(service.value)}
                      onChange={(event) => setServiceTypes((current) =>
                        event.target.checked
                          ? [...current, service.value]
                          : current.filter((value) => value !== service.value),
                      )}
                      className="h-4 w-4 accent-amber-400"
                    />
                    {service.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="رابط إنستغرام" value={form.instagramUrl} onChange={(v) => update("instagramUrl", v)} type="url" dir="ltr" language="en" placeholder="https://instagram.com/..." />
            <Field label="رابط فيسبوك" value={form.facebookUrl} onChange={(v) => update("facebookUrl", v)} type="url" dir="ltr" language="en" placeholder="https://facebook.com/..." />
            <Field label="رابط تيك توك" value={form.tiktokUrl} onChange={(v) => update("tiktokUrl", v)} type="url" dir="ltr" language="en" placeholder="https://tiktok.com/@..." />
            <ImageUpload
              label="صورة الغلاف"
              value={form.coverImage}
              onChange={(v) => update("coverImage", v)}
              onUploadingChange={(uploading) => setUploadingImages((count) => count + (uploading ? 1 : -1))}
            />
            <ImageUpload
              label="شعار المطعم"
              value={form.logo}
              onChange={(v) => update("logo", v)}
              onUploadingChange={(uploading) => setUploadingImages((count) => count + (uploading ? 1 : -1))}
            />
            <label className={`${labelClass} sm:col-span-2`}>
              وصف مختصر
              <textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                lang="ar"
                dir="rtl"
                rows={3}
                maxLength={500}
                className={fieldClass}
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-800/70 p-5 shadow-lg shadow-black/10 sm:p-7">
          <h2 className="flex items-center gap-3 text-xl font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">٢</span>الاتصال وساعات العمل</h2>
          <div className="mt-5 space-y-3">
            {phones.map((phone, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <Field label={`رقم الهاتف ${index + 1}`} value={phone} onChange={(value) => setPhones((current) => current.map((item, i) => i === index ? value : item))} dir="ltr" language="en" />
                </div>
                {phones.length > 1 && (
                  <button type="button" onClick={() => setPhones((current) => current.filter((_, i) => i !== index))} className="rounded-xl border border-white/10 px-4 py-3 text-sm">حذف</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setPhones((current) => [...current, ""])} className="text-sm font-bold text-amber-400">+ إضافة رقم هاتف</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="واتساب الطلبات المباشر" value={form.whatsapp} onChange={(v) => update("whatsapp", v)} dir="ltr" language="en" />
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

        <section className="rounded-3xl border border-white/10 bg-slate-800/70 p-5 shadow-lg shadow-black/10 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 text-xl font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-400/10 text-violet-200">٣</span>الفروع والمواقع</h2>
            <button type="button" onClick={() => setBranches((current) => [...current, blankBranch()])} className="rounded-xl border border-violet-400/40 px-4 py-2 text-sm font-bold text-violet-200">+ إضافة فرع</button>
          </div>
          <div className="mt-5 space-y-4">
            {branches.map((branch, branchIndex) => (
              <fieldset key={branchIndex} className="rounded-xl border border-white/10 p-4">
                <legend className="px-2 font-bold">فرع {branchIndex + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="اسم الفرع بالعربي" value={branch.branchName} onChange={(v) => updateBranch(branchIndex, "branchName", v)} required />
                  <Field label="اسم الفرع بالإنجليزي" value={branch.branchNameEn} onChange={(v) => updateBranch(branchIndex, "branchNameEn", v)} language="en" />
                  <label className={labelClass}>
                    المدينة
                    <select
                      value={branch.cityId}
                      onChange={(event) => {
                        const cityId = event.target.value;
                        setBranches((current) => current.map((item, i) => i === branchIndex ? { ...item, cityId, areaId: "" } : item));
                      }}
                      className={fieldClass}
                      required
                    >
                      <option value="">اختر المدينة</option>
                      {cities.map((city) => <option key={city.id} value={city.id}>{city.name_ar}</option>)}
                    </select>
                  </label>
                  <label className={labelClass}>
                    المنطقة
                    <select
                      value={branch.areaId}
                      onChange={(event) => updateBranch(branchIndex, "areaId", event.target.value)}
                      className={fieldClass}
                      required
                    >
                      <option value="">اختر المنطقة</option>
                      {areas.filter((area) => area.city_id === branch.cityId).map((area) => <option key={area.id} value={area.id}>{area.name_ar}</option>)}
                    </select>
                  </label>
                  <Field label="عنوان الفرع بالعربي" value={branch.address} onChange={(v) => updateBranch(branchIndex, "address", v)} required />
                  <Field label="عنوان الفرع بالإنجليزي" value={branch.addressEn} onChange={(v) => updateBranch(branchIndex, "addressEn", v)} language="en" />
                  <Field label="خط العرض" value={branch.latitude} onChange={(v) => updateBranch(branchIndex, "latitude", v)} type="number" step="any" dir="ltr" language="en" />
                  <Field label="خط الطول" value={branch.longitude} onChange={(v) => updateBranch(branchIndex, "longitude", v)} type="number" step="any" dir="ltr" language="en" />
                  <Field label="رابط خرائط Google" value={branch.googleMapsUrl} onChange={(v) => updateBranch(branchIndex, "googleMapsUrl", v)} type="url" dir="ltr" language="en" />
                  <Field label="هاتف الفرع" value={branch.phone} onChange={(v) => updateBranch(branchIndex, "phone", v)} dir="ltr" language="en" />
                  <Field label="واتساب الفرع" value={branch.whatsapp} onChange={(v) => updateBranch(branchIndex, "whatsapp", v)} dir="ltr" language="en" />
                  <label className="flex items-center gap-3 self-end rounded-xl bg-slate-900 px-4 py-4 text-sm">
                    <input type="checkbox" checked={branch.isOpen} onChange={(event) => updateBranch(branchIndex, "isOpen", event.target.checked)} className="h-4 w-4 accent-amber-400" />
                    الفرع مفتوح
                  </label>
                </div>
                {branches.length > 1 && <button type="button" onClick={() => setBranches((current) => current.filter((_, i) => i !== branchIndex))} className="mt-4 text-sm text-red-300">حذف الفرع</button>}
              </fieldset>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-800/70 p-5 shadow-lg shadow-black/10 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-3 text-xl font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/10 text-emerald-200">٣</span>أقسام وأصناف المنيو</h2>
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
                  <Field label="اسم القسم بالإنجليزي" value={category.nameEn} onChange={(v) => updateCategory(categoryIndex, "nameEn", v)} language="en" />
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
                        <Field label="اسم الصنف بالعربي" value={item.name} onChange={(v) => updateItem(categoryIndex, itemIndex, "name", v)} required />
                        <Field label="اسم الصنف بالإنجليزي" value={item.nameEn} onChange={(v) => updateItem(categoryIndex, itemIndex, "nameEn", v)} language="en" />
                        <Field label="السعر (JOD)" value={item.price} onChange={(v) => updateItem(categoryIndex, itemIndex, "price", v)} type="number" step="0.01" min="0" required dir="ltr" language="en" />
                        <label className={labelClass}>
                          نوع الوجبة الموحد
                          <select
                            value={item.mealType}
                            onChange={(event) => updateItem(categoryIndex, itemIndex, "mealType", event.target.value)}
                            className={fieldClass}
                          >
                            {mealTypes.map((mealType) => (
                              <option key={mealType} value={mealType}>{mealType}</option>
                            ))}
                          </select>
                        </label>
                        <ImageUpload
                          label="صورة الصنف"
                          value={item.image}
                          onChange={(v) => updateItem(categoryIndex, itemIndex, "image", v)}
                          onUploadingChange={(uploading) => setUploadingImages((count) => count + (uploading ? 1 : -1))}
                        />
                        <Field label="وسوم، افصل بينها بفاصلة" value={item.tags} onChange={(v) => updateItem(categoryIndex, itemIndex, "tags", v)} placeholder="حار، الأكثر طلباً" />
                        <div className="sm:col-span-2">
                          <label htmlFor={`item-description-${categoryIndex}-${itemIndex}`} className={labelClass}>وصف الصنف بالعربي</label>
                          <textarea
                            id={`item-description-${categoryIndex}-${itemIndex}`}
                            value={item.description}
                            onChange={(event) => updateItem(categoryIndex, itemIndex, "description", event.target.value)}
                            lang="ar"
                            dir="rtl"
                            rows={2}
                            className={fieldClass}
                          />
                          <label htmlFor={`item-description-en-${categoryIndex}-${itemIndex}`} className={`${labelClass} mt-4`}>وصف الصنف بالإنجليزي</label>
                          <textarea
                            id={`item-description-en-${categoryIndex}-${itemIndex}`}
                            value={item.descriptionEn}
                            onChange={(event) => updateItem(categoryIndex, itemIndex, "descriptionEn", event.target.value)}
                            lang="en"
                            dir="ltr"
                            rows={2}
                            className={fieldClass}
                          />
                        </div>
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
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {restaurantId && onCancel && (
            <button type="button" onClick={onCancel} disabled={loading} className="rounded-xl border border-white/15 px-5 py-4 font-bold text-slate-200 disabled:opacity-60">
              إلغاء التعديل
            </button>
          )}
          <button type="submit" disabled={loading || loadingRestaurant || uploadingImages > 0} className="w-full rounded-xl bg-amber-400 px-5 py-4 font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60">
            {loading ? (restaurantId ? "جارٍ حفظ التعديلات..." : "جارٍ الحفظ والنشر...") : (restaurantId ? "حفظ التعديلات" : "حفظ ونشر")}
          </button>
        </div>
      </form>
    </main>
  );
}

function ImageUpload({
  label,
  value,
  onChange,
  onUploadingChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    setUploading(true);
    onUploadingChange(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/restaurant-images", { method: "POST", body });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "تعذر رفع الصورة.");
      }
      onChange(result.url);
      setPreview("");
      URL.revokeObjectURL(localPreview);
    } catch (requestError) {
      setPreview("");
      URL.revokeObjectURL(localPreview);
      setError(requestError instanceof Error ? requestError.message : "تعذر رفع الصورة.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  return (
    <div className={labelClass}>
      {label}
      <input
        type="url"
        lang="en"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="رابط الصورة أو ارفعها من جهازك"
        dir="ltr"
        className={fieldClass}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-xl border border-amber-400/40 px-4 py-2 text-sm font-bold text-amber-300 hover:bg-amber-950/30">
          {uploading ? "جارٍ رفع الصورة..." : "اختيار صورة من الجهاز"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            disabled={uploading}
            onChange={(event) => {
              void upload(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
            className="sr-only"
          />
        </label>
        {(preview || value) && (
          <img
            src={preview || value}
            alt={`معاينة ${label}`}
            className="h-16 w-16 rounded-xl border border-white/10 bg-slate-900 object-cover"
          />
        )}
        {uploading && <span role="status" className="text-xs text-slate-400">يتم رفع الصورة...</span>}
      </div>
      <p className="mt-2 text-xs font-normal text-slate-400">الصيغ المدعومة PNG وJPG وWEBP وGIF وAVIF، بحد أقصى 5 ميغابايت.</p>
      {error && <p role="alert" className="mt-2 text-xs font-normal text-red-300">{error}</p>}
    </div>
  );
}
