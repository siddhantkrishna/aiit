import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, courses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { generateApplicationId } from "@/lib/utils";

const MAX_PAYMENT_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PAYMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type ApplicationPayload = {
  applicationId?: unknown;
  courseId?: unknown;
  universityId?: unknown;
  studyMode?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  fatherName?: unknown;
  motherName?: unknown;
  dob?: unknown;
  gender?: unknown;
  mobile?: unknown;
  email?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  pinCode?: unknown;
  tenthBoard?: unknown;
  tenthYear?: unknown;
  tenthPercentage?: unknown;
  twelfthBoard?: unknown;
  twelfthYear?: unknown;
  twelfthPercentage?: unknown;
  gradUniversity?: unknown;
  gradYear?: unknown;
  gradPercentage?: unknown;
  declaration?: unknown;
};

function asString(value: unknown): string {
  return String(value ?? "").trim();
}

async function uploadPaymentScreenshot(applicationId: string, file: File) {
  if (file.size === 0) {
    return { error: "Payment screenshot is empty." };
  }

  if (file.size > MAX_PAYMENT_FILE_SIZE) {
    return { error: "Payment screenshot must be less than 5MB." };
  }

  if (!ALLOWED_PAYMENT_TYPES.includes(file.type)) {
    return { error: "Payment screenshot must be JPG, PNG, or WebP." };
  }

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

  const objectPath = `applications/${applicationId}/payment-screenshot.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Payment screenshot upload error:", uploadError);
    return { error: "Failed to upload payment screenshot." };
  }

  const { data } = supabase.storage
    .from("documents")
    .getPublicUrl(objectPath);

  return { publicUrl: data.publicUrl };
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching applications:", error);

    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const paymentScreenshot = formData.get("paymentScreenshot");
      const existingApplicationId = asString(
        formData.get("applicationId"),
      );

      if (
        existingApplicationId &&
        paymentScreenshot instanceof File &&
        paymentScreenshot.size > 0
      ) {
        const [existingApplication] = await db
          .select()
          .from(applications)
          .where(
            eq(applications.applicationId, existingApplicationId),
          );

        if (!existingApplication) {
          return NextResponse.json(
            { error: "Application not found." },
            { status: 404 },
          );
        }

        const upload = await uploadPaymentScreenshot(
          existingApplicationId,
          paymentScreenshot,
        );

        if ("error" in upload) {
          return NextResponse.json(
            { error: upload.error },
            { status: 500 },
          );
        }

        const [updatedApplication] = await db
          .update(applications)
          .set({
            paymentScreenshotPath: upload.publicUrl,
            paymentScreenshotUploadedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            eq(applications.applicationId, existingApplicationId),
          )
          .returning();

        return NextResponse.json({
          success: true,
          applicationId: existingApplicationId,
          application: updatedApplication,
        });
      }

      const payload: ApplicationPayload = {
        courseId: formData.get("courseId"),
        universityId: formData.get("universityId"),
        studyMode: formData.get("studyMode"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        fatherName: formData.get("fatherName"),
        motherName: formData.get("motherName"),
        dob: formData.get("dob"),
        gender: formData.get("gender"),
        mobile: formData.get("mobile"),
        email: formData.get("email"),
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        pinCode: formData.get("pinCode"),
        tenthBoard: formData.get("tenthBoard"),
        tenthYear: formData.get("tenthYear"),
        tenthPercentage: formData.get("tenthPercentage"),
        twelfthBoard: formData.get("twelfthBoard"),
        twelfthYear: formData.get("twelfthYear"),
        twelfthPercentage: formData.get("twelfthPercentage"),
        gradUniversity: formData.get("gradUniversity"),
        gradYear: formData.get("gradYear"),
        gradPercentage: formData.get("gradPercentage"),
        declaration: formData.get("declaration"),
      };

      const courseId = Number(payload.courseId);
      const universityValue = asString(payload.universityId);
      const universityId = universityValue ? Number(universityValue) : null;
      const declaration = payload.declaration === "true";

      if (
        !Number.isInteger(courseId) ||
        courseId < 1 ||
        !asString(payload.firstName) ||
        !asString(payload.fatherName) ||
        !asString(payload.motherName) ||
        !asString(payload.dob) ||
        !asString(payload.gender) ||
        !asString(payload.mobile) ||
        !asString(payload.address) ||
        !asString(payload.city) ||
        !asString(payload.state) ||
        !asString(payload.pinCode)
      ) {
        return NextResponse.json(
          { error: "Please complete all required fields." },
          { status: 400 },
        );
      }

      if (!declaration) {
        return NextResponse.json(
          { error: "Please accept the declaration." },
          { status: 400 },
        );
      }

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId));

      if (!course || !course.enabled) {
        return NextResponse.json(
          { error: "Selected course is not available." },
          { status: 400 },
        );
      }

      const applicationId = generateApplicationId();

      const [application] = await db
        .insert(applications)
        .values({
          applicationId,
          courseId,
          universityId:
            universityId && Number.isInteger(universityId)
              ? universityId
              : null,
          studyMode: asString(payload.studyMode) || null,
          firstName: asString(payload.firstName),
          lastName: asString(payload.lastName),
          fatherName: asString(payload.fatherName),
          motherName: asString(payload.motherName),
          dob: asString(payload.dob),
          gender: asString(payload.gender),
          mobile: asString(payload.mobile),
          email: asString(payload.email),
          address: asString(payload.address),
          city: asString(payload.city),
          state: asString(payload.state),
          pinCode: asString(payload.pinCode),
          tenthBoard: asString(payload.tenthBoard) || null,
          tenthYear: asString(payload.tenthYear) || null,
          tenthPercentage: asString(payload.tenthPercentage) || null,
          twelfthBoard: asString(payload.twelfthBoard) || null,
          twelfthYear: asString(payload.twelfthYear) || null,
          twelfthPercentage:
            asString(payload.twelfthPercentage) || null,
          gradUniversity:
            asString(payload.gradUniversity) || null,
          gradYear: asString(payload.gradYear) || null,
          gradPercentage:
            asString(payload.gradPercentage) || null,
          declaration: true,
          status: "pending",
        })
        .returning();

      return NextResponse.json(
        {
          success: true,
          applicationId,
          application,
        },
        { status: 201 },
      );
    }

    const body = (await req.json()) as ApplicationPayload;
    const courseId = Number(body.courseId);
    const universityValue = asString(body.universityId);
    const universityId = universityValue ? Number(universityValue) : null;

    if (
      !Number.isInteger(courseId) ||
      courseId < 1 ||
      !asString(body.firstName) ||
      !asString(body.fatherName) ||
      !asString(body.motherName) ||
      !asString(body.dob) ||
      !asString(body.gender) ||
      !asString(body.mobile) ||
      !asString(body.address) ||
      !asString(body.city) ||
      !asString(body.state) ||
      !asString(body.pinCode)
    ) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 },
      );
    }

    if (body.declaration !== true && body.declaration !== "true") {
      return NextResponse.json(
        { error: "Please accept the declaration." },
        { status: 400 },
      );
    }

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course || !course.enabled) {
      return NextResponse.json(
        { error: "Selected course is not available." },
        { status: 400 },
      );
    }

    const applicationId =
      asString(body.applicationId) || generateApplicationId();

    const [application] = await db
      .insert(applications)
      .values({
        applicationId,
        courseId,
        universityId:
          universityId && Number.isInteger(universityId)
            ? universityId
            : null,
        studyMode: asString(body.studyMode) || null,
        firstName: asString(body.firstName),
        lastName: asString(body.lastName),
        fatherName: asString(body.fatherName),
        motherName: asString(body.motherName),
        dob: asString(body.dob),
        gender: asString(body.gender),
        mobile: asString(body.mobile),
        email: asString(body.email),
        address: asString(body.address),
        city: asString(body.city),
        state: asString(body.state),
        pinCode: asString(body.pinCode),
        tenthBoard: asString(body.tenthBoard) || null,
        tenthYear: asString(body.tenthYear) || null,
        tenthPercentage: asString(body.tenthPercentage) || null,
        twelfthBoard: asString(body.twelfthBoard) || null,
        twelfthYear: asString(body.twelfthYear) || null,
        twelfthPercentage:
          asString(body.twelfthPercentage) || null,
        gradUniversity:
          asString(body.gradUniversity) || null,
        gradYear: asString(body.gradYear) || null,
        gradPercentage:
          asString(body.gradPercentage) || null,
        declaration: true,
        status: "pending",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        applicationId,
        application,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating application:", error);

    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
