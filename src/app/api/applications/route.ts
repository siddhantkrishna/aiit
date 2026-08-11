import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, documents } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { generateApplicationId } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedPaymentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function GET() {
  try {
    const all = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));

    return NextResponse.json(all);
  } catch (error) {
    console.error("Error fetching applications:", error);

    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    /*
     * ============================================================
     * MODE 1: PAYMENT SCREENSHOT UPLOAD
     * ============================================================
     *
     * If applicationId is provided, this request is only for
     * uploading the payment screenshot after the application
     * has already been submitted.
     */

    const existingApplicationId = formData.get("applicationId");

    if (
      typeof existingApplicationId === "string" &&
      existingApplicationId.trim() !== ""
    ) {
      const applicationId = existingApplicationId.trim();

      const paymentScreenshot = formData.get("paymentScreenshot");

      if (
        !(paymentScreenshot instanceof File) ||
        paymentScreenshot.size === 0
      ) {
        return NextResponse.json(
          {
            error: "Payment screenshot is required.",
          },
          { status: 400 }
        );
      }

      if (!allowedPaymentTypes.includes(paymentScreenshot.type)) {
        return NextResponse.json(
          {
            error: "Payment screenshot must be JPG, PNG, or WebP.",
          },
          { status: 400 }
        );
      }

      if (paymentScreenshot.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: "Payment screenshot must be less than 5MB.",
          },
          { status: 400 }
        );
      }

      // Confirm the application exists.
      const existingApplication = await db
        .select()
        .from(applications)
        .where(eq(applications.applicationId, applicationId));

      if (existingApplication.length === 0) {
        return NextResponse.json(
          {
            error: "Application not found.",
          },
          { status: 404 }
        );
      }

      const paymentExtension =
        paymentScreenshot.type === "image/png"
          ? "png"
          : paymentScreenshot.type === "image/webp"
            ? "webp"
            : "jpg";

      const paymentObjectPath =
        `${applicationId}/payment-screenshot.${paymentExtension}`;

      const paymentBuffer = Buffer.from(
        await paymentScreenshot.arrayBuffer()
      );

      /*
       * Use upsert here so the applicant can replace an incorrect
       * screenshot if necessary.
       */
      const { error: paymentUploadError } =
        await supabase.storage
          .from("payment-screenshots")
          .upload(paymentObjectPath, paymentBuffer, {
            contentType: paymentScreenshot.type,
            upsert: true,
          });

      if (paymentUploadError) {
        console.error(
          "Payment screenshot upload error:",
          paymentUploadError
        );

        return NextResponse.json(
          {
            error:
              "Failed to upload payment screenshot. Please try again.",
          },
          { status: 500 }
        );
      }

      // Update the existing application.
      const updated = await db
        .update(applications)
        .set({
          paymentScreenshotPath: paymentObjectPath,
          paymentScreenshotUploadedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(applications.applicationId, applicationId))
        .returning();

      return NextResponse.json({
        success: true,
        applicationId,
        application: updated[0],
      });
    }

    /*
     * ============================================================
     * MODE 2: CREATE NEW APPLICATION
     * ============================================================
     *
     * Payment is NOT required here anymore.
     */

    if (formData.get("declaration") !== "true") {
      return NextResponse.json(
        {
          error: "Please accept the declaration to submit.",
        },
        { status: 400 }
      );
    }

    const courseIdValue = formData.get("courseId");

    if (!courseIdValue) {
      return NextResponse.json(
        {
          error: "Please select a course.",
        },
        { status: 400 }
      );
    }

    const applicationId = generateApplicationId();

    const newApp = await db
      .insert(applications)
      .values({
        applicationId,

        courseId: parseInt(courseIdValue as string),

        universityId: formData.get("universityId")
          ? parseInt(formData.get("universityId") as string)
          : null,

        studyMode: formData.get("studyMode") as string,

        firstName: formData.get("firstName") as string,
        lastName: (formData.get("lastName") as string) || "",

        fatherName: formData.get("fatherName") as string,
        motherName: formData.get("motherName") as string,

        dob: formData.get("dob") as string,
        gender: formData.get("gender") as string,

        mobile: formData.get("mobile") as string,
        email: (formData.get("email") as string) || "",

        address: formData.get("address") as string,
        city: formData.get("city") as string,
        state: formData.get("state") as string,
        pinCode: formData.get("pinCode") as string,

        tenthBoard:
          (formData.get("tenthBoard") as string) || "",
        tenthYear:
          (formData.get("tenthYear") as string) || "",
        tenthPercentage:
          (formData.get("tenthPercentage") as string) || "",

        twelfthBoard:
          (formData.get("twelfthBoard") as string) || "",
        twelfthYear:
          (formData.get("twelfthYear") as string) || "",
        twelfthPercentage:
          (formData.get("twelfthPercentage") as string) || "",

        gradUniversity:
          (formData.get("gradUniversity") as string) || "",
        gradYear:
          (formData.get("gradYear") as string) || "",
        gradPercentage:
          (formData.get("gradPercentage") as string) || "",

        // Payment is intentionally empty at this stage.
        paymentScreenshotPath: null,
        paymentScreenshotUploadedAt: null,

        status: "pending",
        declaration: true,
      })
      .returning();

    /*
     * ============================================================
     * UPLOAD APPLICATION DOCUMENTS
     * ============================================================
     */

    const fileFields = [
      "photo",
      "aadhaar",
      "tenthMarksheet",
      "twelfthMarksheet",
      "gradMarksheet",
      "otherDoc",
    ];

    for (const field of fileFields) {
      const file = formData.get(field) as File | null;

      if (!file || file.size === 0) {
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        console.error(`File too large: ${field}`);
        continue;
      }

      const buffer = Buffer.from(
        await file.arrayBuffer()
      );

      const ext =
        file.name.split(".").pop()?.toLowerCase() || "pdf";

      const objectPath =
        `${applicationId}/${field}.${ext}`;

      const { error: uploadError } =
        await supabase.storage
          .from("documents")
          .upload(objectPath, buffer, {
            contentType:
              file.type || "application/octet-stream",
            upsert: true,
          });

      if (uploadError) {
        console.error(
          `Document upload error (${field}):`,
          uploadError
        );
        continue;
      }

      const { data: publicUrl } =
        supabase.storage
          .from("documents")
          .getPublicUrl(objectPath);

      await db.insert(documents).values({
        applicationId,
        docType: field,
        fileName: file.name,
        filePath: publicUrl.publicUrl,
        fileSize: file.size,
      });
    }

    /*
     * Application is now created.
     * Applicant will see the pending page and payment QR.
     */

    return NextResponse.json({
      success: true,
      applicationId,
      application: newApp[0],
    });
  } catch (error) {
    console.error(
      "Error processing application:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to process application",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";