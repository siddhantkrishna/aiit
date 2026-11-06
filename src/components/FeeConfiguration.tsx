"use client";
import { useEffect, useMemo, useState } from "react";
import { feeMoney, feeRequest } from "./FeePanel";

type Course={id:number;name:string;fee:string|null;semesters:number|null;universityId:number|null;enabled:boolean};
type University={id:number;name:string;enabled:boolean};
type Configuration={id:number;courseId:number;universityId:number;originalAmount:number;semesters:number;effectiveFrom:string;reason:string;createdBy:number};
type Options={courses:Course[];universities:University[];configurations:Configuration[]};
const input="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm";

export default function FeeConfiguration() {
  const [options,setOptions]=useState<Options|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [saved,setSaved]=useState("");
  const [form,setForm]=useState({universityId:"",courseId:"",originalFee:"",semesters:"",reason:""});
  const [schedule,setSchedule]=useState<Array<{amount:string}>>([]);
  const [courseSearch,setCourseSearch]=useState("");
  useEffect(()=>{feeRequest("/api/admin/payments/configuration").then(setOptions).catch(e=>setError(e instanceof Error?e.message:"Fee settings unavailable."));},[]);

  const universityId=Number(form.universityId);
  const available=useMemo(()=>options?.courses.filter(c=>c.enabled&&(!c.universityId||c.universityId===universityId))||[],[options,universityId]);
  const filtered=available.filter(c=>c.name.toLowerCase().includes(courseSearch.trim().toLowerCase()));
  const records=useMemo(()=>options?.configurations.filter(c=>c.universityId===universityId)||[],[options,universityId]);
  const configured=new Set(records.map(c=>c.courseId));
  const current=records.filter(c=>c.courseId===Number(form.courseId)).sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom)||b.id-a.id)[0];
  const total=schedule.reduce((sum,item)=>sum+(Number(item.amount)||0),0);

  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);setError("");setSaved("");
    try {
      if (!form.universityId||!form.courseId) throw new Error("Select a university and course.");
      const response=await feeRequest("/api/admin/payments/configuration",{...form,schedule});
      if(!response)throw new Error("Fee configuration could not be saved.");
      setOptions(await feeRequest("/api/admin/payments/configuration"));
      setSaved("Saved approved university-specific fee version. Existing student contracts were not changed.");
      setForm(v=>({...v,originalFee:"",reason:""}));
      setSchedule(currentSchedule=>currentSchedule.map(row=>({...row,amount:""})));
    } catch(e) {setError(e instanceof Error?e.message:"Unable to save university fee.");}
    finally {setBusy(false);}
  }
  return <details className="rounded-xl border bg-white p-5">
    <summary className="cursor-pointer text-lg font-bold">University-wise Course Fee Configuration</summary>
    <p className="mt-3 text-sm text-slate-600">Set the approved fee for each university and course. Add one amount per semester; no installment deadlines are required. Students may pay any semester at any time.</p>
    {error&&<p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {saved&&<p role="status" className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">{saved}</p>}
    {options&&<div className="mt-5 space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Older course-master fee references are not verified AIIT selling prices. Enter only amounts approved for the selected university and course. A missing configuration blocks fee checkout for that combination.</div>
      <form className="space-y-5" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold">University (required)
            <select className={input} required value={form.universityId} onChange={e=>{setForm(v=>({...v,universityId:e.target.value,courseId:"",originalFee:"",semesters:"",reason:""}));setCourseSearch("");setSchedule([]);}}>
              <option value="">Choose university first</option>{options.universities.filter(u=>u.enabled).map(u=><option value={u.id} key={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Search courses
            <input className={input} disabled={!universityId} value={courseSearch} placeholder="Find BCA, MBA, DCA..." onChange={e=>setCourseSearch(e.target.value)}/>
          </label>
          <label className="text-sm font-semibold">Course (required)
            <select className={input} disabled={!universityId} required value={form.courseId} onChange={e=>{const c=available.find(c=>c.id===Number(e.target.value));setForm(v=>({...v,courseId:e.target.value,originalFee:"",semesters:c?.semesters?String(c.semesters):"",reason:""}));setSchedule(Array.from({length:Math.min(24,c?.semesters||0)},()=>({amount:""})));}}>
              <option value="">{!universityId?"Select university first":"Choose a course"}</option>
              {filtered.map(c=><option key={c.id} value={c.id}>{c.name}{configured.has(c.id)?" — Fee configured":""}</option>)}
              {form.courseId&&!filtered.some(c=>c.id===Number(form.courseId))&&available.filter(c=>c.id===Number(form.courseId)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {!!universityId&&<p className="text-sm text-slate-600">Approved university–course combinations: {configured.size} of {available.length} possible courses. Pricing is independent for every university.</p>}
        {current&&<p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Latest approved fee: <strong>{feeMoney(current.originalAmount)}</strong> across {current.semesters} semester(s). New rates apply immediately; existing student plans retain their original amounts.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-semibold">Approved total course fee (INR)<input className={input} required type="number" min="1" step="0.01" value={form.originalFee} onChange={e=>setForm({...form,originalFee:e.target.value})}/></label>
          <label className="text-sm font-semibold">Semesters / installments<input className={input} required type="number" min="1" max="24" value={form.semesters} onChange={e=>{const n=Math.min(24,Math.max(0,Number(e.target.value)));setForm({...form,semesters:e.target.value});setSchedule(Array.from({length:n},(_,i)=>schedule[i]||{amount:""}));}}/></label>
          <label className="text-sm font-semibold">Approval reference / reason<input className={input} required minLength={10} placeholder="Approved fee circular or management authorization" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></label>
        </div>
        {schedule.length>0&&<div className="space-y-3">
          <h3 className="font-bold">Semester amounts — students can pay in any order, at any time</h3>
          {schedule.map((item,i)=><div key={i} className="grid items-end gap-3 sm:grid-cols-2">
            <strong className="py-3 text-sm">Installment {i+1}</strong>
            <label className="text-sm">Amount (INR)<input className={input} required type="number" min="1" step="0.01" value={item.amount} onChange={e=>setSchedule(schedule.map((s,j)=>j===i?{...s,amount:e.target.value}:s))}/></label>
          </div>)}
          <p className={`text-sm ${form.originalFee&&Math.abs(total-Number(form.originalFee))>0.005?"text-red-700":"text-slate-600"}`}>Installments total: ₹{total.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})} / Course fee: ₹{(Number(form.originalFee)||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
        </div>}
        <button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy||!form.universityId||!form.courseId||schedule.length===0}>{busy?"Saving...":"Save university-specific fee version"}</button>
      </form>
      <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><caption className="py-3 text-left font-bold">University fee version history</caption><thead><tr>{["University","Course","Fee","Installments","Approval reference"].map(h=><th className="border-b p-2" key={h}>{h}</th>)}</tr></thead><tbody>{(universityId?records:options.configurations).map(c=><tr key={c.id} className="border-b"><td className="p-2">{options.universities.find(u=>u.id===c.universityId)?.name||"Unknown university"}</td><td className="p-2">{options.courses.find(k=>k.id===c.courseId)?.name||"Unknown course"}</td><td className="p-2">{feeMoney(c.originalAmount)}</td><td className="p-2">{c.semesters}</td><td className="p-2">{c.reason}</td></tr>)}</tbody></table>{!records.length&&<p className="py-3 text-sm text-slate-500">{universityId?"No approved fees for this university yet.":"Choose a university to configure its fees."}</p>}</div>
    </div>}
  </details>;
}
