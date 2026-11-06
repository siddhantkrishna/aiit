import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studentServices } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";
import { adminIdentity, feeResponse, sameOrigin } from "@/lib/fees/auth";
import { FeeError } from "@/lib/fees/rules";

export async function GET(req: NextRequest) {
  try {
    adminIdentity(req);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(
            studentServices.serviceType,
            `%${search}%`,
          ),
          ilike(
            studentServices.referenceNumber,
            `%${search}%`,
          ),
          ilike(
            studentServices.notes,
            `%${search}%`,
          ),
          ilike(
            studentServices.remarks,
            `%${search}%`,
          ),
        ),
      );
    }

    if (status && status !== "ALL") {
      conditions.push(
        eq(studentServices.status, status),
      );
    }

    const rows = await db
      .select()
      .from(studentServices)
      .where(
        conditions.length
          ? or(...conditions)
          : undefined,
      )
      .orderBy(desc(studentServices.requestedAt));

    return NextResponse.json(rows);
  } catch (error) { return feeResponse(error); }
}

export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    adminIdentity(req);
    const body = await req.json();

    const studentId = Number(body.studentId);
    const serviceType = String(
      body.serviceType || "",
    ).trim();

    if (!studentId || !serviceType) {
      return NextResponse.json(
        {
          error:
            "Student ID and service type are required.",
        },
        { status: 400 },
      );
    }

    const [service] = await db
      .insert(studentServices)
      .values({
        studentId,

        serviceType,

        status: String(
          body.status || "PENDING",
        ),

        priority: String(
          body.priority || "NORMAL",
        ),

        requestedAt: body.requestedAt
          ? new Date(body.requestedAt)
          : new Date(),

        dueDate:
          body.dueDate || null,

        completedAt: body.completedAt
          ? new Date(body.completedAt)
          : null,

        ownerId: body.ownerId
          ? Number(body.ownerId)
          : null,

        assignedTo: body.assignedTo
          ? Number(body.assignedTo)
          : null,

        requestedBy: body.requestedBy
          ? Number(body.requestedBy)
          : null,

        referenceNumber:
          String(
            body.referenceNumber || "",
          ).trim() || null,

        notes:
          String(body.notes || "").trim() || null,

        remarks:
          String(body.remarks || "").trim() || null,

        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        service,
      },
      { status: 201 },
    );
  } catch (error) { return feeResponse(error); }
}

export async function PATCH(req: NextRequest) {
 try{
  sameOrigin(req);adminIdentity(req);
  const body=await req.json();
  const id=Number(body.id);
  const status=String(body.status||"");
  const remarks=String(body.remarks||"").trim();
  if(!Number.isSafeInteger(id)||id<1||!["PENDING","IN PROGRESS","COMPLETED","CANCELLED"].includes(status)||remarks.length>1000)throw new FeeError("Invalid request status or remarks.");
  const [updated]=await db.update(studentServices).set({status,remarks:remarks||null,completedAt:status==="COMPLETED"?new Date():null,updatedAt:new Date()}).where(eq(studentServices.id,id)).returning({id:studentServices.id});
  if(!updated)throw new FeeError("Request not found.",404);
  return NextResponse.json({success:true});
 }catch(e){return feeResponse(e);}
}
export const dynamic = "force-dynamic";