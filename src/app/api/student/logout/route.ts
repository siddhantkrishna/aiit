import { NextResponse } from "next/server";
import { clearStudentCookie } from "@/lib/student-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearStudentCookie(response);
  return response;
}
