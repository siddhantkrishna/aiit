import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { vacancies } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "aiit-college-admin-secret-2025";

function authorized(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;

  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function clean(value: unknown) {
  const result = String(value ?? "").trim();
  return result || null;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db
      .select()
      .from(vacancies)
      .orderBy(desc(vacancies.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to load vacancies:", error);
    return NextResponse.json(
      { error: "Failed to load vacancies." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "Job title is required." },
        { status: 400 },
      );
    }

    const baseSlug = slugify(String(body.slug || title)) || `vacancy-${Date.now()}`;
    let slug = baseSlug;

    const [existingSlug] = await db
      .select({ id: vacancies.id })
      .from(vacancies)
      .where(eq(vacancies.slug, slug));

    if (existingSlug) {
      slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
    }

    const openings = Number(body.openings ?? 1);
    if (!Number.isInteger(openings) || openings < 1) {
      return NextResponse.json(
        { error: "Openings must be a whole number greater than 0." },
        { status: 400 },
      );
    }

    const [vacancy] = await db
      .insert(vacancies)
      .values({
        title,
        slug,
        department: clean(body.department),
        employmentType: clean(body.employmentType) || "Full-time",
        location: clean(body.location) || "AIIT College",
        openings,
        description: clean(body.description),
        responsibilities: clean(body.responsibilities),
        qualifications: clean(body.qualifications),
        experience: clean(body.experience),
        salary: clean(body.salary),
        enabled: body.enabled !== false,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      { success: true, vacancy },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create vacancy:", error);
    return NextResponse.json(
      { error: "Failed to create vacancy." },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = Number(body.id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "Valid vacancy id is required." },
        { status: 400 },
      );
    }

    const [current] = await db
      .select()
      .from(vacancies)
      .where(eq(vacancies.id, id));

    if (!current) {
      return NextResponse.json(
        { error: "Vacancy not found." },
        { status: 404 },
      );
    }

    const title = String(body.title ?? current.title).trim();
    if (!title) {
      return NextResponse.json(
        { error: "Job title is required." },
        { status: 400 },
      );
    }

    const requestedSlug = slugify(String(body.slug || title));
    let slug = requestedSlug || current.slug;

    if (slug !== current.slug) {
      const [existingSlug] = await db
        .select({ id: vacancies.id })
        .from(vacancies)
        .where(eq(vacancies.slug, slug));

      if (existingSlug && existingSlug.id !== id) {
        slug = `${slug}-${Date.now().toString().slice(-6)}`;
      }
    }

    const openings = Number(body.openings ?? current.openings);
    if (!Number.isInteger(openings) || openings < 1) {
      return NextResponse.json(
        { error: "Openings must be a whole number greater than 0." },
        { status: 400 },
      );
    }

    const [vacancy] = await db
      .update(vacancies)
      .set({
        title,
        slug,
        department: clean(body.department) ?? current.department,
        employmentType:
          clean(body.employmentType) ?? current.employmentType,
        location: clean(body.location) ?? current.location,
        openings,
        description: clean(body.description) ?? current.description,
        responsibilities:
          clean(body.responsibilities) ?? current.responsibilities,
        qualifications:
          clean(body.qualifications) ?? current.qualifications,
        experience: clean(body.experience) ?? current.experience,
        salary: clean(body.salary) ?? current.salary,
        enabled:
          typeof body.enabled === "boolean" ? body.enabled : current.enabled,
        updatedAt: new Date(),
      })
      .where(eq(vacancies.id, id))
      .returning();

    return NextResponse.json({ success: true, vacancy });
  } catch (error) {
    console.error("Failed to update vacancy:", error);
    return NextResponse.json(
      { error: "Failed to update vacancy." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = Number(body.id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "Valid vacancy id is required." },
        { status: 400 },
      );
    }

    const [deleted] = await db
      .delete(vacancies)
      .where(eq(vacancies.id, id))
      .returning({ id: vacancies.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Vacancy not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete vacancy:", error);
    return NextResponse.json(
      { error: "Failed to delete vacancy." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
