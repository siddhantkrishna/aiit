import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { universities, universityFeeSources } from "@/db/schema";
import { adminIdentity, feeResponse } from "@/lib/fees/auth";

export async function GET(req:NextRequest) {
  try {
    adminIdentity(req);
    const rows=await db.select({
      id:universityFeeSources.id,
      universityId:universityFeeSources.universityId,
      universityName:universities.name,
      sourceFile:universityFeeSources.sourceFile,
      sourceSheet:universityFeeSources.sourceSheet,
      sourceRow:universityFeeSources.sourceRow,
      courseName:universityFeeSources.courseName,
      studyMode:universityFeeSources.studyMode,
      feeBasis:universityFeeSources.feeBasis,
      listedAmountPaise:universityFeeSources.listedAmountPaise,
      componentBreakdown:universityFeeSources.componentBreakdown,
      duration:universityFeeSources.duration,
      eligibility:universityFeeSources.eligibility,
      reviewStatus:universityFeeSources.reviewStatus,
      reviewNote:universityFeeSources.reviewNote,
    }).from(universityFeeSources)
      .innerJoin(universities,eq(universities.id,universityFeeSources.universityId))
      .orderBy(asc(universityFeeSources.universityId),asc(universityFeeSources.sourceFile),asc(universityFeeSources.sourceSheet),asc(universityFeeSources.sourceRow));
    return NextResponse.json({rows},{headers:{"cache-control":"private,no-store"}});
  } catch(error) { return feeResponse(error); }
}
export const dynamic="force-dynamic";
