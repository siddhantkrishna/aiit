import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, documents } from "@/db/schema";
import { desc } from "drizzle-orm";
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

    const paymentScreenshot = formData.get("paymentScreenshot");

    if (!(paymentScreenshot instanceof File) || paymentScreenshot.size === 0) {
      return NextResponse.json(
        {
          error:
            "Payment screenshot is required before submitting the application.",
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

    if (formData.get("declaration") !== "true") {
      return NextResponse.json(
        {
          error: "Please accept the declaration to submit.",
        },
        { status: 400 }
      );
    }

    const applicationId = generateApplicationId();

    const paymentExtension =
      paymentScreenshot.type === "image/png"
        ? "png"
        : paymentScreenshot.type === "image/webp"
          ? "webp"
          : "jpg";

    const paymentObjectPath = `${applicationId}/payment-screenshot.${paymentExtension}`;

    const paymentBuffer = Buffer.from(
      await paymentScreenshot.arrayBuffer()
    );

    const { error: paymentUploadError } = await supabase.storage
      .from("payment-screenshots")
      .upload(paymentObjectPath, paymentBuffer, {
        contentType: paymentScreenshot.type,
        upsert: false,
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

    const newApp = await db
      .insert(applications)
      .values({
        applicationId,
        courseId: parseInt(formData.get("courseId") as string),
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
        tenthBoard: (formData.get("tenthBoard") as string) || "",
        tenthYear: (formData.get("tenthYear") as string) || "",
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
        gradYear: (formData.get("gradYear") as string) || "",
        gradPercentage:
          (formData.get("gradPercentage") as string) || "",
        paymentScreenshotPath: paymentObjectPath,
        paymentScreenshotUploadedAt: new Date(),
        status: "pending",
        declaration: true,
      })
      .returning();

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

      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE) {
          console.error(`File too large: ${field}`);
          continue;
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop() || "pdf";
        const objectPath = `${applicationId}/${field}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(objectPath, buffer, {
            contentType:
              file.type || "application/octet-stream",
            upsert: true,
          });

        if (uploadError) {
          console.error("Document upload error:", uploadError);
          continue;
        }

        const { data: publicUrl } = supabase.storage
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
    }

    return NextResponse.json({
      success: true,
      applicationId,
      application: newApp[0],
    });
  } catch (error) {
    console.error("Error submitting application:", error);

    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";