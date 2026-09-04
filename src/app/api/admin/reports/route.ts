import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
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

    const dailyRow = dailyResult[0] || {};
    const monthlyRow = monthlyResult[0] || {};

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

        collectionsToday: numberValue(
          dailyRow.collections_today,
        ),

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

        collections: numberValue(
          monthlyRow.collections,
        ),

        expenses: numberValue(
          monthlyRow.expenses,
        ),

        netCashflow: numberValue(
          monthlyRow.net_cashflow,
        ),

        studentsWithPendingFees: numberValue(
          monthlyRow.students_with_pending_fees,
        ),
      },

      centres: centresResult.map((row) => ({
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
        collections: numberValue(
          row.collections,
        ),
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