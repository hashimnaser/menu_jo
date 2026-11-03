import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const { url, anonKey } = getSupabaseConfig();
  const pendingCookies: {
    name: string;
    value: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => request.cookies.set(cookie.name, cookie.value));
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");
  const nextPath = request.nextUrl.searchParams.get("next");
  const safeNextPath =
    nextPath?.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/";
  const redirectUrl = new URL(safeNextPath, request.url);

  if (!code || providerError) {
    redirectUrl.searchParams.set("auth", "error");
  } else {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) redirectUrl.searchParams.set("auth", "error");
  }

  const response = NextResponse.redirect(redirectUrl);
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
