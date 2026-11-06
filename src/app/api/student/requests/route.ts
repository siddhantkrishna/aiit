import { NextRequest,NextResponse } from "next/server";
import { and,eq } from "drizzle-orm";
import { db } from "@/db";
import { students,studentServices } from "@/db/schema";
import { studentSessionId,unauthorized,secureSameOrigin,noStore,SERVICE_TYPES } from "@/lib/student-portal";
export async function POST(req:NextRequest) {
 const id=studentSessionId(req);if(!id)return unauthorized();
 if(!secureSameOrigin(req))return NextResponse.json({error:"Cross-origin request rejected."},{status:403});
 try{
  const body=await req.json();
  const type=String(body?.type||"").trim();
  const notes=String(body?.message||"").trim();
  if(!SERVICE_TYPES.some(x=>x===type)||notes.length<10||notes.length>1000)return NextResponse.json({error:"Choose a request type and provide 10–1000 characters."},{status:400});
  const [student]=await db.select({id:students.id}).from(students).where(eq(students.id,id));
  if(!student)return unauthorized();
  const open=await db.select({id:studentServices.id}).from(studentServices).where(and(eq(studentServices.studentId,id),eq(studentServices.status,"PENDING"))).limit(5);
  if(open.length>=5)return NextResponse.json({error:"You have five pending requests. Wait for a response before submitting another."},{status:429});
  const [row]=await db.insert(studentServices).values({studentId:id,serviceType:type,status:"PENDING",priority:"NORMAL",notes,referenceNumber:null}).returning({id:studentServices.id});
  return NextResponse.json({success:true,id:row.id},{status:201,headers:noStore});
 }catch(err){console.error("Student service request",err instanceof Error?err.name:"Unknown");return NextResponse.json({error:"Unable to submit request."},{status:503});}
}
export const dynamic="force-dynamic";
