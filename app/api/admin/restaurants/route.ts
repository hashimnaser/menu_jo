import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import type { Json } from "@/types/supabase";
import { ADMIN_COOKIE_NAME, isAdminConfigured, isValidAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type MenuItemInput = {
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  price: number;
  image: string;
  tags: string[];
  isAvailable?: boolean;
  mealType: string;
};
type BranchInput = {
  branchName: string;
  branchNameEn?: string;
  cityId: string;
  areaId: string;
  address: string;
  addressEn?: string;
  googleMapsUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  whatsapp?: string;
  workingHours: Json;
  isOpen: boolean;
};

type CategoryInput = {
  name: string;
  nameEn: string;
  items: MenuItemInput[];
};

type RestaurantInput = {
  restaurantId?: string;
  name: string;
  nameEn: string;
  slug: string;
  cuisine: string;
  cuisineEn: string;
  location: string;
  locationEn: string;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string;
  description: string;
  priceLevel: number;
  serviceTypes: string[];
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  coverImage: string;
  logo: string;
  phones: string[];
  whatsapp: string;
  workingHours: Json;
  isOpenNow: boolean;
  categories: CategoryInput[];
  branches: BranchInput[];
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

function isGoogleMapsUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "google.com" ||
        url.hostname.endsWith(".google.com") ||
        url.hostname === "maps.app.goo.gl");
  } catch {
    return false;
  }
}

function isSocialUrl(value: string, domain: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function isValidCoordinates(latitude: unknown, longitude: unknown) {
  const hasLatitude = latitude !== undefined && latitude !== null;
  const hasLongitude = longitude !== undefined && longitude !== null;
  if (hasLatitude !== hasLongitude) return false;
  if (!hasLatitude) return true;

  return typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180;
}

function isValidInput(value: unknown): value is RestaurantInput {
  if (!isRecord(value)) return false;
  const requiredStrings = [
    "name", "nameEn", "slug", "cuisine", "cuisineEn", "location", "locationEn",
    "description", "coverImage", "logo", "whatsapp",
    "instagramUrl", "facebookUrl", "tiktokUrl",
  ];
  if (requiredStrings.some((key) => typeof value[key] !== "string")) return false;

  const input = value as Record<string, unknown>;
  const slug = input.slug as string;
  if (
    input.restaurantId !== undefined &&
    (typeof input.restaurantId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.restaurantId))
  ) return false;
  const priceLevel = input.priceLevel;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return false;
  if (typeof priceLevel !== "number" || !Number.isInteger(priceLevel) || priceLevel < 1 || priceLevel > 3) return false;
  if (
    !isValidCoordinates(input.latitude, input.longitude) ||
    (input.googleMapsUrl !== undefined &&
      (typeof input.googleMapsUrl !== "string" || !isGoogleMapsUrl(input.googleMapsUrl))) ||
    !isHttpUrl(input.coverImage as string) ||
    !isHttpUrl(input.logo as string) ||
    typeof input.isOpenNow !== "boolean" ||
    !Array.isArray(input.phones) ||
    !input.phones.every((phone) => typeof phone === "string" && phone.length <= 40) ||
    !isRecord(input.workingHours) ||
    !Array.isArray(input.categories) ||
    input.categories.length === 0 ||
    !Array.isArray(input.branches) ||
    input.branches.length === 0 ||
    !Array.isArray(input.serviceTypes) ||
    input.serviceTypes.length === 0 ||
    !input.serviceTypes.every((service) => ["dine_in", "takeaway", "delivery"].includes(String(service))) ||
    !isSocialUrl(input.instagramUrl as string, "instagram.com") ||
    !isSocialUrl(input.facebookUrl as string, "facebook.com") ||
    !isSocialUrl(input.tiktokUrl as string, "tiktok.com")
  ) return false;

  for (const branch of input.branches) {
    if (
      !isRecord(branch) ||
      typeof branch.branchName !== "string" ||
      !branch.branchName.trim() ||
      typeof branch.cityId !== "string" ||
      typeof branch.areaId !== "string" ||
      typeof branch.address !== "string" ||
      typeof branch.isOpen !== "boolean" ||
      !isRecord(branch.workingHours)
    ) return false;
  }

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

    const itemNames = new Set<string>();
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
        typeof item.mealType !== "string" ||
        ![
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
        ].includes(item.mealType) ||
        !Array.isArray(item.tags) ||
        !item.tags.every((tag) => typeof tag === "string" && tag.length <= 40) ||
        (item.nameEn !== undefined && typeof item.nameEn !== "string") ||
        (item.descriptionEn !== undefined && typeof item.descriptionEn !== "string") ||
        (item.isAvailable !== undefined && typeof item.isAvailable !== "boolean")
      ) return false;
      if (itemNames.has(item.name.trim())) return false;
      itemNames.add(item.name.trim());
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

  const supabase = createAdminClient();
  if (request.nextUrl.searchParams.get("options") === "1") {
    const [citiesResult, areasResult] = await Promise.all([
      supabase.from("cities").select("id,name_ar,name_en,slug").order("name_ar"),
      supabase.from("areas").select("id,city_id,name_ar,name_en,slug").order("name_ar"),
    ]);
    if (citiesResult.error || areasResult.error) {
      return NextResponse.json({
        error: `تعذر تحميل المدن والمناطق: ${citiesResult.error?.message ?? areasResult.error?.message}`,
      }, { status: 500 });
    }
    return NextResponse.json({ cities: citiesResult.data ?? [], areas: areasResult.data ?? [] });
  }
  const restaurantId = request.nextUrl.searchParams.get("id");
  if (restaurantId) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantId)) {
      return NextResponse.json({ error: "معرّف المطعم غير صالح." }, { status: 400 });
    }

    const [{ data: restaurant, error }, enhancementsResult] = await Promise.all([
      supabase
      .from("restaurants")
      .select("id,name,name_ar,name_en,slug,description,logo,logo_url,cover_image,cover_url,cuisine,cuisine_en,location,location_en,latitude,longitude,google_maps_url,price_level,phone,whatsapp,working_hours,is_open_now,categories(id,name,name_en,sort_order,items(id,name_ar,name_en,description_ar,description_en,price,image_url,tags,meal_type,is_available)),branches(id,area_id,branch_name_ar,branch_name_en,address_ar,address_en,google_maps_url,latitude,longitude,phone,whatsapp,working_hours,is_open,areas(id,city_id,name_ar,name_en,slug))")
      .eq("id", restaurantId)
      .maybeSingle(),
      supabase.from("restaurants")
        .select("service_types,instagram_url,facebook_url,tiktok_url")
        .eq("id", restaurantId)
        .maybeSingle(),
    ]);

    if (error) {
      return NextResponse.json({ error: `تعذر تحميل بيانات المطعم: ${error.message}` }, { status: 500 });
    }
    if (!restaurant) {
      return NextResponse.json({ error: "المطعم غير موجود." }, { status: 404 });
    }
    const enhancementColumnsUnavailable =
      enhancementsResult.error?.code === "42703" &&
      /service_types|instagram_url|facebook_url|tiktok_url/.test(enhancementsResult.error.message);
    if (enhancementsResult.error && !enhancementColumnsUnavailable) {
      return NextResponse.json({ error: `تعذر تحميل بيانات التواصل والخدمات: ${enhancementsResult.error.message}` }, { status: 500 });
    }
    return NextResponse.json({
      restaurant: {
        ...restaurant,
        service_types: enhancementsResult.data?.service_types ?? ["dine_in", "takeaway", "delivery"],
        instagram_url: enhancementsResult.data?.instagram_url ?? null,
        facebook_url: enhancementsResult.data?.facebook_url ?? null,
        tiktok_url: enhancementsResult.data?.tiktok_url ?? null,
      },
    });
  }

  const { data: restaurants, error } = await supabase
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

  if (body.restaurantId) {
    return updateRestaurant(body, createAdminClient());
  }

  const supabase = createAdminClient();
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .insert({
      name: body.name.trim(),
      name_ar: body.name.trim(),
      name_en: body.nameEn.trim() || null,
      slug: body.slug,
      description: body.description.trim() || null,
      logo: body.logo.trim() || null,
      logo_url: body.logo.trim() || null,
      cover_image: body.coverImage.trim() || null,
      cover_url: body.coverImage.trim() || null,
      cuisine: body.cuisine.trim() || null,
      cuisine_en: body.cuisineEn.trim() || null,
      location: body.location.trim() || null,
      location_en: body.locationEn.trim() || null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      google_maps_url: body.googleMapsUrl?.trim() || null,
      price_level: body.priceLevel,
      service_types: body.serviceTypes,
      instagram_url: body.instagramUrl.trim() || null,
      facebook_url: body.facebookUrl.trim() || null,
      tiktok_url: body.tiktokUrl.trim() || null,
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

  const { error: branchError } = await supabase.from("branches").insert(
    body.branches.map((branch) => ({
      restaurant_id: restaurant.id,
      area_id: branch.areaId,
      branch_name_ar: branch.branchName.trim(),
      branch_name_en: branch.branchNameEn?.trim() || null,
      address_ar: branch.address.trim() || null,
      address_en: branch.addressEn?.trim() || null,
      google_maps_url: branch.googleMapsUrl?.trim() || null,
      latitude: branch.latitude ?? null,
      longitude: branch.longitude ?? null,
      phone: branch.phone?.trim() || null,
      whatsapp: branch.whatsapp?.trim() || null,
      working_hours: branch.workingHours,
      is_open: branch.isOpen,
    })),
  );
  if (branchError) {
    await rollbackRestaurant();
    return NextResponse.json({ error: `تعذر حفظ الفروع: ${branchError.message}` }, { status: 400 });
  }

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
      name_en: item.nameEn?.trim() || null,
      description: item.description.trim() || null,
      description_en: item.descriptionEn?.trim() || null,
      price: item.price,
      image: item.image.trim() || null,
      tags: item.tags.map((tag) => tag.trim()).filter(Boolean),
      is_available: item.isAvailable ?? true,
      category_id: categoryIds.get(category.name.trim())!,
    })),
  );
  const { error: menuError } = await supabase.from("menu_items").insert(menuItems);

  if (menuError) {
    await rollbackRestaurant();
    return NextResponse.json({ error: `تعذر حفظ أصناف المنيو: ${menuError.message}` }, { status: 400 });
  }

  const hierarchicalItems = body.categories.flatMap((category) =>
    category.items.map((item) => ({
      name_ar: item.name.trim(),
      name_en: item.nameEn?.trim() || null,
      description_ar: item.description.trim() || null,
      description_en: item.descriptionEn?.trim() || null,
      price: item.price,
      image_url: item.image.trim() || null,
      tags: item.tags.map((tag) => tag.trim()).filter(Boolean),
      is_available: item.isAvailable ?? true,
      meal_type: item.mealType,
      category_id: categoryIds.get(category.name.trim())!,
    })),
  );
  const { error: hierarchicalMenuError } = await supabase.from("items").insert(hierarchicalItems);
  if (hierarchicalMenuError) {
    await rollbackRestaurant();
    return NextResponse.json({ error: `تعذر حفظ الأصناف الموحدة: ${hierarchicalMenuError.message}` }, { status: 400 });
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

async function updateRestaurant(body: RestaurantInput, supabase: ReturnType<typeof createAdminClient>) {
    const restaurantId = body.restaurantId!;
    const { data: oldCategories, error: oldCategoriesError } = await supabase
      .from("categories")
      .select("id")
      .eq("restaurant_id", restaurantId);

    if (oldCategoriesError) {
      return NextResponse.json({ error: `تعذر تحميل أقسام المطعم الحالية: ${oldCategoriesError.message}` }, { status: 500 });
    }

    const stagedNames = body.categories.map((_, index) => `__menu_pending_${randomUUID()}_${index}`);
    const { data: stagedCategories, error: categoryError } = await supabase
      .from("categories")
      .insert(body.categories.map((category, index) => ({
        name: stagedNames[index],
        name_en: category.nameEn.trim() || null,
        restaurant_id: restaurantId,
      })))
      .select("id");

    if (categoryError || !stagedCategories) {
      return NextResponse.json(
        { error: `تعذر تجهيز أقسام المنيو للتعديل${categoryError ? `: ${categoryError.message}` : "."}` },
        { status: 400 },
      );
    }

    const removeStagedCategories = async () => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .in("id", stagedCategories.map((category) => category.id));
      if (error) console.error("Failed to remove staged restaurant categories:", error.message);
    };

    const menuItems = body.categories.flatMap((category, categoryIndex) =>
      category.items.map((item) => ({
        name: item.name.trim(),
        name_en: item.nameEn?.trim() || null,
        description: item.description.trim() || null,
        description_en: item.descriptionEn?.trim() || null,
        price: item.price,
        image: item.image.trim() || null,
        tags: item.tags.map((tag) => tag.trim()).filter(Boolean),
        is_available: item.isAvailable ?? true,
        meal_type: item.mealType,
        category_id: stagedCategories[categoryIndex].id,
      })),
    );
    const { error: menuError } = await supabase.from("menu_items").insert(menuItems);

    if (menuError) {
      await removeStagedCategories();
      return NextResponse.json({ error: `تعذر حفظ أصناف المنيو: ${menuError.message}` }, { status: 400 });
    }

    const hierarchicalItems = body.categories.flatMap((category, categoryIndex) =>
      category.items.map((item) => ({
        name_ar: item.name.trim(),
        name_en: item.nameEn?.trim() || null,
        description_ar: item.description.trim() || null,
        description_en: item.descriptionEn?.trim() || null,
        price: item.price,
        image_url: item.image.trim() || null,
        tags: item.tags.map((tag) => tag.trim()).filter(Boolean),
        is_available: item.isAvailable ?? true,
        meal_type: item.mealType,
        category_id: stagedCategories[categoryIndex].id,
      })),
    );
    const { error: hierarchicalMenuError } = await supabase.from("items").insert(hierarchicalItems);
    if (hierarchicalMenuError) {
      await removeStagedCategories();
      return NextResponse.json({ error: `تعذر حفظ الأصناف الموحدة: ${hierarchicalMenuError.message}` }, { status: 400 });
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .update({
        name: body.name.trim(),
        name_ar: body.name.trim(),
        name_en: body.nameEn.trim() || null,
        slug: body.slug,
        description: body.description.trim() || null,
        logo: body.logo.trim() || null,
        logo_url: body.logo.trim() || null,
        cover_image: body.coverImage.trim() || null,
        cover_url: body.coverImage.trim() || null,
        cuisine: body.cuisine.trim() || null,
        cuisine_en: body.cuisineEn.trim() || null,
        location: body.location.trim() || null,
        location_en: body.locationEn.trim() || null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        google_maps_url: body.googleMapsUrl?.trim() || null,
        price_level: body.priceLevel,
        service_types: body.serviceTypes,
        instagram_url: body.instagramUrl.trim() || null,
        facebook_url: body.facebookUrl.trim() || null,
        tiktok_url: body.tiktokUrl.trim() || null,
        phone: body.phones.map((phone) => phone.trim()).filter(Boolean).join(", ") || null,
        whatsapp: body.whatsapp.trim() || null,
        working_hours: body.workingHours,
        is_open_now: body.isOpenNow,
      })
      .eq("id", restaurantId)
      .select("id")
      .maybeSingle();

    if (restaurantError || !restaurant) {
      await removeStagedCategories();
      return NextResponse.json(
        { error: restaurantError ? `تعذر تحديث المطعم: ${restaurantError.message}` : "المطعم غير موجود." },
        { status: restaurantError ? 400 : 404 },
      );
    }

    await supabase.from("branches").delete().eq("restaurant_id", restaurantId);
    const { error: branchError } = await supabase.from("branches").insert(
      body.branches.map((branch) => ({
        restaurant_id: restaurantId,
        area_id: branch.areaId,
        branch_name_ar: branch.branchName.trim(),
        branch_name_en: branch.branchNameEn?.trim() || null,
        address_ar: branch.address.trim() || null,
        address_en: branch.addressEn?.trim() || null,
        google_maps_url: branch.googleMapsUrl?.trim() || null,
        latitude: branch.latitude ?? null,
        longitude: branch.longitude ?? null,
        phone: branch.phone?.trim() || null,
        whatsapp: branch.whatsapp?.trim() || null,
        working_hours: branch.workingHours,
        is_open: branch.isOpen,
      })),
    );
    if (branchError) {
      await removeStagedCategories();
      return NextResponse.json({ error: `تعذر تحديث الفروع: ${branchError.message}` }, { status: 500 });
    }

    const oldCategoryIds = (oldCategories ?? []).map((category) => category.id);
    if (oldCategoryIds.length) {
      const { error: deleteError } = await supabase.from("categories").delete().in("id", oldCategoryIds);
      if (deleteError) {
        await removeStagedCategories();
        return NextResponse.json({ error: `تعذر استبدال أقسام المنيو: ${deleteError.message}` }, { status: 500 });
      }
    }

    for (const [index, category] of body.categories.entries()) {
      const { error: renameError } = await supabase
        .from("categories")
        .update({ name: category.name.trim() })
        .eq("id", stagedCategories[index].id);
      if (renameError) {
        return NextResponse.json({ error: `تم تحديث بيانات المطعم لكن تعذر تسمية قسم المنيو: ${renameError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, slug: body.slug });
  }

export async function PUT(request: NextRequest) {
  try {
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

    if (!isValidInput(body) || !body.restaurantId) {
      return NextResponse.json({ error: "تحقق من بيانات المطعم وأصناف المنيو ثم حاول مجدداً." }, { status: 400 });
    }
    return await updateRestaurant(body, createAdminClient());
  } catch (error) {
    const details = error instanceof Error ? error.message : "خطأ غير معروف.";
    console.error("Admin restaurant update failed:", error);
    return NextResponse.json({ error: `تعذر إكمال تعديل المطعم: ${details}` }, { status: 500 });
  }
}
