import { NextRequest,NextResponse } from "next/server";
import { desc,eq } from "drizzle-orm";
import { db } from "@/db";
import { studentDocuments,students } from "@/db/schema";
import { adminIdentity,feeResponse,sameOrigin } from "@/lib/fees/auth";
import { FeeError } from "@/lib/fees/rules";
export async function GET(req:NextRequest){
 try{adminIdentity(req);
 const rows=await db.select({
  id:studentDocuments.id,studentId:studentDocuments.studentId,studentRef:students.studentId,
  firstName:students.firstName,lastName:students.lastName,
  documentType:studentDocuments.documentType,fileName:studentDocuments.fileName,
  verificationStatus:studentDocuments.verificationStatus,rejectionReason:studentDocuments.rejectionReason,
  uploadedAt:studentDocuments.uploadedAt
 }).from(studentDocuments).innerJoin(students,eq(studentDocuments.studentId,students.id))
 .orderBy(desc(studentDocuments.createdAt)).limit(200);
 return NextResponse.json(rows,{headers:{"Cache-Control":"private,no-store"}});
 }catch(e){return feeResponse(e);}
}
export async function PATCH(req:NextRequest){
 try{sameOrigin(req);adminIdentity(req);const body=await req.json();
 const id=Number(body.id),status=String(body.status||""),reason=String(body.reason||"").trim();
 if(!Number.isSafeInteger(id)||id<1||!["PENDING","VERIFIED","REJECTED"].includes(status)||reason.length>500)
  throw new FeeError("Invalid document review.");
 if(status==="REJECTED"&&reason.length<5)throw new FeeError("Provide a reason when rejecting a document.");
 const [updated]=await db.update(studentDocuments).set({
  verificationStatus:status,rejectionReason:status==="REJECTED"?reason:null,
  verifiedAt:status==="VERIFIED"?new Date():null,updatedAt:new Date()
 }).where(eq(studentDocuments.id,id)).returning({id:studentDocuments.id});
 if(!updated)throw new FeeError("Document not found.",404);
 return NextResponse.json({success:true});
 }catch(e){return feeResponse(e);}
}
export const dynamic="force-dynamic";
