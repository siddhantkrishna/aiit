import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, documents } from "@/db/schema";
import { desc } from "drizzle-orm";
import { generateApplicationId } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const all = await db.select().from(applications).orderBy(desc(applications.createdAt));
    return NextResponse.json(all);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const applicationId = generateApplicationId();

    const newApp = await db.insert(applications).values({
      applicationId,
      courseId: parseInt(formData.get("courseId") as string),
      universityId: formData.get("universityId") ? parseInt(formData.get("universityId") as string) : null,
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
      tenthPercentage: (formData.get("tenthPercentage") as string) || "",
      twelfthBoard: (formData.get("twelfthBoard") as string) || "",
      twelfthYear: (formData.get("twelfthYear") as string) || "",
      twelfthPercentage: (formData.get("twelfthPercentage") as string) || "",
      gradUniversity: (formData.get("gradUniversity") as string) || "",
      gradYear: (formData.get("gradYear") as string) || "",
      gradPercentage: (formData.get("gradPercentage") as string) || "",
      status: "pending",
      declaration: formData.get("declaration") === "true",
    }).returning();

    const fileFields = ["photo", "aadhaar", "tenthMarksheet", "twelfthMarksheet", "gradMarksheet", "otherDoc"];

    for (const field of fileFields) {
      const file = formData.get(field) as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop() || "pdf";
        const objectPath = `${applicationId}/${field}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(objectPath, buffer, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
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