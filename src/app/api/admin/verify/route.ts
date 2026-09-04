import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");
    return NextResponse.json(
      { authenticated: false, error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    const token = req.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    return NextResponse.json({
      authenticated: true,
      user: decoded,
    });
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 },
    );
  }
}

export const dynamic = "force-dynamic";