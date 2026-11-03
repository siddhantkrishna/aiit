import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await db.execute(sql`
      with clock as (select (now() at time zone 'Asia/Kolkata')::date as today),
      bounds as (select today, ((today::timestamp at time zone 'Asia/Kolkata') at time zone 'UTC') as day_start, date_trunc('month', today)::date as month_start from clock)
      select
        (select count(*) from applications) as total,
        (select count(*) from applications where status = 'pending') as pending,
        (select count(*) from applications where status = 'approved') as approved,
        (select count(*) from applications where status = 'rejected') as rejected,
        (select count(*) from applications where created_at >= bounds.day_start) as today,
        (select count(*) from leads where created_at >= bounds.day_start) as todayEnquiries,
        (select count(*) from students where student_status = 'ACTIVE') as activeStudents,
        (select count(*) from students where admission_date >= bounds.month_start) as admissionsThisMonth,
        (select coalesce(sum(amount), 0) from payments where payment_status = 'VERIFIED') as collections,
        (select coalesce(sum(amount), 0) from payments where payment_status = 'VERIFIED' and payment_date >= bounds.month_start) as collectionsThisMonth,
        (select coalesce(sum(amount_pending), 0) from students) as pendingFees,
        (select count(*) from leads where next_follow_up_at < now() at time zone 'UTC' and status not in ('ADMITTED', 'CLOSED', 'CONVERTED', 'LOST')) as overdueFollowUps,
        (select count(*) from students where student_status = 'ACTIVE' and university_id is not null and university_status is distinct from 'COMPLETED') as pendingUniversityWork,
        (select count(distinct staff_id) from staff_attendance where attendance_date = bounds.today and leave_status in ('PRESENT', 'LATE', 'HALF_DAY', 'HALF DAY')) as attendanceToday,
        (select count(*) from staff_tasks where status not in ('COMPLETED', 'CANCELLED')) as openTasks,
        (select count(*) from student_services where status not in ('COMPLETED', 'CANCELLED')) as openServices
      from bounds
    `);
    const row = result.rows[0] || {};
    return NextResponse.json(Object.fromEntries(Object.entries(row).map(([key, value]) => [key.toLowerCase(), Number(value || 0)])));
  } catch { return NextResponse.json({ error: "Unable to load operational summary." }, { status: 503 }); }
}
export const dynamic = "force-dynamic";
