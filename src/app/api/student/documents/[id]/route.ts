import { NextRequest,NextResponse } from "next/server";
import { and,eq } from "drizzle-orm";
import { db } from "@/db";
import { studentDocuments } from "@/db/schema";
import { supabase } from "@/lib/supabase";
import { studentSessionId,unauthorized,noStore } from "@/lib/student-portal";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const studentId=studentSessionId(req);if(!studentId)return unauthorized();
 const id=Number((await params).id);
 if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:"Not found"},{status:404});
 try{
  const [document]=await db.select({storagePath:studentDocuments.storagePath}).from(studentDocuments)
    .where(and(eq(studentDocuments.id,id),eq(studentDocuments.studentId,studentId)));
  if(!document?.storagePath||!document.storagePath.startsWith(`students/${studentId}/`))return NextResponse.json({error:"Not found"},{status:404});
  const result=await supabase.storage.from("documents").createSignedUrl(document.storagePath,60);
  if(result.error||!result.data?.signedUrl)throw new Error("Could not create signed link");
  const response=NextResponse.redirect(result.data.signedUrl,302);
  response.headers.set("Cache-Control","private, no-store");response.headers.set("Referrer-Policy","no-referrer");
  return response;
 }catch(err){console.error("Student document download",err instanceof Error?err.name:"Unknown");return NextResponse.json({error:"Document temporarily unavailable."},{status:503,headers:noStore});}
}
export const dynamic="force-dynamic";
