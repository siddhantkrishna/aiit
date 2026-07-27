import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "aiit-college-admin-secret-2025";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return NextResponse.json({ authenticated: true, user: decoded });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export const dynamic = "force-dynamic";
