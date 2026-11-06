import { NextRequest,NextResponse } from "next/server";
import { eq,desc } from "drizzle-orm";
import { db } from "@/db";
import { studentNotices,courses } from "@/db/schema";
import { adminIdentity,feeResponse,sameOrigin } from "@/lib/fees/auth";
import { FeeError } from "@/lib/fees/rules";
export async function GET(req:NextRequest){
 try{adminIdentity(req);
 const [notices,courseRows]=await Promise.all([
  db.select().from(studentNotices).orderBy(desc(studentNotices.postedAt)).limit(100),
  db.select({id:courses.id,name:courses.name}).from(courses).orderBy(courses.name)
 ]);
 return NextResponse.json({notices,courses:courseRows},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return feeResponse(e);}
}
export async function POST(req:NextRequest){
 try{sameOrigin(req);const adminId=adminIdentity(req);const body=await req.json();
 const title=String(body.title||"").trim(),message=String(body.body||"").trim();
 if(title.length<5||title.length>200||message.length<10||message.length>3000)throw new FeeError("Title must be 5–200 characters, message 10–3000 characters.");
 const courseId=body.courseId?Number(body.courseId):null;
 if(courseId!==null){const [course]=await db.select({id:courses.id}).from(courses).where(eq(courses.id,courseId));if(!course)throw new FeeError("Select a valid course.");}
 const [notice]=await db.insert(studentNotices).values({title,body:message,courseId,published:true,createdBy:adminId}).returning({id:studentNotices.id});
 return NextResponse.json({success:true,id:notice.id},{status:201});
 }catch(e){return feeResponse(e);}
}
export async function PATCH(req:NextRequest){
 try{sameOrigin(req);adminIdentity(req);const body=await req.json();const id=Number(body.id);
 if(!Number.isSafeInteger(id)||id<1||typeof body.published!=="boolean")throw new FeeError("Invalid notice or publication status.");
 const [notice]=await db.update(studentNotices).set({published:body.published,updatedAt:new Date()}).where(eq(studentNotices.id,id)).returning({id:studentNotices.id});
 if(!notice)throw new FeeError("Notice not found.",404);
 return NextResponse.json({success:true});
 }catch(e){return feeResponse(e);}
}
export const dynamic="force-dynamic";
