import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { onlineExamAttempts, onlineExams } from "@/db/schema";
import { getStudentFromRequest } from "@/lib/student-auth";

type Question = { id: string; question: string; options: string[]; correctAnswer?: number; marks?: number };

function publicQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((q, index) => ({
    id: String(q?.id || `q-${index + 1}`),
    question: String(q?.question || ""),
    options: Array.isArray(q?.options) ? q.options.map((x: unknown) => String(x)) : [],
    marks: Math.max(1, Number(q?.marks || 1)),
  })).filter(q => q.question && q.options.length >= 2);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = getStudentFromRequest(_req);
    if (!sessionId) return NextResponse.json({ error: "Student login required." }, { status: 401 });
    const id = Number((await params).id);
    const [exam] = await db.select().from(onlineExams).where(and(eq(onlineExams.id, id), eq(onlineExams.published, true)));
    if (!exam) return NextResponse.json({ error: "Exam not found." }, { status: 404 });
    const [attempt] = await db.select({ id: onlineExamAttempts.id, attemptStatus: onlineExamAttempts.attemptStatus, score: onlineExamAttempts.score, resultStatus: onlineExamAttempts.resultStatus }).from(onlineExamAttempts).where(and(eq(onlineExamAttempts.examId, id), eq(onlineExamAttempts.studentId, Number(sessionId))));
    return NextResponse.json({ exam: { ...exam, questions: publicQuestions(exam.questions) }, attempt: attempt || null });
  } catch (error) {
    console.error("Failed to load exam:", error);
    return NextResponse.json({ error: "Unable to load exam." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = getStudentFromRequest(req);
    if (!sessionId) return NextResponse.json({ error: "Student login required." }, { status: 401 });
    const id = Number((await params).id);
    const body = await req.json();
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const [exam] = await db.select().from(onlineExams).where(and(eq(onlineExams.id, id), eq(onlineExams.published, true)));
    if (!exam) return NextResponse.json({ error: "Exam not found." }, { status: 404 });

    const now = Date.now();
    if (exam.startsAt && now < new Date(exam.startsAt).getTime()) return NextResponse.json({ error: "This exam has not started yet." }, { status: 400 });
    if (exam.endsAt && now > new Date(exam.endsAt).getTime()) return NextResponse.json({ error: "This exam is closed." }, { status: 400 });

    const [existing] = await db.select().from(onlineExamAttempts).where(and(eq(onlineExamAttempts.examId, id), eq(onlineExamAttempts.studentId, Number(sessionId))));
    if (existing?.attemptStatus === "SUBMITTED") return NextResponse.json({ error: "You have already submitted this exam." }, { status: 409 });

    const questions = Array.isArray(exam.questions) ? exam.questions as Question[] : [];
    let score = 0;
    for (const q of questions) {
      const answer = Number(answers[String(q.id)] ?? answers[q.id]);
      if (Number.isInteger(answer) && answer === Number(q.correctAnswer)) score += Math.max(1, Number(q.marks || 1));
    }

    const resultStatus = score >= Number(exam.passingMarks || 0) ? "PASS" : "FAIL";
    const values = { answers, score: String(score), resultStatus, attemptStatus: "SUBMITTED", submittedAt: new Date(), updatedAt: new Date() };
    if (existing) {
      const [attempt] = await db.update(onlineExamAttempts).set(values).where(eq(onlineExamAttempts.id, existing.id)).returning();
      return NextResponse.json({ success: true, attempt, score, resultStatus });
    }
    const [attempt] = await db.insert(onlineExamAttempts).values({ examId: id, studentId: Number(sessionId), ...values }).returning();
    return NextResponse.json({ success: true, attempt, score, resultStatus }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit exam:", error);
    return NextResponse.json({ error: "Unable to submit exam." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
