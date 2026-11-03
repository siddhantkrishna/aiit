import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Database initialization over HTTP is disabled." }, { status: 410 });
}
export const dynamic = "force-dynamic";
