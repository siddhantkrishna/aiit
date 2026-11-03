import { eq } from "drizzle-orm";
import { db } from "@/db";
import { centres, staff, students, applications, courses, universities } from "@/db/schema";

export async function invalidReference(value: Record<string, unknown>) {
  for (const key of ["centreId", "staffId", "assignedTo", "managerId", "ownerId", "requestedBy", "assignedStaffId", "studentId", "relatedStudentId", "applicationId", "courseId", "interestedCourseId", "universityId", "preferredUniversityId"]) {
    if (value[key] == null || value[key] === "") continue;
    const table = key === "centreId" ? centres : ["studentId", "relatedStudentId"].includes(key) ? students : key === "applicationId" ? applications : ["courseId", "interestedCourseId"].includes(key) ? courses : ["universityId", "preferredUniversityId"].includes(key) ? universities : staff;
    const [row] = await db.select({ id: table.id }).from(table).where(eq(table.id, Number(value[key]))).limit(1);
    if (!row) return `Selected ${key.replace(/Id$/, "")} does not exist.`;
  }
  return null;
}
