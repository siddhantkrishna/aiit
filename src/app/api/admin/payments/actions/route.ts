import { NextRequest, NextResponse } from "next/server";
import { adminIdentity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { adminAction, linkEnrollment, resetApplicantAccess, assignStudentCourse } from "@/lib/fees/admin";
import { selectPlan } from "@/lib/fees/service";
export async function POST(req:NextRequest) {
  try { sameOrigin(req); const adminId=adminIdentity(req); const body=await req.json();
    if(body.action === "assign_course") return NextResponse.json(await assignStudentCourse(adminId,Number(body.studentId),Number(body.courseId),String(body.reason||"")));
    if(body.action === "reset_applicant_access") return NextResponse.json(await resetApplicantAccess(adminId,Number(body.applicationId),String(body.reason||"")));
    if(body.action === "link_enrollment") return NextResponse.json(await linkEnrollment(adminId,Number(body.studentId),String(body.applicationRef||""),String(body.reason||"")));
    if(body.action === "select_plan") return NextResponse.json(await selectPlan({adminId},body.plan,{studentId:Number(body.studentId)||undefined,applicationId:Number(body.applicationId)||undefined}));
    return NextResponse.json(await adminAction(adminId,body));
  } catch(error) { return feeResponse(error); }
}
