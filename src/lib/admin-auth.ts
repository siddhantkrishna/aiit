import { NextRequest } from "next/server";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function requireAdmin(req: NextRequest) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = req.cookies.get("admin_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string" || !Number.isSafeInteger(decoded.id) || !decoded.email || decoded.role) return null;
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}
