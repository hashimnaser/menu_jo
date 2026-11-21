import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminConfigured, isValidAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "restaurant-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getConfigurationError() {
  const missing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
    !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  return missing.length
    ? `إعدادات Supabase غير مكتملة على الخادم: ${missing.join("، ")}.`
    : null;
}

async function ensurePublicBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`تعذر التحقق من إعداد تخزين الصور: ${listError.message}`);

  const bucket = buckets.find(({ name }) => name === BUCKET_NAME);
  if (!bucket) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: Object.keys(EXTENSIONS),
    });
    if (error) throw new Error(`تعذر إنشاء مساحة تخزين الصور: ${error.message}`);
    return;
  }

  if (!bucket.public) {
    throw new Error("مساحة تخزين الصور موجودة لكنها خاصة. اجعل restaurant-images مساحة عامة من إعدادات Supabase Storage.");
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "إعدادات دخول الأدمن غير مكتملة على الخادم." }, { status: 503 });
  }
  if (!isValidAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "يلزم تسجيل دخول الأدمن." }, { status: 401 });
  }
  const configurationError = getConfigurationError();
  if (configurationError) {
    return NextResponse.json({ error: configurationError }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "اختر صورة صالحة لرفعها." }, { status: 400 });
    }

    const extension = EXTENSIONS[file.type];
    if (!extension) {
      return NextResponse.json({ error: "صيغة الصورة غير مدعومة. استخدم PNG أو JPG أو WEBP أو GIF أو AVIF." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "حجم الصورة يتجاوز الحد المسموح وهو 5 ميغابايت." }, { status: 413 });
    }

    const supabase = createAdminClient();
    await ensurePublicBucket(supabase);

    const path = `restaurants/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, new Uint8Array(await file.arrayBuffer()), {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `تعذر حفظ الصورة: ${uploadError.message}` }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    const details = error instanceof Error ? error.message : "خطأ غير معروف.";
    console.error("Admin restaurant image upload failed:", error);
    return NextResponse.json({ error: `تعذر إكمال رفع الصورة: ${details}` }, { status: 500 });
  }
}
