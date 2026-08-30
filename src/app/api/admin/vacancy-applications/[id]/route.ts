import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { vacancyApplications, vacancies } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "aiit-college-admin-secret-2025";
function authorized(req: NextRequest) { const token=req.cookies.get("admin_token")?.value; if(!token)return false; try{jwt.verify(token,JWT_SECRET);return true}catch{return false} }

export async function GET(req: NextRequest,{params}:{params:Promise<{id:string}>}) {
  if(!authorized(req))return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const result=await db.select({application:vacancyApplications,vacancy:vacancies}).from(vacancyApplications).leftJoin(vacancies,eq(vacancyApplications.vacancyId,vacancies.id)).where(eq(vacancyApplications.applicationId,id));
  if(!result[0])return NextResponse.json({error:"Application not found"},{status:404});
  return NextResponse.json(result[0]);
}
