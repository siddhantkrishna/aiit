"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { feeMoney } from "./FeePanel";
import type { portal } from "@/lib/fees/service";

type Detail=Awaited<ReturnType<typeof portal>>;
type Candidate={type:"student"|"application";id:number;name:string;ref:string;course:string|null;mobile:string|null;email:string|null;applicationRef?:string|null};
type Receiver={id:number;employeeId:string;name:string;role:string|null;department:string|null;centreId:number|null;mobile:string|null;email:string|null;status:string|null};
type OfflineRow={id:number;receiptNo:string;studentName:string;payerName:string;receiverName:string;purposeType:string;purposeName:string;amountPaise:number;paymentMethod:string;receivedAt:string};
type Report={rows:OfflineRow[];summary:{all_time:number|string;today:number|string;records:number}};
const input="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-600";
const btn="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
const initial={ payerName:"",payerMobile:"",payerEmail:"",payerRelation:"FATHER",
  purposeType:"TUITION",purposeName:"",amount:"",obligationId:"",receiverStaffId:"",
  receiverFatherName:"",receiverMotherName:"",paymentMethod:"CASH",paymentReference:"",notes:"",physicallyReceived:false,notifyContacts:false };
async function api<T>(url:string,body?:unknown):Promise<T> {
  const res=await fetch(url,body===undefined?{cache:"no-store"}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const json=await res.json();
  if(!res.ok) throw new Error(json.error||"Request failed");
  return json as T;
}
export default function OfflineReceiving() {
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState("");
  const [people,setPeople]=useState<Candidate[]>([]);
  const [receivers,setReceivers]=useState<Receiver[]>([]);
  const [picked,setPicked]=useState<Candidate|null>(null);
  const [detail,setDetail]=useState<Detail|null>(null);
  const [parents,setParents]=useState<{fatherName:string;motherName:string}>({fatherName:"",motherName:""});
  const [form,setForm]=useState(initial);
  const [report,setReport]=useState<Report|null>(null);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState<{receipt:OfflineRow;notifications:Array<{channel:string;recipient:string;status:string}>}|null>(null);
  const [busy,setBusy]=useState(false);
  const key=useRef<string|null>(null);
  const load=useCallback(async()=>{const data=await api<Report>("/api/admin/payments/offline");setReport(data);},[]);
  useEffect(()=>{void load().catch(()=>{});void api<{people:Candidate[];staff:Receiver[]}>("/api/admin/payments/offline/lookup").then(d=>setReceivers(d.staff)).catch(()=>{});},[load]);
  async function searchPeople(e:React.FormEvent) {
    e.preventDefault();setError("");setBusy(true);
    try {const result=await api<{people:Candidate[];staff:Receiver[]}>(`/api/admin/payments/offline/lookup?search=${encodeURIComponent(search)}`);setPeople(result.people);setReceivers(result.staff);}
    catch(e){setError(e instanceof Error?e.message:"Search failed.");}
    finally{setBusy(false);}
  }
  async function choose(person:Candidate){
    setError("");setBusy(true);setPicked(person);setDetail(null);setSuccess(null);key.current=null;
    try{
      const param=person.type==="student"?"studentId":"applicationId";
      const data=await api<{detail:Detail;parents:{fatherName:string;motherName:string}}>(`/api/admin/payments/offline/lookup?${param}=${person.id}`);
      setDetail(data.detail);setParents(data.parents);
      setForm(f=>({...f,purposeName:data.detail.person.course,amount:"",obligationId:""}));
    }catch(e){setError(e instanceof Error?e.message:"Unable to load student fees.");}
    finally{setBusy(false);}
  }
  async function setPlan() {
    if(!picked)return;setError("");setBusy(true);
    try{
      const p=picked.type==="student"?{studentId:picked.id}:{applicationId:picked.id};
      await api("/api/admin/payments/actions",{action:"select_plan",plan:"semester",...p});
      await choose(picked);
    }catch(e){setError(e instanceof Error?e.message:"Unable to select fee plan.");}
    finally{setBusy(false);}
  }
  async function submit(e:React.FormEvent) {
    e.preventDefault();if(!picked||busy)return;setError("");setSuccess(null);setBusy(true);
    key.current??=crypto.randomUUID();
    try{
      const body={...form,requestKey:key.current,
        ...(picked.type==="student"?{studentId:picked.id}:{applicationId:picked.id}),
        receiverStaffId:Number(form.receiverStaffId),
        ...(form.purposeType==="TUITION"?{obligationId:Number(form.obligationId)}:{})
      };
      const result=await api<{receipt:OfflineRow;notifications:Array<{channel:string;recipient:string;status:string}>}>("/api/admin/payments/offline",body);
      setSuccess(result);key.current=null;
      setForm({...initial,purposeType:form.purposeType,purposeName:detail?.person.course||""});
      await load();
      await choose(picked);
      setSuccess(result);
    }catch(e){setError(e instanceof Error?e.message:"Unable to record receipt. Check whether it was already created before retrying.");}
    finally{setBusy(false);}
  }
  const receiver=receivers.find(r=>String(r.id)===form.receiverStaffId);
  return <section className="space-y-4" aria-label="Offline fee receiving">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-5">
      <div><h2 className="text-xl font-bold text-slate-900">Offline Fee Receiving</h2>
        <p className="mt-1 text-sm text-slate-600">Cash, UPI, bank transfer and cheque received at the centre. Verified by staff entry, separate from Razorpay.</p></div>
      <button type="button" className={btn} onClick={()=>setOpen(v=>!v)}>{open?"Close receiving form":"Receive offline payment"}</button>
    </div>
    {report&&<div className="grid gap-3 sm:grid-cols-3">{[["Offline received today",report.summary.today],["All offline receipts",report.summary.all_time]].map(([label,sum])=><div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{feeMoney(Number(sum))}</p></div>)}
      <div className="rounded-xl border bg-white p-5"><p className="text-sm text-slate-500">Receipts recorded</p><p className="mt-2 text-2xl font-bold">{report.summary.records}</p></div></div>}
    <p className="text-xs text-slate-600">Totals here show all new offline receipts, including separate service payments. Tuition credits already appear in the verified fee ledger below and must not be added again.</p>
    {open&&<div className="space-y-5 rounded-xl border border-blue-200 bg-white p-5">
      <form onSubmit={searchPeople} className="flex flex-wrap items-end gap-3"><label className="min-w-56 flex-1 text-sm font-semibold">Find student / application
        <input className={input} placeholder="Student name, admission ID, student ID or mobile" minLength={2} required value={search} onChange={e=>setSearch(e.target.value)}/></label>
        <button className={btn} disabled={busy}>Search</button>
      </form>
      {people.length>0&&<div className="grid gap-2 sm:grid-cols-2">{people.map(person=><button type="button" key={`${person.type}-${person.id}`} onClick={()=>void choose(person)} className={`rounded-lg border p-3 text-left text-sm hover:border-blue-600 ${picked?.id===person.id&&picked.type===person.type?"border-blue-500 bg-blue-50":""}`}>
        <strong className="block">{person.name}</strong><span className="text-slate-500">{person.type==="student"?"Student":"Applicant"} · {person.ref} · {person.course||"Course not assigned"}</span>
      </button>)}</div>}
      {picked&&detail&&<div className="rounded-lg bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-900">{detail.person.name} · {picked.ref}</p>
        <p>Father: {parents.fatherName||"Not available"} · Mother: {parents.motherName||"Not available"}</p>
        <p>Course: {detail.person.course} · Mobile: {detail.person.mobile||"—"} · Email: {detail.person.email||"—"}</p>
        <p>Admission ID: {detail.person.applicationRef||"Not linked"}</p>
        {detail.plan&&<p className="mt-2 font-semibold">Fee plan: {detail.plan.kind} · Collected: {feeMoney(detail.plan.collected)} · Outstanding: {feeMoney(detail.plan.outstanding)}</p>}
        {!detail.plan&&<div className="mt-3"><p>Tuition collections need an approved fee configuration and semester plan. Other service collections can still be entered separately.</p>
          {detail.configuration&&<button className="mt-2 rounded-md border border-blue-600 px-3 py-2 text-blue-700" disabled={busy} onClick={()=>void setPlan()}>Start regular semester fee plan</button>}
          {!detail.configuration&&<Link className="mt-2 block text-blue-700 underline" href="/admin/dashboard/payments">Configure course fee above</Link>}
        </div>}
      </div>}
      {picked&&detail&&<form onSubmit={submit} className="space-y-4">
        <h3 className="text-lg font-bold">Record received money</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">Collection type<select className={input} value={form.purposeType} onChange={e=>setForm({...form,purposeType:e.target.value,obligationId:""})}>
            <option value="TUITION">Tuition / course installment (student balance)</option><option value="SERVICE">Other service / work (separate collection)</option></select></label>
          <label className="text-sm font-semibold">Course or work description<input className={input} required maxLength={255} value={form.purposeName} onChange={e=>setForm({...form,purposeName:e.target.value})}/></label>
          {form.purposeType==="TUITION"&&<label className="text-sm font-semibold md:col-span-2">Unpaid installment<select required className={input} value={form.obligationId} onChange={e=>{const id=e.target.value;const item=detail.plan?.schedule.find(o=>String(o.id)===id);setForm({...form,obligationId:id,amount:item?String(item.outstanding/100):""});}}>
            <option value="">Choose fee obligation</option>{detail.plan?.kind==="semester"&&detail.plan.schedule.filter(o=>o.outstanding>0).map(o=><option value={o.id} key={o.id}>Semester {o.semester} · {feeMoney(o.outstanding)} due</option>)}</select>
            {detail.plan?.kind==="full"&&<p className="mt-1 text-amber-800">Full-payment gateway discount cannot be applied to offline receipts. Accounts must review this plan.</p>}
          </label>}
          <label className="text-sm font-semibold">Payer name<input className={input} required value={form.payerName} onChange={e=>setForm({...form,payerName:e.target.value})}/></label>
          <label className="text-sm font-semibold">Relationship<select className={input} value={form.payerRelation} onChange={e=>setForm({...form,payerRelation:e.target.value})}>{["SELF","FATHER","MOTHER","PARENT","GUARDIAN","FRIEND","OTHER"].map(s=><option key={s}>{s}</option>)}</select></label>
          <label className="text-sm font-semibold">Payer mobile (10 digits)<input className={input} type="tel" required pattern="[6-9][0-9]{9}" maxLength={10} value={form.payerMobile} onChange={e=>setForm({...form,payerMobile:e.target.value})}/></label>
          <label className="text-sm font-semibold">Payer email (optional)<input className={input} type="email" value={form.payerEmail} onChange={e=>setForm({...form,payerEmail:e.target.value})}/></label>
          <label className="text-sm font-semibold">Receiver (active real staff)<select className={input} required value={form.receiverStaffId} onChange={e=>setForm({...form,receiverStaffId:e.target.value})}><option value="">Select receiving staff</option>{receivers.filter(r=>!r.employeeId.startsWith("DEMO-")).map(s=><option value={s.id} key={s.id}>{s.name} · {s.employeeId}</option>)}</select></label>
          <label className="text-sm font-semibold">Amount received (INR)<input className={input} required type="number" step="0.01" min="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
          {receiver&&<div className="rounded-md bg-slate-100 p-3 text-sm md:col-span-2">
            <p>Receiver: {receiver.name} · {receiver.role||"No post"} · {receiver.department||"No department"} · Centre {receiver.centreId||"Unassigned"}</p>
            <p>Mobile: {receiver.mobile||"—"} · Email: {receiver.email||"—"}</p><p className="mt-1 text-amber-800">Face ID is not enrolled. Logged-in administrator and staff record are audited; no biometric claim is made.</p>
          </div>}
          <label className="text-sm font-semibold">Receiver father (optional, unverified)<input className={input} value={form.receiverFatherName} onChange={e=>setForm({...form,receiverFatherName:e.target.value})}/></label>
          <label className="text-sm font-semibold">Receiver mother (optional, unverified)<input className={input} value={form.receiverMotherName} onChange={e=>setForm({...form,receiverMotherName:e.target.value})}/></label>
          <label className="text-sm font-semibold">Payment method<select className={input} value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>{["CASH","UPI","BANK_TRANSFER","CHEQUE","OTHER"].map(s=><option key={s}>{s}</option>)}</select></label>
          <label className="text-sm font-semibold">Bank/UPI/Cheque reference {form.paymentMethod==="CASH"?"(optional)":"(required)"}<input className={input} required={form.paymentMethod!=="CASH"} minLength={form.paymentMethod==="CASH"?undefined:5} value={form.paymentReference} onChange={e=>setForm({...form,paymentReference:e.target.value})}/></label>
          <label className="text-sm font-semibold md:col-span-2">Collection evidence and remarks<textarea className={input} rows={3} minLength={10} required placeholder="Payment evidence, account or cash denomination, and collection reason" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
        </div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" required checked={form.physicallyReceived} onChange={e=>setForm({...form,physicallyReceived:e.target.checked})}/>I confirm the college has actually received the stated amount; this is not an estimate or promise to pay.</label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" required checked={form.notifyContacts} onChange={e=>setForm({...form,notifyContacts:e.target.checked})}/>I checked payer/student contact details and confirm transactional SMS/email notifications are permitted.</label>
        <button className={btn} disabled={busy||!form.receiverStaffId}>{busy?"Saving receipt…":"Save collection and issue receipt"}</button>
      </form>}
      {error&&<p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {success&&<div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="font-semibold">Receipt recorded: {success.receipt.receiptNo}</p>
        <p className="text-sm">Amount: {feeMoney(success.receipt.amountPaise)} · Notifications: {success.notifications.map(n=>`${n.channel} ${n.recipient}: ${n.status}`).join("; ")||"Previously recorded; use Retry notification below if needed."}</p>
        <a className="text-blue-700 underline" href={`/api/admin/payments/offline/${success.receipt.id}/receipt`}>Download offline receipt PDF</a>
      </div>}
    </div>}
    <div className="rounded-xl border bg-white p-4">
      <h3 className="mb-3 font-bold">Recent offline receipts</h3>
      {!report?.rows.length&&<p className="text-sm text-slate-500">No offline receipts recorded yet.</p>}
      {!!report?.rows.length&&<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr>{["Date (India)","Receipt","Student","Payer","Receiver","Purpose","Amount","Download / Notify"].map(s=><th key={s} className="whitespace-nowrap p-2">{s}</th>)}</tr></thead>
        <tbody>{report.rows.map(r=><tr key={r.id} className="border-t"><td className="p-2 whitespace-nowrap">{new Date(r.receivedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</td><td className="p-2">{r.receiptNo}</td><td className="p-2">{r.studentName}</td><td className="p-2">{r.payerName}</td><td className="p-2">{r.receiverName}</td><td className="p-2">{r.purposeType}: {r.purposeName}</td><td className="p-2">{feeMoney(r.amountPaise)}</td>
          <td className="p-2 whitespace-nowrap"><a className="text-blue-700 underline" href={`/api/admin/payments/offline/${r.id}/receipt`}>PDF</a><button className="ml-3 text-blue-700 underline" onClick={async()=>{setError("");try{await api(`/api/admin/payments/offline/${r.id}/notifications`,{});await load();}catch(e){setError(e instanceof Error?e.message:"Notification retry failed.");}}}>Retry notification</button></td>
        </tr>)}</tbody></table></div>}
    </div>
  </section>;
}
