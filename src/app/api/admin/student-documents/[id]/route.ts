import { NextRequest,NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentDocuments } from "@/db/schema";
import { adminIdentity,feeResponse } from "@/lib/fees/auth";
import { FeeError } from "@/lib/fees/rules";
import { supabase } from "@/lib/supabase";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{adminIdentity(req);
 const id=Number((await params).id);
 if(!Number.isSafeInteger(id)||id<1)throw new FeeError("Document not found.",404);
 const [doc]=await db.select({storagePath:studentDocuments.storagePath,studentId:studentDocuments.studentId})
   .from(studentDocuments).where(eq(studentDocuments.id,id));
 if(!doc?.storagePath||!doc.storagePath.startsWith(`students/${doc.studentId}/`))throw new FeeError("Document not found.",404);
 const link=await supabase.storage.from("documents").createSignedUrl(doc.storagePath,60);
 if(link.error||!link.data?.signedUrl)throw new FeeError("Document temporarily unavailable.",503);
 const res=NextResponse.redirect(link.data.signedUrl,302);
 res.headers.set("Cache-Control","private,no-store");res.headers.set("Referrer-Policy","no-referrer");
 return res;
 }catch(e){return feeResponse(e);}
}
export const dynamic="force-dynamic";
