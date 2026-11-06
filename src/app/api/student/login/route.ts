import { NextRequest, NextResponse } from "next/server";
import {
 authenticateStudent, createStudentSession, setStudentCookie,
 mobileLoginScope,mobileLoginBlocked,registerStudentLoginFailure,resetStudentLoginFailures
} from "@/lib/student-auth";
import { normalizeIndianMobile,validDateOfBirth } from "@/lib/student-login";
const headers={"Cache-Control":"no-store"};
export async function POST(req:NextRequest){
 try{
  const origin=req.headers.get("origin");
  if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Request rejected."},{status:403,headers});
  const body=await req.json();
  const mobile=normalizeIndianMobile(body?.mobile),dob=body?.dob;
  if(!mobile||!validDateOfBirth(dob))return NextResponse.json({error:"Enter a valid registered mobile number and date of birth."},{status:400,headers});
  const scope=mobileLoginScope(mobile);
  if(await mobileLoginBlocked(scope))
    return NextResponse.json({error:"Too many attempts. Please try again after 15 minutes."},{status:429,headers:{"Cache-Control":"no-store","Retry-After":"900"}});
  const student=await authenticateStudent(mobile,dob);
  if(!student){
    await registerStudentLoginFailure(scope);
    return NextResponse.json({error:"Student details could not be verified. Contact admissions if the registered mobile number is incorrect."},{status:401,headers});
  }
  await resetStudentLoginFailures(scope);
  const response=NextResponse.json({success:true},{headers});
  setStudentCookie(response,createStudentSession(student.id));
  return response;
 }catch(error){
  console.error("Student login failed",error instanceof Error?error.name:"Unknown");
  return NextResponse.json({error:"Unable to sign in right now."},{status:503,headers});
 }
}
export const dynamic="force-dynamic";
