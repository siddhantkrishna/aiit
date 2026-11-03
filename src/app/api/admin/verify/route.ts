import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const user = requireAdmin(req);
  return NextResponse.json(user ? { authenticated: true, user: { id: user.id, email: user.email } } : { authenticated: false }, { status: user ? 200 : 401 });
}
export const dynamic = "force-dynamic";
