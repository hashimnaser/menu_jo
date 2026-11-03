import { NextResponse, type NextRequest } from "next/server";
import type { Json } from "@/types/supabase";
import { ADMIN_COOKIE_NAME, isAdminConfigured, isValidAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type MenuItemInput = {
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
};

type CategoryInput = {
  name: string;
  nameEn: string;
  items: MenuItemInput[];
};

type RestaurantInput = {
  name: string;
  nameEn: string;
  slug: string;
  cuisine: string;
  cuisineEn: string;
  location: string;
  locationEn: string;
  description: string;
  priceLevel: number;
  coverImage: string;
  logo: string;
  phones: string[];
  whatsapp: string;
  workingHours: Json;
  isOpenNow: boolean;
  categories: CategoryInput[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSupabaseConfigurationError() {
  const missing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
    !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  return missing.length
    ? `إعدادات Supabase غير مكتملة على الخادم. أضف المتغيرات التالية إلى إعدادات البيئة: ${missing.join("، ")}.`
    : null;
}

function isHttpUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidInput(value: unknown): value is RestaurantInput {
  if (!isRecord(value)) return false;
  const requiredStrings = [
    "name", "nameEn", "slug", "cuisine", "cuisineEn", "location", "locationEn",
    "description", "coverImage", "logo", "whatsapp",
  ];
  if (requiredStrings.some((key) => typeof value[key] !== "string")) return false;

  const input = value as Record<string, unknown>;
  const slug = input.slug as string;
  const priceLevel = input.priceLevel;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return false;
  if (typeof priceLevel !== "number" || !Number.isInteger(priceLevel) || priceLevel < 1 || priceLevel > 3) return false;
  if (
    !isHttpUrl(input.coverImage as string) ||
    !isHttpUrl(input.logo as string) ||
    typeof input.isOpenNow !== "boolean" ||
    !Array.isArray(input.phones) ||
    !input.phones.every((phone) => typeof phone === "string" && phone.length <= 40) ||
    !isRecord(input.workingHours) ||
    !Array.isArray(input.categories) ||
    input.categories.length === 0
  ) return false;

  for (const [day, hours] of Object.entries(input.workingHours)) {
    if (
      !["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].includes(day) ||
      !isRecord(hours) ||
      typeof hours.open !== "string" ||
      typeof hours.close !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.open) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.close)
    ) return false;
  }

  const categoryNames = new Set<string>();
  for (const category of input.categories) {
    if (
      !isRecord(category) ||
      typeof category.name !== "string" ||
      !category.name.trim() ||
      typeof category.nameEn !== "string" ||
      !Array.isArray(category.items) ||
      category.items.length === 0
    ) return false;
    if (categoryNames.has(category.name.trim())) return false;
    categoryNames.add(category.name.trim());

    for (const item of category.items) {
      if (
        !isRecord(item) ||
        typeof item.name !== "string" ||
        !item.name.trim() ||
        typeof item.description !== "string" ||
        typeof item.price !== "number" ||
        !Number.isFinite(item.price) ||
        item.price < 0 ||
        typeof item.image !== "string" ||
        !isHttpUrl(item.image) ||
        !Array.isArray(item.tags) ||
        !item.tags.every((tag) => typeof tag === "string" && tag.length <= 40)
      ) return false;
    }
  }
  return true;
}

export async function GET(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "إعدادات دخول الأدمن غير مكتملة على الخادم." }, { status: 503 });
  }
  if (!isValidAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "يلزم تسجيل دخول الأدمن." }, { status: 401 });
  }
  const configurationError = getSupabaseConfigurationError();
  if (configurationError) {
    return NextResponse.json({ error: configurationError }, { status: 503 });
  }

  const { data: restaurants, error } = await createAdminClient()
    .from("restaurants")
    .select("id, name, name_en, slug")
    .order("name");

  if (error) {
    return NextResponse.json({ error: `تعذر تحميل قائمة المطاعم: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ restaurants });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "إعدادات دخول الأدمن غير مكتملة على الخادم." }, { status: 503 });
  }
  if (!isValidAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "يلزم تسجيل دخول الأدمن." }, { status: 401 });
  }
  const configurationError = getSupabaseConfigurationError();
  if (configurationError) {
    return NextResponse.json({ error: configurationError }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    typeof body.restaurantId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.restaurantId)
  ) {
    return NextResponse.json({ error: "معرّف المطعم غير صالح." }, { status: 400 });
  }

  const { data: restaurant, error } = await createAdminClient()
    .from("restaurants")
    .delete()
    .eq("id", body.restaurantId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: `تعذر حذف المطعم: ${error.message}` }, { status: 500 });
  }
  if (!restaurant) {
    return NextResponse.json({ error: "المطعم غير موجود أو تم حذفه مسبقاً." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

async function createRestaurant(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "إعدادات دخول الأدمن غير مكتملة على الخادم." }, { status: 503 });
  }
  if (!isValidAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "يلزم تسجيل دخول الأدمن." }, { status: 401 });
  }
  const configurationError = getSupabaseConfigurationError();
  if (configurationError) {
    return NextResponse.json({ error: configurationError }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }

  if (!isValidInput(body)) {
    return NextResponse.json({ error: "تحقق من الحقول وأصناف المنيو ثم حاول مجدداً." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .insert({
      name: body.name.trim(),
      name_en: body.nameEn.trim() || null,
      slug: body.slug,
      description: body.description.trim() || null,
      logo: body.logo.trim() || null,
      cover_image: body.coverImage.trim() || null,
      cuisine: body.cuisine.trim() || null,
      cuisine_en: body.cuisineEn.trim() || null,
      location: body.location.trim() || null,
      location_en: body.locationEn.trim() || null,
      price_level: body.priceLevel,
      phone: body.phones.map((phone) => phone.trim()).filter(Boolean).join(", ") || null,
      whatsapp: body.whatsapp.trim() || null,
      working_hours: body.workingHours,
      is_open_now: body.isOpenNow,
    })
    .select("id")
    .single();

  if (restaurantError) {
    return NextResponse.json({ error: `تعذر حفظ المطعم: ${restaurantError.message}` }, { status: 400 });
  }

  const rollbackRestaurant = async () => {
    const { error } = await supabase.from("restaurants").delete().eq("id", restaurant.id);
    if (error) console.error("Failed to roll back partially published restaurant:", error.message);
  };

  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .insert(body.categories.map((category) => ({
      name: category.name.trim(),
      name_en: category.nameEn.trim() || null,
      restaurant_id: restaurant.id,
    })))
    .select("id, name");

  if (categoryError || !categories) {
    await rollbackRestaurant();
    return NextResponse.json(
      { error: `تعذر حفظ أقسام المنيو${categoryError ? `: ${categoryError.message}` : "."}` },
      { status: 400 },
    );
  }

  const categoryIds = new Map(categories.map((category) => [category.name, category.id]));
  const menuItems = body.categories.flatMap((category) =>
    category.items.map((item) => ({
      name: item.name.trim(),
      description: item.description.trim() || null,
      price: item.price,
      image: item.image.trim() || null,
      tags: item.tags.map((tag) => tag.trim()).filter(Boolean),
      category_id: categoryIds.get(category.name.trim())!,
    })),
  );
  const { error: menuError } = await supabase.from("menu_items").insert(menuItems);

  if (menuError) {
    await rollbackRestaurant();
    return NextResponse.json({ error: `تعذر حفظ أصناف المنيو: ${menuError.message}` }, { status: 400 });
  }

  return NextResponse.json({ success: true, slug: body.slug }, { status: 201 });
}

export async function POST(request: NextRequest) {
  try {
    return await createRestaurant(request);
  } catch (error) {
    const details = error instanceof Error ? error.message : "خطأ غير معروف.";
    console.error("Admin restaurant publishing failed:", error);
    return NextResponse.json({ error: `تعذر إكمال حفظ المطعم: ${details}` }, { status: 500 });
  }
}
