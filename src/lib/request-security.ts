import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export function validateRequest(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return null;
  const origin = req.headers.get("origin");
  if (req.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== req.nextUrl.origin)) {
    return NextResponse.json({ error: "Cross-site request denied." }, { status: 403 });
  }
  const limit = req.headers.get("content-type")?.includes("multipart/form-data") ? 32 * 1024 * 1024 : 256 * 1024;
  if (Number(req.headers.get("content-length") || 0) > limit) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }
  return null;
}

export async function rateLimit(req: NextRequest, scope: string, limit = 10, identity?: string) {
  // Vercel overwrites x-vercel-forwarded-for; never trust a client-supplied IP on Vercel.
  const ip = process.env.VERCEL ? req.headers.get("x-vercel-forwarded-for") : req.headers.get("x-forwarded-for");
  const key = createHash("sha256").update(`${scope}:${identity || ip?.split(",")[0]?.trim() || "unknown"}`).digest("hex");
  try {
    const result = await db.execute(sql`
      INSERT INTO api_rate_limits (key, attempts, expires_at)
      VALUES (${key}, 1, now() + interval '15 minutes')
      ON CONFLICT (key) DO UPDATE SET
        attempts = CASE WHEN api_rate_limits.expires_at <= now() THEN 1 ELSE api_rate_limits.attempts + 1 END,
        expires_at = CASE WHEN api_rate_limits.expires_at <= now() THEN now() + interval '15 minutes' ELSE api_rate_limits.expires_at END
      RETURNING attempts
    `);
    if (Number(result.rows[0]?.attempts) <= limit) return null;
    return NextResponse.json({ error: "Too many attempts. Please try again in 15 minutes." }, { status: 429, headers: { "Retry-After": "900" } });
  } catch {
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
}
