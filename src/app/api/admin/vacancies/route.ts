import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { vacancies } from "@/db/schema";
import { desc } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "aiit-college-admin-secret-2025";

export async function GET(req: NextRequest) {
  const token=req.cookies.get("admin_token")?.value;
  if(!token)return NextResponse.json({error:"Unauthorized"},{status:401});
  try{jwt.verify(token,JWT_SECRET);return NextResponse.json(await db.select().from(vacancies).orderBy(desc(vacancies.createdAt)));}
  catch{return NextResponse.json({error:"Unauthorized"},{status:401});}
}
