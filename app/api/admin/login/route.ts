import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSessionToken, isAdminConfigured, isValidAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "إعدادات دخول الأدمن غير مكتملة على الخادم." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("password" in body) ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json({ error: "أدخل كلمة المرور." }, { status: 400 });
  }

  if (!isValidAdminPassword(body.password)) {
    return NextResponse.json({ error: "كلمة المرور غير صحيحة." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
