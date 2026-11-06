import { randomUUID } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students,studentDocuments } from "@/db/schema";
import { supabase } from "@/lib/supabase";
import { studentSessionId,unauthorized,secureSameOrigin,noStore } from "@/lib/student-portal";
const types=new Set(["Photo","Aadhaar / Identity","10th Marksheet","12th Marksheet","Graduation Marksheet","Other"]);
const maxBytes=5*1024*1024;
function safeMime(b:Buffer,mime:string){
 if(mime==="application/pdf"&&b.subarray(0,5).toString("ascii")==="%PDF-")return "pdf";
 if(mime==="image/png"&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return "png";
 if(mime==="image/jpeg"&&b.length>=4&&b[0]===255&&b[1]===216&&b[b.length-2]===255&&b[b.length-1]===217)return "jpg";
 return null;
}
export async function POST(req:NextRequest){
 const studentId=studentSessionId(req);if(!studentId)return unauthorized();
 if(!secureSameOrigin(req))return NextResponse.json({error:"Cross-origin request rejected."},{status:403});
 try{
  const form=await req.formData();
  const type=String(form.get("type")||"");
  const file=form.get("file");
  if(!types.has(type)||!(file instanceof File)||file.size<1||file.size>maxBytes)return NextResponse.json({error:"Select a document category and a file under 5 MB."},{status:400});
  const bytes=Buffer.from(await file.arrayBuffer());
  const ext=safeMime(bytes,file.type);
  if(!ext)return NextResponse.json({error:"Only genuine PDF, PNG or JPEG files are accepted."},{status:400});
  if(type==="Photo"&&ext==="pdf")return NextResponse.json({error:"Student photographs must be JPEG or PNG images."},{status:400});
  const [student]=await db.select({id:students.id}).from(students).where(eq(students.id,studentId));
  if(!student)return unauthorized();
  const id=randomUUID(),storagePath=`students/${studentId}/${id}.${ext}`;
  const uploaded=await supabase.storage.from("documents").upload(storagePath,bytes,{contentType:file.type,cacheControl:"private, max-age=0",upsert:false});
  if(uploaded.error)throw new Error("Storage unavailable");
  try{
   await db.insert(studentDocuments).values({
    documentId:`STUDOC-${id}`,studentId,documentType:type,documentCategory:"Student supplied",
    fileName:file.name.slice(0,200),storagePath,verificationStatus:"PENDING",uploadedAt:new Date(),updatedAt:new Date()
   });
  }catch{
   await supabase.storage.from("documents").remove([storagePath]);
   throw new Error("Could not record the uploaded document");
  }
  return NextResponse.json({success:true},{status:201,headers:noStore});
 }catch(err){console.error("Student document upload",err instanceof Error?err.message:"Unknown");return NextResponse.json({error:"Unable to upload document. Retry later."},{status:503});}
}
export const dynamic="force-dynamic";
