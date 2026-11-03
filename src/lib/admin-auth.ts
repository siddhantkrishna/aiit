import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function requireAdmin(req: NextRequest) {
  const secret = process.env.JWT_SECRET;
  const token = req.cookies.get("admin_token")?.value;
  if (!secret || !token) return null;
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"], audience: "aiit-admin", issuer: "aiit" });
    if (typeof decoded === "string" || decoded.role !== "admin" || (!Number.isSafeInteger(decoded.id) || Number(decoded.id) < 1)) return null;
    return decoded;
  } catch {
    return null;
  }
}
