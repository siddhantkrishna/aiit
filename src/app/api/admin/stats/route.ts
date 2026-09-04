import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const [
      applications,
      pending,
      approved,
      rejected,
      today,
      leads,
      students,
      activeStudents,
      collections,
      pendingFees,
      staff,
      openTasks,
      openServices,
    ] = await Promise.all([
      db.execute(sql`
        select count(*)::int as count
        from public.applications
      `),

      db.execute(sql`
        select count(*)::int as count
        from public.applications
        where application_status in (
          'RECEIVED',
          'UNDER REVIEW',
          'DOCUMENTS PENDING',
          'SUBMITTED'
        )
      `),

      db.execute(sql`
        select count(*)::int as count
        from public.applications
        where application_status in (
          'VERIFIED',
          'APPROVED',
          'COMPLETED'
        )
      `),

      db.execute(sql`
        select count(*)::int as count
        from public.applications
        where application_status in (
          'REJECTED',
          'CANCELLED'
        )
      `),

      db.execute(sql`
        select count(*)::int as count
        from public.applications
        where created_at >= current_date
      `),

      db.execute(sql`
        select count(*)::int as count
        from public.leads
      `),

      db.execute(sql`
        select count(*)::int as count
        from public.students
      `),

      db.execute(sql`
        select count(*)::int as count
        from public.students
        where student_status = 'ACTIVE'
      `),

      db.execute(sql`
        select coalesce(sum(amount), 0)::numeric as total
        from public.payments
        where payment_status in ('RECEIVED', 'VERIFIED')
      `),

      db.execute(sql`
        select coalesce(sum(amount_pending), 0)::numeric as total
        from public.students
      `),

      db.execute(sql`
        select count(*)::int as count
        from public.staff
        where status = 'ACTIVE'
      `),

      db.execute(sql`
        select count(*)::int as count
        from public.staff_tasks
        where status in ('PENDING', 'IN_PROGRESS')
      `),

      db.execute(sql`
        select count(*)::int as count
        from public.student_services
        where status not in ('COMPLETED', 'CANCELLED')
      `),
    ]);

    return NextResponse.json({
      total: Number(applications.rows[0]?.count ?? 0),
      pending: Number(pending.rows[0]?.count ?? 0),
      approved: Number(approved.rows[0]?.count ?? 0),
      rejected: Number(rejected.rows[0]?.count ?? 0),
      today: Number(today.rows[0]?.count ?? 0),

      leads: Number(leads.rows[0]?.count ?? 0),
      students: Number(students.rows[0]?.count ?? 0),
      activeStudents: Number(activeStudents.rows[0]?.count ?? 0),
      collections: Number(collections.rows[0]?.total ?? 0),
      pendingFees: Number(pendingFees.rows[0]?.total ?? 0),
      staff: Number(staff.rows[0]?.count ?? 0),
      openTasks: Number(openTasks.rows[0]?.count ?? 0),
      openServices: Number(openServices.rows[0]?.count ?? 0),
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return NextResponse.json(
      { error: "Failed to load dashboard statistics." },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
