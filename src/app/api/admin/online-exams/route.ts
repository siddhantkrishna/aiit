import { NextRequest, NextResponse } from "next/server";
import { adminIdentity,feeResponse,sameOrigin } from "@/lib/fees/auth";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { onlineExams } from "@/db/schema";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function parseQuestions(value: unknown): Question[] {
  const source: unknown = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(source) || source.length < 1 || source.length > 100) {
    throw new Error("An exam must contain between 1 and 100 questions.");
  }

  const ids = new Set<string>();
  return source.map((entry: unknown, index: number) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`Question ${index + 1} is invalid.`);
    }
    const raw = entry as Record<string, unknown>;
    const id = text(raw.id) || `q-${index + 1}`;
    const question = text(raw.question);
    const options = Array.isArray(raw.options)
      ? raw.options.map((option: unknown) => text(option))
      : [];
    const correctAnswer = Number(raw.correctAnswer);
    const marks = raw.marks === undefined ? 1 : Number(raw.marks);

    if (!question || options.length < 2 || options.length > 6 || options.some((option: string) => !option)) {
      throw new Error(`Question ${index + 1} needs a prompt and 2–6 filled answer options.`);
    }
    if (new Set(options.map((option: string) => option.toLowerCase())).size !== options.length) {
      throw new Error(`Question ${index + 1} has duplicate answer options.`);
    }
    if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
      throw new Error(`Choose a valid correct answer for question ${index + 1}.`);
    }
    if (!Number.isInteger(marks) || marks < 1 || marks > 100) {
      throw new Error(`Question ${index + 1} needs 1–100 marks.`);
    }
    if (ids.has(id)) throw new Error("Question IDs must be unique.");
    ids.add(id);
    return { id, question, options, correctAnswer, marks };
  });
}

export async function GET(req:NextRequest) {
  try {
    adminIdentity(req);
    const rows = await db.select().from(onlineExams).orderBy(desc(onlineExams.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error && error.name==="FeeError") return feeResponse(error);
    console.error("Failed to load exams:", error);
    return NextResponse.json({ error: "Failed to load exams." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req); adminIdentity(req);
    const body = await req.json();
    const title = text(body.title);
    const examCode = text(body.examCode).toUpperCase();
    if (!title || !examCode) {
      return NextResponse.json({ error: "Exam title and code are required." }, { status: 400 });
    }

    let questions: Question[];
    try {
      questions = parseQuestions(body.questions);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid questions." }, { status: 400 });
    }

    const durationMinutes = Number(body.durationMinutes ?? 60);
    const totalMarks = questions.reduce((total, question) => total + question.marks, 0);
    const passingMarks = text(body.passingMarks) === ""
      ? Math.ceil(totalMarks * 0.4)
      : Number(body.passingMarks);
    const startsAt = text(body.startsAt) ? new Date(body.startsAt) : null;
    const endsAt = text(body.endsAt) ? new Date(body.endsAt) : null;

    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
      return NextResponse.json({ error: "Duration must be between 1 and 600 minutes." }, { status: 400 });
    }
    if (!Number.isInteger(passingMarks) || passingMarks < 0 || passingMarks > totalMarks) {
      return NextResponse.json({ error: "Passing marks must be between 0 and the total marks." }, { status: 400 });
    }
    if ((startsAt && Number.isNaN(startsAt.getTime())) || (endsAt && Number.isNaN(endsAt.getTime())) ||
        (startsAt && endsAt && endsAt <= startsAt)) {
      return NextResponse.json({ error: "Enter valid exam dates; the end must be after the start." }, { status: 400 });
    }

    const [exam] = await db.insert(onlineExams).values({
      examCode,
      title,
      instructions: text(body.instructions) || null,
      startsAt,
      endsAt,
      durationMinutes,
      totalMarks,
      passingMarks,
      questions,
      published: body.published === true,
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name==="FeeError") return feeResponse(error);
    console.error("Failed to create exam:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "This exam code already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create exam." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    sameOrigin(req); adminIdentity(req);
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "A valid exam ID is required." }, { status: 400 });
    }
    const deleted = await db.delete(onlineExams).where(eq(onlineExams.id, id)).returning({ id: onlineExams.id });
    if (!deleted.length) return NextResponse.json({ error: "Exam not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name==="FeeError") return feeResponse(error);
    console.error("Failed to delete exam:", error);
    return NextResponse.json({ error: "Failed to delete exam." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
