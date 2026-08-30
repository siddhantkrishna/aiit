import Link from "next/link";
import { db } from "@/db";
import { vacancies } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AdminVacanciesPage() {
  const rows = await db.select().from(vacancies).orderBy(desc(vacancies.createdAt));
  return <div><div className="flex flex-wrap items-center justify-between gap-4 mb-6"><div><h2 className="text-xl font-bold">Vacancies</h2><p className="text-sm text-muted mt-1">Manage positions shown on the careers page.</p></div><div className="flex gap-2"><Link href="/admin/dashboard/vacancy-applications" className="px-4 py-2 border border-border rounded-lg text-sm font-semibold">Applications</Link><Link href="/vacancies" target="_blank" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">View Careers</Link></div></div><div className="bg-white rounded-xl border border-border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-border"><th className="text-left px-4 py-3">Role</th><th className="text-left px-4 py-3">Department</th><th className="text-left px-4 py-3">Openings</th><th className="text-left px-4 py-3">Status</th></tr></thead><tbody>{rows.map(v=><tr key={v.id} className="border-b border-border"><td className="px-4 py-3 font-medium">{v.title}</td><td className="px-4 py-3 text-muted">{v.department}</td><td className="px-4 py-3">{v.openings}</td><td className="px-4 py-3"><span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${v.enabled ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>{v.enabled ? "Open" : "Closed"}</span></td></tr>)}</tbody></table></div></div></div>;
}
