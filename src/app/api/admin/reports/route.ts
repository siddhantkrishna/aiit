import { feeReport } from "@/lib/fees/report";
import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return NextResponse.json({error:"Unauthorized"},{status:401});
    const [dailyResult, monthlyResult, centresResult] =
      await Promise.all([
        db.execute(sql`
          select *
          from public.management_daily_summary
          limit 1
        `),

        db.execute(sql`
          select *
          from public.management_monthly_summary
          limit 1
        `),

        db.execute(sql`
          select *
          from public.management_centre_performance
          order by centre_id
        `),
      ]);

    const fees = await feeReport();
    const dailyRow = dailyResult.rows[0] || {};
    const monthlyRow = monthlyResult.rows[0] || {};

    const numberValue = (value: unknown) =>
      Number(value ?? 0);

    return NextResponse.json({
      daily: {
        reportDate:
          dailyRow.report_date ||
          new Date().toISOString().slice(0, 10),

        newLeads: numberValue(
          dailyRow.new_leads,
        ),

        newApplications: numberValue(
          dailyRow.new_applications,
        ),

        newAdmissions: numberValue(
          dailyRow.new_admissions,
        ),

        collectionsToday: fees.summary.today / 100,

        expensesToday: numberValue(
          dailyRow.expenses_today,
        ),

        activeStaff: numberValue(
          dailyRow.active_staff,
        ),

        openTasks: numberValue(
          dailyRow.open_tasks,
        ),

        openServices: numberValue(
          dailyRow.open_services,
        ),
      },

      monthly: {
        monthStart:
          monthlyRow.month_start ||
          new Date().toISOString().slice(0, 10),

        leads: numberValue(monthlyRow.leads),

        applications: numberValue(
          monthlyRow.applications,
        ),

        admissions: numberValue(
          monthlyRow.admissions,
        ),

        collections: fees.summary.month / 100,

        expenses: numberValue(
          monthlyRow.expenses,
        ),

        netCashflow: fees.summary.month / 100 - numberValue(monthlyRow.expenses),

        studentsWithPendingFees: new Set(fees.balances.filter(b => b.outstanding > 0).map(b => b.planId)).size,
      },

      centres: centresResult.rows.map((row) => ({
        centreId: numberValue(row.centre_id),
        centreCode: String(
          row.centre_code || "",
        ),
        centreName: String(
          row.centre_name || "",
        ),
        leads: numberValue(row.leads),
        applications: numberValue(
          row.applications,
        ),
        admissions: numberValue(
          row.admissions,
        ),
        collections: (fees.groups.centres.find(c => c.label === String(row.centre_id))?.collected || 0) / 100,
      })),
    });
  } catch (error) {
    console.error(
      "Failed to load management reports:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load management reports.",
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
