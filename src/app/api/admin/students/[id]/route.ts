import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, studentDocuments, documents, applications, payments, studentServices, studentResults, courses, universities, centres } from "@/db/schema";
import { eq, desc, getTableColumns } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { id } from "@/lib/validation";
import { signDocument } from "@/lib/private-storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const parsed = id.safeParse((await params).id);
    if (!parsed.success) return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    const { accessCodeHash, ...columns } = getTableColumns(students);
    const [record] = await db.select({ student: columns, course: courses.name, university: universities.name, centre: centres.name }).from(students)
      .leftJoin(courses, eq(students.courseId, courses.id)).leftJoin(universities, eq(students.universityId, universities.id)).leftJoin(centres, eq(students.centreId, centres.id)).where(eq(students.id, parsed.data));
    if (!record) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    const [studentDocs, appDocs, history, services, results] = await Promise.all([
      db.select().from(studentDocuments).where(eq(studentDocuments.studentId, parsed.data)),
      record.student.applicationId ? db.select({ document: documents }).from(documents).innerJoin(applications, eq(documents.applicationId, applications.applicationId)).where(eq(applications.id, record.student.applicationId)) : [],
      db.select().from(payments).where(eq(payments.studentId, parsed.data)).orderBy(desc(payments.paymentDate)),
      db.select().from(studentServices).where(eq(studentServices.studentId, parsed.data)),
      db.select().from(studentResults).where(eq(studentResults.studentId, parsed.data)),
    ]);
    const docs = [...studentDocs.map(d => ({ id: d.id, source: "student", name: d.fileName || d.documentType, type: d.documentType, path: d.storagePath, status: d.verificationStatus })), ...appDocs.map(({ document: d }) => ({ id: d.id, source: "application", name: d.fileName, type: d.docType, path: d.filePath, status: record.student.documentStatus }))];
    return NextResponse.json({ ...record, student: { ...record.student, admitCardPath: await signDocument(record.student.admitCardPath) },
      documents: await Promise.all(docs.map(async d => ({ ...d, path: await signDocument(d.path) }))),
      payments: history.map(({ proofPath, ...row }) => row), services, results,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Unable to load student record. Check secure storage access." }, { status: 503 }); }
}
export const dynamic = "force-dynamic";
