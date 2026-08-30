"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = { id:number; applicationId:string; firstName:string; lastName:string|null; mobile:string; email:string; status:string; createdAt:string };

export default function VacancyApplicationsPage() {
  const [rows,setRows]=useState<Row[]>([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch("/api/admin/vacancy-applications").then(r=>r.json()).then(d=>{setRows(Array.isArray(d)?d:[]);setLoading(false)}).catch(()=>setLoading(false))},[]);
  if(loading)return <div className="py-20 text-center text-muted">Loading recruitment applications...</div>;
  return <div><div className="mb-6"><h2 className="text-xl font-bold">Vacancy Applications</h2><p className="text-sm text-muted mt-1">{rows.length} application{rows.length===1?"":"s"} received.</p></div><div className="bg-white rounded-xl border border-border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-border"><th className="text-left px-4 py-3">Application ID</th><th className="text-left px-4 py-3">Applicant</th><th className="text-left px-4 py-3">Contact</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Action</th></tr></thead><tbody>{rows.map(a=><tr key={a.id} className="border-b border-border"><td className="px-4 py-3 font-medium text-primary">{a.applicationId}</td><td className="px-4 py-3">{a.firstName} {a.lastName}</td><td className="px-4 py-3 text-muted">{a.mobile}<br/>{a.email}</td><td className="px-4 py-3"><span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{a.status}</span></td><td className="px-4 py-3"><Link href={`/admin/dashboard/vacancy-applications/${a.applicationId}`} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-md">View</Link></td></tr>)}</tbody></table></div></div></div>;
}
