import { NextRequest,NextResponse } from "next/server";
import { and,eq,desc } from "drizzle-orm";
import { db } from "@/db";
import { students,courses,studentAttendance } from "@/db/schema";
import { adminIdentity,feeResponse,sameOrigin } from "@/lib/fees/auth";
import { FeeError,indiaDate } from "@/lib/fees/rules";
import { validDay,safeStatus } from "@/lib/student-portal";
export async function GET(req:NextRequest) {
 try{
  adminIdentity(req);
  const date=req.nextUrl.searchParams.get("date")||indiaDate();
  if(!validDay(date))throw new FeeError("Invalid attendance date.");
  const [people,records,offerings]=await Promise.all([
   db.select({id:students.id,studentId:students.studentId,firstName:students.firstName,lastName:students.lastName,courseId:students.courseId,programName:students.programName,studentStatus:students.studentStatus}).from(students).orderBy(students.studentId).limit(2000),
   db.select({studentId:studentAttendance.studentId,status:studentAttendance.status}).from(studentAttendance).where(eq(studentAttendance.attendanceDate,date)),
   db.select({id:courses.id,name:courses.name}).from(courses).orderBy(courses.name)
  ]);
  return NextResponse.json({date,students:people,courses:offerings,records},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return feeResponse(e);}
}
export async function POST(req:NextRequest) {
 try{
  sameOrigin(req);const adminId=adminIdentity(req);
  const body=await req.json();const day=body.date,rows=body.records;
  if(!validDay(day)||day>indiaDate())throw new FeeError("Choose today or a past attendance date.");
  if(!Array.isArray(rows)||!rows.length||rows.length>200)throw new FeeError("Mark 1–200 students at a time.");
  const ids=new Set<number>();
  const clean=rows.map((row:{studentId:unknown;status:unknown})=>{
   const id=Number(row?.studentId);
   if(!Number.isSafeInteger(id)||id<1||ids.has(id)||!safeStatus(row?.status))throw new FeeError("Duplicate or invalid student attendance record.");
   ids.add(id);return {studentId:id,attendanceDate:day,status:row.status as "PRESENT"|"ABSENT"|"LATE"|"EXCUSED",markedBy:adminId,updatedAt:new Date()};
  });
  const existing=await db.select({id:students.id}).from(students).where(and(eq(students.studentStatus,"ACTIVE")));
  const allowed=new Set(existing.map(x=>x.id));
  if(clean.some(x=>!allowed.has(x.studentId)))throw new FeeError("Attendance can only be marked for active students.");
  await db.transaction(async tx=>{
   for(const item of clean)await tx.insert(studentAttendance).values(item)
    .onConflictDoUpdate({target:[studentAttendance.studentId,studentAttendance.attendanceDate],set:{status:item.status,markedBy:adminId,updatedAt:new Date()}});
  });
  return NextResponse.json({success:true,saved:clean.length});
 }catch(e){return feeResponse(e);}
}
export const dynamic="force-dynamic";
