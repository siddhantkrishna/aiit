import { NextRequest, NextResponse } from "next/server";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";

const STUDENT_COOKIE = "student_token";
const JWT_SECRET = process.env.JWT_SECRET;

export async function authenticateStudent(
  studentIdInput: string,
  mobileInput: string,
  dobInput: string,
) {
  const studentId = studentIdInput.trim();
  const mobile = mobileInput.replace(/\D/g, "");
  const dob = dobInput.trim();

  if (!studentId || mobile.length < 10 || !dob || !JWT_SECRET) return null;

  const [student] = await db
    .select({
      id: students.id,
      studentId: students.studentId,
      firstName: students.firstName,
      lastName: students.lastName,
      mobile: students.mobile,
      email: students.email,
      dob: students.dob,
      programName: students.programName,
      studentStatus: students.studentStatus,
      totalFee: students.totalFee,
      amountPaid: students.amountPaid,
      amountPending: students.amountPending,
    })
    .from(students)
    .where(
      and(
        eq(students.studentId, studentId),
        eq(students.mobile, mobile),
        eq(students.dob, dob),
      ),
    );

  if (!student) return null;

  return student;
}

export function createStudentSession(studentId: number | string) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ studentId: String(studentId), role: "student" }, JWT_SECRET, {
    expiresIn: "8h",
  });
}

export function getStudentFromRequest(req: NextRequest) {
  if (!JWT_SECRET) return null;
  const token = req.cookies.get(STUDENT_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.role !== "student" || !decoded.studentId) return null;
    return String(decoded.studentId);
  } catch {
    return null;
  }
}

export function setStudentCookie(response: NextResponse, token: string) {
  response.cookies.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export function clearStudentCookie(response: NextResponse) {
  response.cookies.set(STUDENT_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

export const studentCookieName = STUDENT_COOKIE;
