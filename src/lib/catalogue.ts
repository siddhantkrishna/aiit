import { and, eq, isNull, or, sql } from "drizzle-orm";
import { courses, universities } from "@/db/schema";

export const publicUniversity = and(eq(universities.enabled, true), eq(universities.authorizationStatus, "VERIFIED"));
export const publicCourse = and(eq(courses.enabled, true), eq(courses.verificationStatus, "VERIFIED"),
  or(isNull(courses.universityId), sql`exists (select 1 from universities u where u.id = ${courses.universityId} and u.enabled = true and u.authorization_status = 'VERIFIED')`));
