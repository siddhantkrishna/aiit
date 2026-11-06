import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
export async function GET(req: NextRequest) {
  try {
    const user = requireAdmin(req);
    return NextResponse.json({ authenticated: !!user, ...(user ? { user } : {}) }, { status: user ? 200 : 401 });
  } catch { return NextResponse.json({ authenticated: false }, { status: 503 }); }
}
export const dynamic = "force-dynamic";
