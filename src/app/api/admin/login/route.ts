import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { admin } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "aiit-college-admin-secret-2025";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await db
      .select()
      .from(admin)
      .where(eq(admin.email, email));

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user[0].password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user[0].id, email: user[0].email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const response = NextResponse.json({
      success: true,
      name: user[0].name,
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
