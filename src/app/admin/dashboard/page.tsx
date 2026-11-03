"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const cards = [
  ["todayenquiries", "Today's enquiries", "leads"], ["pending", "Pending applications", "applications"],
  ["activestudents", "Active students", "students"], ["admissionsthismonth", "Admissions this month", "students"],
  ["collectionsthismonth", "Verified collections this month (INR)", "payments"], ["pendingfees", "Pending fees (INR)", "students"],
  ["overduefollowups", "Overdue follow-ups", "leads?overdue=1"], ["pendinguniversitywork", "Pending university work", "students?universityPending=1"],
  ["attendancetoday", "Staff present today", "attendance"], ["opentasks", "Incomplete tasks", "tasks"], ["openservices", "Pending student services", "services"],
];
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    try { setLoading(true); const response = await fetch("/api/admin/stats", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setStats(data); setError(""); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to load dashboard."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/admin/stats", { cache: "no-store" }).then(async response => {
      const value = await response.json(); if (!response.ok) throw new Error(value.error); if (active) setStats(value);
    }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <div className="space-y-6">
    <div className="flex justify-between items-start gap-4"><div><h1 className="text-3xl font-bold">AIIT Dashboard</h1><p className="mt-2 text-slate-500">Admissions and daily operations · India time</p></div><button onClick={load} disabled={loading} className="border rounded-lg px-4 py-2 disabled:opacity-50">Refresh</button></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 text-red-700 p-4">{error}</p>}
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{cards.map(([key, label, path]) => <Link key={key} href={`/admin/dashboard/${path}`} className="rounded-xl border bg-white p-6 hover:border-blue-500 focus-visible:outline-2 focus-visible:outline-blue-600"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold">{loading || !stats ? "—" : stats[key]?.toLocaleString("en-IN") ?? "—"}</p><span className="mt-3 block text-sm text-blue-600">Open →</span></Link>)}</div>
  </div>;
}
