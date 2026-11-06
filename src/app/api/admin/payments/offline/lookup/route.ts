import { NextRequest, NextResponse } from "next/server";
import { adminIdentity, feeResponse } from "@/lib/fees/auth";
import { FeeError } from "@/lib/fees/rules";
import { portal } from "@/lib/fees/service";
import { searchReceivingPeople, receivingOptions } from "@/lib/fees/offline";
import { db } from "@/db";
import { applications, students } from "@/db/schema";
import { eq } from "drizzle-orm";
export async function GET(req:NextRequest) {
  try {
    const adminId=adminIdentity(req), params=req.nextUrl.searchParams;
    const studentId=Number(params.get("studentId")) || undefined;
    const applicationId=Number(params.get("applicationId")) || undefined;
    if (studentId || applicationId) {
      if (studentId && applicationId) throw new FeeError("Select either an application or student.");
      const result=await portal({adminId},{studentId,applicationId});
      const [application]=result.person.applicationId ? await db.select({fatherName:applications.fatherName,motherName:applications.motherName}).from(applications).where(eq(applications.id,result.person.applicationId)) : [];
      // Preserve historical student parent details where an application was not linked.
      return NextResponse.json({detail:result,parents:{fatherName:application?.fatherName||"",motherName:application?.motherName||""}});
    }
    const search=params.get("search") || "";
    const [people,staff]=await Promise.all([searchReceivingPeople(search),receivingOptions()]);
    return NextResponse.json({people,staff});
  } catch(error) { return feeResponse(error); }
}
export const dynamic="force-dynamic";
