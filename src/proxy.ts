import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "./lib/admin-auth";
import { rateLimit, validateRequest } from "./lib/request-security";

const PUBLIC_ADMIN_API = new Set(["/api/admin/login", "/api/admin/logout", "/api/admin/verify"]);
const LIMITED_PUBLIC = new Set(["/api/admin/login", "/api/student/login", "/api/applications/status", "/api/applications", "/api/vacancy-applications", "/api/online-inquiry", "/api/online-fee-payment"]);

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname.replace(/\/$/, "");
  if (pathname.startsWith("/admin/dashboard") && !requireAdmin(req)) return NextResponse.redirect(new URL("/admin/login", req.url));
  if (pathname.startsWith("/api/")) {
    const invalid = validateRequest(req);
    if (invalid) return invalid;
    if (pathname.startsWith("/api/admin/") && !PUBLIC_ADMIN_API.has(pathname) && !requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (LIMITED_PUBLIC.has(pathname) && req.method !== "GET") {
      // Students at a centre may share one IP; each account still has its own ten-attempt limit.
      const limited = await rateLimit(req, pathname, pathname === "/api/student/login" ? 200 : pathname.endsWith("login") ? 10 : 20);
      if (limited) return limited;
    }
  }
  const response = NextResponse.next();
  if (pathname.startsWith("/api/")) response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = { matcher: ["/api/:path*", "/admin/dashboard/:path*"] };
