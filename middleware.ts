import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  if (!searchParams.has("code") && !searchParams.has("error")) {
    return NextResponse.next();
  }

  const callbackUrl = request.nextUrl.clone();
  callbackUrl.pathname = "/auth/callback";
  return NextResponse.rewrite(callbackUrl);
}

export const config = {
  matcher: "/",
};
