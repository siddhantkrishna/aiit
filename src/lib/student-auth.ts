import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";

const STUDENT_COOKIE = "student_token";
const JWT_SECRET = process.env.JWT_SECRET;

export async function authenticateStudent(
  studentIdInput: string,
  mobileInput: string,
  dobInput: string,
  accessCode: string,
) {
  const studentId = studentIdInput.trim();
  const mobile = mobileInput.replace(/\D/g, "");
  const dob = dobInput.trim();

  if (!studentId || mobile.length !== 10 || !dob || !accessCode || !JWT_SECRET) return null;

  const [student] = await db
    .select({
      accessCodeHash: students.accessCodeHash,
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

  if (!student || student.studentStatus !== "ACTIVE" || !student.accessCodeHash || !await bcrypt.compare(accessCode, student.accessCodeHash)) return null;

  return student;
}

export function createStudentSession(studentId: number | string, accessCodeHash: string) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ studentId: String(studentId), role: "student", credential: createHash("sha256").update(accessCodeHash).digest("hex") }, JWT_SECRET, {
    expiresIn: "1h", algorithm: "HS256", issuer: "aiit-student-v2", audience: "aiit-student",
  });
}

export async function getStudentFromRequest(req: NextRequest) {
  if (!JWT_SECRET) return null;
  const token = req.cookies.get(STUDENT_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"], issuer: "aiit-student-v2", audience: "aiit-student" });
    if (typeof decoded === "string" || decoded.role !== "student" || !/^\d+$/.test(String(decoded.studentId))) return null;
    const [student] = await db.select({ hash: students.accessCodeHash, status: students.studentStatus }).from(students).where(eq(students.id, Number(decoded.studentId)));
    if (!student?.hash || student.status !== "ACTIVE" || decoded.credential !== createHash("sha256").update(student.hash).digest("hex")) return null;
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
    maxAge: 60 * 60,
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
