import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import {
  homePathForRole,
  parseSessionCookie,
} from "@/lib/auth/session-payload";

export function proxy(request: NextRequest) {
  const session = parseSessionCookie(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isRotaRoute = pathname.startsWith("/rota");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if ((isAdminRoute || isRotaRoute) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && session) {
    const url = request.nextUrl.clone();
    url.pathname = homePathForRole(session.role);
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && session && session.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/rota";
    return NextResponse.redirect(url);
  }

  if (isRotaRoute && session && session.role !== "worker") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/rota/:path*", "/login", "/register"],
};
