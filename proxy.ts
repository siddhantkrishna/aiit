import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "./src/lib/admin-auth";

const PUBLIC_ADMIN_API = new Set([
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/verify",
]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/admin/") && !PUBLIC_ADMIN_API.has(pathname)) {
    if (!requireAdmin(req)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/admin/dashboard/:path*"],
};
