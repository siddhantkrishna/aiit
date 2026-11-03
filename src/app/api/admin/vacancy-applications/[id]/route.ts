import { signDocument } from "@/lib/private-storage";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/db";
import { vacancyApplications, vacancies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest,{params}:{params:Promise<{id:string}>}) {
  if(!requireAdmin(req))return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const result=await db.select({application:vacancyApplications,vacancy:vacancies}).from(vacancyApplications).leftJoin(vacancies,eq(vacancyApplications.vacancyId,vacancies.id)).where(eq(vacancyApplications.applicationId,id));
  if(!result[0])return NextResponse.json({error:"Application not found"},{status:404});
  try {
    result[0].application.resumePath = await signDocument(result[0].application.resumePath);
    return NextResponse.json(result[0]);
  } catch { return NextResponse.json({ error: "Unable to open secure resume. Check private storage setup." }, { status: 503 }); }
}
