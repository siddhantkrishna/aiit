import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull, or, gte, asc } from "drizzle-orm";
import { db } from "@/db";
import { students,universities,courses,studentResults,onlineClasses,onlineExams,onlineExamAttempts,studentServices,studentDocuments,studentAttendance,studentNotices } from "@/db/schema";
import { studentSessionId,unauthorized,noStore } from "@/lib/student-portal";
export async function GET(req:NextRequest) {
 const studentId=studentSessionId(req);
 if(!studentId)return unauthorized();
 try {
  const [s]=await db.select({
   id:students.id,studentId:students.studentId,firstName:students.firstName,lastName:students.lastName,
   fatherName:students.fatherName,motherName:students.motherName,dob:students.dob,gender:students.gender,
   mobile:students.mobile,email:students.email,address:students.address,city:students.city,state:students.state,pinCode:students.pinCode,
   qualification:students.qualification,courseId:students.courseId,universityId:students.universityId,
   programName:students.programName,studyMode:students.studyMode,studentStatus:students.studentStatus,
   admissionDate:students.admissionDate,enrollmentNumber:students.enrollmentNumber,documentStatus:students.documentStatus,
   certificateStatus:students.certificateStatus,applicationId:students.applicationId,emergencyContactName:students.emergencyContactName,
   emergencyContactMobile:students.emergencyContactMobile
  }).from(students).where(eq(students.id,studentId));
  if(!s)return unauthorized();
  const [course,university,results,classes,exams,attempts,services,documents,attendance,notices]=await Promise.all([
   s.courseId?db.select({id:courses.id,name:courses.name,fullName:courses.fullName,duration:courses.duration}).from(courses).where(eq(courses.id,s.courseId)).limit(1):Promise.resolve([]),
   s.universityId?db.select({id:universities.id,name:universities.name,shortName:universities.shortName}).from(universities).where(eq(universities.id,s.universityId)).limit(1):Promise.resolve([]),
   db.select({id:studentResults.id,examination:studentResults.examination,semester:studentResults.semester,subject:studentResults.subject,maxMarks:studentResults.maxMarks,marksObtained:studentResults.marksObtained,grade:studentResults.grade,resultStatus:studentResults.resultStatus,remarks:studentResults.remarks}).from(studentResults).where(and(eq(studentResults.studentId,studentId),eq(studentResults.published,true))).orderBy(desc(studentResults.createdAt)).limit(150),
   db.select({id:onlineClasses.id,title:onlineClasses.title,description:onlineClasses.description,instructor:onlineClasses.instructor,scheduledAt:onlineClasses.scheduledAt,durationMinutes:onlineClasses.durationMinutes,meetingUrl:onlineClasses.meetingUrl,recordingUrl:onlineClasses.recordingUrl,status:onlineClasses.status}).from(onlineClasses).where(and(eq(onlineClasses.enabled,true),s.courseId?or(isNull(onlineClasses.courseId),eq(onlineClasses.courseId,s.courseId)):isNull(onlineClasses.courseId))).orderBy(desc(onlineClasses.scheduledAt)).limit(60),
   db.select({id:onlineExams.id,title:onlineExams.title,examCode:onlineExams.examCode,startsAt:onlineExams.startsAt,endsAt:onlineExams.endsAt,durationMinutes:onlineExams.durationMinutes,totalMarks:onlineExams.totalMarks}).from(onlineExams).where(and(eq(onlineExams.published,true),s.courseId?or(isNull(onlineExams.courseId),eq(onlineExams.courseId,s.courseId)):isNull(onlineExams.courseId))).orderBy(asc(onlineExams.startsAt)).limit(60),
   db.select({examId:onlineExamAttempts.examId,attemptStatus:onlineExamAttempts.attemptStatus,score:onlineExamAttempts.score,resultStatus:onlineExamAttempts.resultStatus}).from(onlineExamAttempts).where(eq(onlineExamAttempts.studentId,studentId)),
   db.select({id:studentServices.id,serviceType:studentServices.serviceType,status:studentServices.status,priority:studentServices.priority,requestedAt:studentServices.requestedAt,referenceNumber:studentServices.referenceNumber,notes:studentServices.notes,remarks:studentServices.remarks}).from(studentServices).where(eq(studentServices.studentId,studentId)).orderBy(desc(studentServices.requestedAt)).limit(100),
   db.select({id:studentDocuments.id,documentType:studentDocuments.documentType,fileName:studentDocuments.fileName,verificationStatus:studentDocuments.verificationStatus,uploadedAt:studentDocuments.uploadedAt,rejectionReason:studentDocuments.rejectionReason,hasFile:studentDocuments.storagePath}).from(studentDocuments).where(eq(studentDocuments.studentId,studentId)).orderBy(desc(studentDocuments.createdAt)).limit(100),
   db.select({id:studentAttendance.id,attendanceDate:studentAttendance.attendanceDate,status:studentAttendance.status,notes:studentAttendance.notes}).from(studentAttendance).where(eq(studentAttendance.studentId,studentId)).orderBy(desc(studentAttendance.attendanceDate)).limit(120),
   db.select({id:studentNotices.id,title:studentNotices.title,body:studentNotices.body,postedAt:studentNotices.postedAt}).from(studentNotices).where(and(eq(studentNotices.published,true),s.courseId?or(isNull(studentNotices.courseId),eq(studentNotices.courseId,s.courseId)):isNull(studentNotices.courseId))).orderBy(desc(studentNotices.postedAt)).limit(30)
  ]);
  const count=attendance.reduce((a,r)=>{a[r.status]=(a[r.status]||0)+1;return a;},{} as Record<string,number>);
  const registered=(count.PRESENT||0)+(count.ABSENT||0)+(count.LATE||0)+(count.EXCUSED||0);
  return NextResponse.json({
    student:{...s,courseName:course[0]?.fullName||course[0]?.name||s.programName||"Not assigned",courseDuration:course[0]?.duration||null,universityName:university[0]?.name||"Not assigned",universityShortName:university[0]?.shortName||null},
    results,classes,exams:exams.map(e=>({...e,attempt:attempts.find(a=>a.examId===e.id)||null})),
    services,documents:documents.map(d=>({...d,hasFile:!!d.hasFile})),attendance,
    attendanceSummary:{registered,present:(count.PRESENT||0)+(count.LATE||0),absent:count.ABSENT||0,excused:count.EXCUSED||0},
    notices
  },{headers:noStore});
 }catch(err){console.error("Student portal failed",err instanceof Error?err.name:"Unknown");return NextResponse.json({error:"Student portal is temporarily unavailable."},{status:503,headers:noStore});}
}
export const dynamic="force-dynamic";
