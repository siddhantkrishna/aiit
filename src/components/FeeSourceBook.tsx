"use client";
import { useEffect, useMemo, useState } from "react";

type FeeSource={
  id:number; universityId:number; universityName:string;
  sourceFile:string;sourceSheet:string;sourceRow:number;
  courseName:string; studyMode:string; feeBasis:"PER_YEAR"|"LISTED_COURSE_TOTAL"|"UNSPECIFIED_TOTAL";
  listedAmountPaise:number;
  componentBreakdown:{admission:number|null;registration:number|null;exam:number|null;tuition:number|null;tuitionDiscount:number|null;semester1:number|null;semester2:number|null};
  duration:string|null;eligibility:string|null;reviewStatus:string;reviewNote:string;
};
const money=(paise:number|null|undefined)=>paise===null||paise===undefined?"—":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(paise/100);
function feeBasisLabel(basis:FeeSource["feeBasis"]) {
  if(basis==="PER_YEAR")return "Per year, not full programme";
  if(basis==="LISTED_COURSE_TOTAL")return "Listed total";
  return "Total period not specified";
}
export default function FeeSourceBook(){
  const [rows,setRows]=useState<FeeSource[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [university,setUniversity]=useState("ALL");
  const [mode,setMode]=useState("ALL");
  const [search,setSearch]=useState("");
  useEffect(()=>{
    fetch("/api/admin/payments/source-prices",{cache:"no-store"})
      .then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||"Price book unavailable");return data;})
      .then(data=>setRows(data.rows||[]))
      .catch(e=>setError(e instanceof Error?e.message:"Unable to load uploaded price lists."))
      .finally(()=>setLoading(false));
  },[]);
  const filtered=useMemo(()=>rows.filter(r=>(university==="ALL"||String(r.universityId)===university)
    &&(mode==="ALL"||r.studyMode===mode)
    &&(r.courseName.toLowerCase().includes(search.trim().toLowerCase())
      ||r.sourceSheet.toLowerCase().includes(search.trim().toLowerCase()))),[rows,university,mode,search]);
  const unis=Array.from(new Map(rows.map(r=>[r.universityId,r.universityName])).entries());
  const modes=[...new Set(rows.map(r=>r.studyMode))];
  const components:[keyof FeeSource["componentBreakdown"],string][]=[
    ["admission","Admission"],["registration","Registration"],["exam","Exam"],
    ["tuition","Tuition"],["tuitionDiscount","Tuition adjustment"],
    ["semester1","Semester 1"],["semester2","Semester 2"],
  ];
  return <details className="rounded-xl border bg-white p-5">
    <summary className="cursor-pointer text-lg font-bold">Uploaded university fee price lists {rows.length>0?`(${rows.length} entries)`:""}</summary>
    <p className="mt-3 text-sm text-slate-600">Source amounts transcribed exactly from the CVRU and SDMIT fee spreadsheets. These are reference prices, <strong>not active Razorpay payment configurations</strong>. Approve the correct full-course fee and installment dates in University-wise Course Fee Configuration before collecting money.</p>
    <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      CVRU Private rows specify <strong>annual</strong> fees. CVRU IODE has two different tables with conflicting totals for 10 of 11 matching courses. SDMIT has listed totals but no semester schedule. Those differences are retained for verification rather than guessed away.
    </p>
    {error&&<p role="alert" className="my-3 text-sm text-red-700">{error}</p>}
    {loading?<p className="my-4 text-sm text-slate-500">Loading source fees…</p>:<>
      <div className="my-5 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-semibold">University
          <select className="mt-2 w-full rounded-lg border p-2.5" value={university} onChange={e=>setUniversity(e.target.value)}>
            <option value="ALL">All universities</option>{unis.map(([id,name])=><option value={id} key={id}>{name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Mode
          <select className="mt-2 w-full rounded-lg border p-2.5" value={mode} onChange={e=>setMode(e.target.value)}>
            <option value="ALL">All modes</option>{modes.map(item=><option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Course search
          <input className="mt-2 w-full rounded-lg border p-2.5" value={search} onChange={e=>setSearch(e.target.value)} placeholder="DCA, BCA, MBA…"/>
        </label>
      </div>
      <p className="mb-3 text-sm text-slate-600">Showing {filtered.length} of {rows.length} source entries. Amounts shown in INR.</p>
      <div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
        <thead><tr className="border-b bg-slate-50">{["University / Mode","Course","Source total","Fee period","Source / row","Review"].map(h=><th key={h} className="whitespace-nowrap p-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody>{filtered.map(row=><tr key={row.id} className="border-b align-top">
          <td className="p-3"><strong>{row.universityName}</strong><div className="text-xs text-slate-500">{row.studyMode}</div></td>
          <td className="min-w-48 p-3"><strong>{row.courseName}</strong>{row.duration&&<div className="text-xs text-slate-500">Duration: {row.duration}</div>}{row.eligibility&&<div className="text-xs text-slate-500">Eligibility: {row.eligibility}</div>}
            <details className="mt-2"><summary className="cursor-pointer text-blue-700">Component breakdown</summary><div className="mt-2 space-y-1 text-xs">
              {components.map(([key,label])=><div key={key} className="flex justify-between gap-4"><span>{label}</span><span>{row.componentBreakdown[key]===null?"Not listed":money((row.componentBreakdown[key] ?? 0)*100)}</span></div>)}
              <p className="mt-2 text-slate-500">{row.reviewNote}</p>
            </div></details>
          </td>
          <td className="whitespace-nowrap p-3 font-bold">{money(row.listedAmountPaise)}</td>
          <td className="min-w-36 p-3 text-slate-700">{feeBasisLabel(row.feeBasis)}</td>
          <td className="min-w-40 p-3 text-xs text-slate-500">{row.sourceFile}<br/>{row.sourceSheet}, row {row.sourceRow}</td>
          <td className="p-3 text-amber-800">Needs fee-plan approval</td>
        </tr>)}</tbody>
      </table>{filtered.length===0&&<p className="p-4 text-sm text-slate-500">No matching courses.</p>}</div>
    </>}
  </details>;
}
