import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { students, studentLoginAttempts } from "@/db/schema";
import { exactlyOneMatch, normalizeIndianMobile, phoneCandidates, validDateOfBirth } from "@/lib/student-login";

const STUDENT_COOKIE = "student_token";
const JWT_SECRET = process.env.JWT_SECRET;

export function mobileLoginScope(mobile:string):string {
  if(!JWT_SECRET)throw new Error("JWT_SECRET is not configured");
  return createHmac("sha256",JWT_SECRET).update("aiit:student-login:"+mobile).digest("hex");
}
export async function mobileLoginBlocked(scopeHash:string):Promise<boolean>{
  const [row]=await db.select({lockedUntil:studentLoginAttempts.lockedUntil}).from(studentLoginAttempts)
    .where(eq(studentLoginAttempts.scopeHash,scopeHash)).limit(1);
  return !!row?.lockedUntil && row.lockedUntil.getTime()>Date.now();
}
export async function registerStudentLoginFailure(scopeHash:string):Promise<void>{
  const cutoff=sql`now() - interval '15 minutes'`;
  await db.insert(studentLoginAttempts)
    .values({scopeHash,failedCount:1,windowStartedAt:new Date(),updatedAt:new Date()})
    .onConflictDoUpdate({
      target:studentLoginAttempts.scopeHash,
      set:{
        failedCount:sql`CASE WHEN ${studentLoginAttempts.windowStartedAt} < ${cutoff} THEN 1 ELSE ${studentLoginAttempts.failedCount}+1 END`,
        windowStartedAt:sql`CASE WHEN ${studentLoginAttempts.windowStartedAt} < ${cutoff} THEN now() ELSE ${studentLoginAttempts.windowStartedAt} END`,
        lockedUntil:sql`CASE WHEN ${studentLoginAttempts.windowStartedAt} >= ${cutoff} AND ${studentLoginAttempts.failedCount} >= 4 THEN now() + interval '15 minutes' ELSE NULL END`,
        updatedAt:new Date(),
      }
    });
}
export async function resetStudentLoginFailures(scopeHash:string):Promise<void>{
  await db.delete(studentLoginAttempts).where(eq(studentLoginAttempts.scopeHash,scopeHash));
}
export async function authenticateStudent(mobileInput:string,dobInput:string) {
  const mobile=normalizeIndianMobile(mobileInput);
  const dob=dobInput.trim();
  if(!mobile || !validDateOfBirth(dob) || !JWT_SECRET)return null;
  const matches=await db.select({
    id:students.id,
    studentId:students.studentId,
  }).from(students).where(and(inArray(students.mobile,phoneCandidates(mobile)),eq(students.dob,dob))).limit(2);
  // Never guess which student's private record to open if a shared phone+DOB matches.
  return exactlyOneMatch(matches.length) ? matches[0] : null;
}
export function createStudentSession(studentId: number | string) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ studentId: String(studentId), role: "student" }, JWT_SECRET, { expiresIn: "8h" });
}
export function getStudentFromRequest(req:NextRequest) {
  if(!JWT_SECRET)return null;
  const token=req.cookies.get(STUDENT_COOKIE)?.value;
  if(!token)return null;
  try{
    const decoded=jwt.verify(token,JWT_SECRET) as JwtPayload;
    if(decoded.role!=="student"||!decoded.studentId)return null;
    return String(decoded.studentId);
  }catch{return null;}
}
export function setStudentCookie(response:NextResponse,token:string){
  response.cookies.set(STUDENT_COOKIE,token,{
    httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",
    maxAge:60*60*8,path:"/"
  });
}
export function clearStudentCookie(response:NextResponse){
  response.cookies.set(STUDENT_COOKIE,"",{
    httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",
    maxAge:0,path:"/"
  });
}
export const studentCookieName=STUDENT_COOKIE;
