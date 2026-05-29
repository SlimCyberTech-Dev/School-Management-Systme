import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { decodeJwtPayload } from "@/lib/jwtPayload";

const SMS_TOKEN = "sms_token";
const PLATFORM_TOKEN = "sms_platform_token";

const ROLE_PREFIX: Record<string, string> = {
  admin: "/admin",
  headteacher: "/headteacher",
  class_teacher: "/class-teacher",
  subject_teacher: "/subject-teacher",
  bursar: "/bursar",
};

function dashboardPath(role: string): string {
  const prefix = ROLE_PREFIX[role];
  return prefix ? `${prefix}/dashboard` : "/login";
}

function hostSlug(hostname: string): string | null {
  const host = hostname.split(":")[0]!.toLowerCase();
  if (host.endsWith(".localhost")) {
    const label = host.slice(0, -".localhost".length);
    const parts = label.split(".");
    return parts[parts.length - 1] ?? null;
  }
  const parts = host.split(".");
  if (parts.length >= 3) return parts[0] ?? null;
  return null;
}

function isPlatformHost(hostname: string): boolean {
  return hostSlug(hostname) === "platform";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.nextUrl.hostname;

  if (pathname.startsWith("/platform")) {
    const platformToken = request.cookies.get(PLATFORM_TOKEN)?.value ?? null;
    if (pathname.startsWith("/platform/login")) {
      if (platformToken) {
        return NextResponse.redirect(new URL("/platform/tenants", request.url));
      }
      return NextResponse.next();
    }
    if (!platformToken) {
      return NextResponse.redirect(new URL("/platform/login", request.url));
    }
    return NextResponse.next();
  }

  if (isPlatformHost(hostname) && !pathname.startsWith("/platform")) {
    return NextResponse.redirect(new URL("/platform/tenants", request.url));
  }

  const slug = hostSlug(hostname);
  if (!slug && hostname === "localhost" && pathname === "/") {
    return NextResponse.redirect(new URL("http://default.localhost:3000/login"));
  }

  const token = request.cookies.get(SMS_TOKEN)?.value ?? null;

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  const payload = decodeJwtPayload(token);
  const role = typeof payload?.role === "string" ? payload.role : null;

  if (!role || !ROLE_PREFIX[role]) {
    const login = new URL("/login", request.url);
    const res = NextResponse.redirect(login);
    res.cookies.delete(SMS_TOKEN);
    return res;
  }

  if (pathname.startsWith("/profile")) {
    return NextResponse.next();
  }

  const allowedPrefix = ROLE_PREFIX[role];
  if (!pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL(dashboardPath(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/platform/:path*",
    "/admin/:path*",
    "/headteacher/:path*",
    "/class-teacher/:path*",
    "/subject-teacher/:path*",
    "/bursar/:path*",
    "/profile",
    "/profile/:path*",
    "/",
  ],
};
