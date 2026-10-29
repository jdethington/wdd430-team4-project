import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  if (token?.status === "password_reset") {
    const allowed =
      pathname.startsWith("/account") ||
      pathname.startsWith("/api/account") ||
      pathname.startsWith("/api/auth") ||
      pathname === "/login";

    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!token?.id || token.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/movies/:path*",
  ],
};
