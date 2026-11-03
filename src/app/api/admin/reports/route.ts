import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await db.execute(sql`
      with bounds as (select (now() at time zone 'Asia/Kolkata')::date as today),
      periods as (select today, date_trunc('month', today)::date as month_start, ((today::timestamp at time zone 'Asia/Kolkata') at time zone 'UTC') as day_start from bounds)
      select json_build_object(
        'daily', json_build_object(
          'reportDate', p.today,
          'newLeads', (select count(*) from leads where created_at >= p.day_start),
          'newApplications', (select count(*) from applications where created_at >= p.day_start),
          'newAdmissions', (select count(*) from students where admission_date = p.today),
          'collectionsToday', (select coalesce(sum(amount), 0) from payments where payment_status = 'VERIFIED' and payment_date = p.today),
          'expensesToday', (select coalesce(sum(amount), 0) from accounting_transactions where status = 'POSTED' and transaction_type = 'EXPENSE' and transaction_date = p.today)
            + (select coalesce(sum(e.amount), 0) from expenses e where e.expense_date = p.today and coalesce(e.status, 'POSTED') not in ('VOID', 'CANCELLED') and not exists (select 1 from accounting_transactions a where a.related_expense_id = e.id)),
          'activeStaff', (select count(*) from staff where status = 'ACTIVE'),
          'openTasks', (select count(*) from staff_tasks where status not in ('COMPLETED', 'CANCELLED')),
          'openServices', (select count(*) from student_services where status not in ('COMPLETED', 'CANCELLED'))
        ),
        'monthly', json_build_object(
          'monthStart', p.month_start,
          'leads', (select count(*) from leads where created_at >= ((p.month_start::timestamp at time zone 'Asia/Kolkata') at time zone 'UTC')),
          'applications', (select count(*) from applications where created_at >= ((p.month_start::timestamp at time zone 'Asia/Kolkata') at time zone 'UTC')),
          'admissions', (select count(*) from students where admission_date >= p.month_start),
          'collections', (select coalesce(sum(amount), 0) from payments where payment_status = 'VERIFIED' and payment_date >= p.month_start),
          'expenses', (select coalesce(sum(amount), 0) from accounting_transactions where status = 'POSTED' and transaction_type = 'EXPENSE' and transaction_date >= p.month_start)
            + (select coalesce(sum(e.amount), 0) from expenses e where e.expense_date >= p.month_start and coalesce(e.status, 'POSTED') not in ('VOID', 'CANCELLED') and not exists (select 1 from accounting_transactions a where a.related_expense_id = e.id)),
          'studentsWithPendingFees', (select count(*) from students where amount_pending > 0)
        ),
        'centres', (select coalesce(json_agg(c), '[]'::json) from (
          select centres.id as "centreId", code as "centreCode", name as "centreName",
            (select count(*) from leads where centre_id = centres.id) as leads,
            (select count(*) from applications where centre_id = centres.id) as applications,
            (select count(*) from students where centre_id = centres.id) as admissions,
            (select coalesce(sum(amount), 0) from payments where centre_id = centres.id and payment_status = 'VERIFIED') as collections
          from centres order by name
        ) c)
      ) as report from periods p
    `);
    const report = result.rows[0]?.report as { daily: Record<string, number>; monthly: Record<string, number>; centres: unknown[] };
    report.monthly.netCashflow = Number(report.monthly.collections) - Number(report.monthly.expenses);
    return NextResponse.json(report);
  } catch { return NextResponse.json({ error: "Unable to load management report." }, { status: 503 }); }
}
export const dynamic = "force-dynamic";
