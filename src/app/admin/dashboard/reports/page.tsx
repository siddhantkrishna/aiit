"use client";

import { useEffect, useState } from "react";

type DailySummary = {
  reportDate: string;
  newLeads: number;
  newApplications: number;
  newAdmissions: number;
  collectionsToday: number | string;
  expensesToday: number | string;
  activeStaff: number;
  openTasks: number;
  openServices: number;
};

type MonthlySummary = {
  monthStart: string;
  leads: number;
  applications: number;
  admissions: number;
  collections: number | string;
  expenses: number | string;
  netCashflow: number | string;
  studentsWithPendingFees: number;
};

type CentrePerformance = {
  centreId: number;
  centreCode: string;
  centreName: string;
  leads: number;
  applications: number;
  admissions: number;
  collections: number | string;
};

function money(value: number | string) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function ReportsPage() {
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [monthly, setMonthly] =
    useState<MonthlySummary | null>(null);
  const [centres, setCentres] =
    useState<CentrePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/reports",
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load reports");
      }

      const data = await response.json();

      setDaily(data.daily || null);
      setMonthly(data.monthly || null);
      setCentres(
        Array.isArray(data.centres)
          ? data.centres
          : [],
      );
    } catch (err) {
      console.error(err);
      setError("Unable to load management reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Management
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Reports
          </h1>

          <p className="text-slate-500 mt-2">
            Live operational and financial performance.
          </p>
        </div>

        <button
          onClick={loadReports}
          className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
          Loading reports...
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Today
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
              <ReportCard
                label="New Leads"
                value={daily?.newLeads ?? 0}
              />

              <ReportCard
                label="New Applications"
                value={daily?.newApplications ?? 0}
              />

              <ReportCard
                label="New Admissions"
                value={daily?.newAdmissions ?? 0}
              />

              <ReportCard
                label="Collections"
                value={money(
                  daily?.collectionsToday ?? 0,
                )}
              />

              <ReportCard
                label="Expenses"
                value={money(
                  daily?.expensesToday ?? 0,
                )}
              />

              <ReportCard
                label="Active Staff"
                value={daily?.activeStaff ?? 0}
              />

              <ReportCard
                label="Open Tasks"
                value={daily?.openTasks ?? 0}
              />

              <ReportCard
                label="Open Services"
                value={daily?.openServices ?? 0}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              This Month
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
              <ReportCard
                label="Leads"
                value={monthly?.leads ?? 0}
              />

              <ReportCard
                label="Applications"
                value={monthly?.applications ?? 0}
              />

              <ReportCard
                label="Admissions"
                value={monthly?.admissions ?? 0}
              />

              <ReportCard
                label="Collections"
                value={money(
                  monthly?.collections ?? 0,
                )}
              />

              <ReportCard
                label="Expenses"
                value={money(
                  monthly?.expenses ?? 0,
                )}
              />

              <ReportCard
                label="Net Cashflow"
                value={money(
                  monthly?.netCashflow ?? 0,
                )}
              />

              <ReportCard
                label="Pending Fee Students"
                value={
                  monthly?.studentsWithPendingFees ??
                  0
                }
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Centre Performance
            </h2>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-4">
              {centres.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  No centre data available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Centre
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Leads
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Applications
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Admissions
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Collections
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {centres.map((centre) => (
                        <tr
                          key={centre.centreId}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {centre.centreName}
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              {centre.centreCode}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {centre.leads}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {centre.applications}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-green-600">
                            {centre.admissions}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                            {money(centre.collections)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ReportCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="text-2xl font-bold text-slate-900 mt-2">
        {value}
      </p>
    </div>
  );
}