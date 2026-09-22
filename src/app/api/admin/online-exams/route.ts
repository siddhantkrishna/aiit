import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { onlineExams } from "@/db/schema";

function text(value: unknown) { return String(value ?? "").trim(); }
function parseQuestions(value: unknown) {
  const source = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(source) || source.length === 0) throw new Error("Questions must be a non-empty JSON array.");
  return source.map((q, index) => {
    if (!q || !String(q.question || "").trim() || !Array.isArray(q.options) || q.options.length < 2 || !Number.isInteger(Number(q.correctAnswer))) throw new Error(`Invalid question ${index + 1}.`);
    const correct = Number(q.correctAnswer);
    if (correct < 0 || correct >= q.options.length) throw new Error(`Invalid correctAnswer in question ${index + 1}.`);
    return { id: String(q.id || `q-${index + 1}`), question: String(q.question).trim(), options: q.options.map((x: unknown) => String(x)), correctAnswer: correct, marks: Math.max(1, Number(q.marks || 1)) };
  });
}

export async function GET() {
  try { return NextResponse.json(await db.select().from(onlineExams).orderBy(desc(onlineExams.createdAt))); }
  catch (error) { console.error(error); return NextResponse.json({ error: "Failed to load exams." }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); const title=text(body.title); const examCode=text(body.examCode).toUpperCase();
    if(!title||!examCode) return NextResponse.json({error:"Exam title and code are required."},{status:400});
    let questions; try{questions=parseQuestions(body.questions)}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Invalid questions JSON.'},{status:400})}
    const totalMarks=questions.reduce((sum:number,q:any)=>sum+q.marks,0);
    const [exam]=await db.insert(onlineExams).values({
      examCode,title,instructions:text(body.instructions)||null,courseId:body.courseId?Number(body.courseId):null,
      startsAt:text(body.startsAt)?new Date(body.startsAt):null,endsAt:text(body.endsAt)?new Date(body.endsAt):null,
      durationMinutes:Math.max(1,Number(body.durationMinutes||60)),totalMarks,passingMarks:Math.max(0,Number(body.passingMarks||Math.ceil(totalMarks*0.4))),questions,published:Boolean(body.published),updatedAt:new Date()
    }).returning();
    return NextResponse.json({success:true,exam},{status:201});
  } catch(error){console.error(error);return NextResponse.json({error:error instanceof Error?error.message:'Failed to create exam.'},{status:500});}
}

export async function DELETE(req: NextRequest){try{const id=Number(req.nextUrl.searchParams.get('id'));if(!id)return NextResponse.json({error:'Valid exam ID required.'},{status:400});await db.delete(onlineExams).where(eq(onlineExams.id,id));return NextResponse.json({success:true})}catch(error){console.error(error);return NextResponse.json({error:'Failed to delete exam.'},{status:500})}}

export const dynamic = "force-dynamic";
