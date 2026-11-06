import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { students } from "@/db/schema";
import { adminIdentity, feeResponse } from "@/lib/fees/auth";
import { FeeError } from "@/lib/fees/rules";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}) {try {
  adminIdentity(req);const [student]=await db.select().from(students).where(eq(students.id,Number((await params).id)));
  if(!student)throw new FeeError("Student not found.",404);
  return NextResponse.json(student);
} catch(error) {return feeResponse(error);} }
