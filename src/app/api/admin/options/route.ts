import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff, centres, students, courses, universities, applications } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [employees, branches, enrolled, programs, institutions, applicants] = await Promise.all([
      db.select({ id: staff.id, label: staff.name }).from(staff), db.select({ id: centres.id, label: centres.name }).from(centres),
      db.select({ id: students.id, code: students.studentId, first: students.firstName, last: students.lastName }).from(students),
      db.select({ id: courses.id, label: courses.name }).from(courses), db.select({ id: universities.id, label: universities.name }).from(universities),
      db.select({ id: applications.id, label: applications.applicationId }).from(applications),
    ]);
    return NextResponse.json({ staff: employees, centres: branches, students: enrolled.map(s => ({ id: s.id, label: `${s.code} - ${s.first || ""} ${s.last || ""}` })), courses: programs, universities: institutions, applications: applicants });
  } catch { return NextResponse.json({ error: "Unable to load choices." }, { status: 503 }); }
}
export const dynamic = "force-dynamic";
