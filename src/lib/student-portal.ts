import { NextRequest, NextResponse } from "next/server";
import { getStudentFromRequest } from "@/lib/student-auth";
export const SERVICE_TYPES = ["ID Card / Correction","Bonafide Certificate","Transfer Certificate","Fee Clarification","Document Verification","Academic Support","Other"] as const;
export const ATTENDANCE_STATUSES = ["PRESENT","ABSENT","LATE","EXCUSED"] as const;
export function studentSessionId(req:NextRequest):number|null {
 const raw=getStudentFromRequest(req);
 if(!raw || !/^\d+$/.test(raw))return null;
 const id=Number(raw);
 return Number.isSafeInteger(id)&&id>0?id:null;
}
export const unauthorized=()=>NextResponse.json({error:"Student sign-in required."},{status:401,headers:{"Cache-Control":"no-store"}});
export const noStore={"Cache-Control":"private, no-store"};
export function secureSameOrigin(req:NextRequest) {
 const origin=req.headers.get("origin");
 // SameSite cookies defend against CSRF; also reject explicit foreign origins.
 return !origin || origin===req.nextUrl.origin;
}
export function validDay(date:unknown):date is string {
 return typeof date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
}
export function safeStatus(value:unknown):value is typeof ATTENDANCE_STATUSES[number] {
 return typeof value==="string"&&ATTENDANCE_STATUSES.some(item=>item===value);
}
