"use client";

import { useCallback, useEffect, useState } from "react";
import type { portal } from "@/lib/fees/service";

type Portal = Awaited<ReturnType<typeof portal>>;
type CheckoutResponse = { razorpay_payment_id: string; razorpay_signature: string };
type CheckoutInstance = { open: () => void; on: (event: string, handler: () => void) => void };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => CheckoutInstance } }
export const feeMoney = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount / 100);
const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
const buttonClass = "rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
export async function feeRequest(url: string, body?: unknown) {
  const response = await fetch(url, body === undefined ? { cache: "no-store" } : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to complete request.");
  return data;
}
async function checkoutScript() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(); script.onerror = () => { script.remove(); reject(new Error("Unable to load Razorpay. Please retry.")); };
    document.body.append(script);
  });
  if (!window.Razorpay) throw new Error("Checkout is unavailable. Please retry.");
}
export default function FeePanel({ studentId, applicationId, admin = false }: { studentId?: number; applicationId?: number; admin?: boolean }) {
  const [data, setData] = useState<Portal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState("");
  const [recoveryReason, setRecoveryReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginMode, setLoginMode] = useState("student");
  const [login, setLogin] = useState({ studentId: "", mobile: "", dob: "", applicationId: "", recoveryCode: "" });
  const query = new URLSearchParams(studentId ? { studentId: String(studentId) } : applicationId ? { applicationId: String(applicationId) } : {}).toString();
  const load = useCallback(() => fetch(`/api/fees?${query}`, { cache: "no-store" }).then(async response => {
    const result = await response.json();
    setError("");
    if (response.status === 401) { setNeedsLogin(true); setData(null); return; }
    if (!response.ok) throw new Error(result.error || "Unable to load fees.");
    setData(result); setNeedsLogin(false);
  }).catch(e => setError(e instanceof Error ? e.message : "Unable to load fees.")).finally(() => setLoading(false)), [query]);
  useEffect(() => { void load(); }, [load]);
  async function run(action: () => Promise<unknown>) {
    if (busy) return; setBusy(true); setError(""); setMessage("");
    try { await action(); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Request failed."); }
    finally { setBusy(false); }
  }
  async function pay(obligationId: number) {
    if (busy) return; setBusy(true); setError(""); setMessage("");
    try {
      await checkoutScript();
      const order = await feeRequest("/api/fees/orders", { obligationId });
      const checkout = new window.Razorpay!({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: "INR", name: "AIIT College", description: "Course fee payment",
        prefill: { name: data?.person.name, contact: data?.person.mobile, email: data?.person.email || undefined },
        theme: { color: "#1d4ed8" },
        handler: async (result: CheckoutResponse) => {
          try {
            const verified = await feeRequest("/api/fees/verify", { id: order.id, ...result });
            setMessage(verified.success ? "Payment captured and verified. Your receipt is available below." : "Payment confirmation is pending. Refresh or check payment status shortly.");
            await load();
          } catch (e) { setError(e instanceof Error ? e.message : "Confirmation delayed. Check payment status below."); }
          finally { setBusy(false); }
        },
        modal: { ondismiss: () => { setBusy(false); setMessage("Checkout closed. Your application is saved. Check payment status before retrying."); void load(); } },
      });
      checkout.on("payment.failed", () => { setMessage("Payment did not complete. You can retry the same checkout after checking its status."); void load(); });
      checkout.open();
    } catch (e) { setError(e instanceof Error ? e.message : "Checkout failed."); setBusy(false); }
  }
  return <section className="space-y-5" aria-label="Fees and Payments">
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-blue-50 p-4 text-blue-900">{message}</p>}
    {loading && <p role="status">Loading fees…</p>}
    {needsLogin && !admin && <form className="space-y-4 rounded-xl border bg-white p-6" onSubmit={e => { e.preventDefault(); void run(async () => { await feeRequest(loginMode === "student" ? "/api/student/login" : "/api/fees/session", login); }); }}>
      <h2 className="text-xl font-bold">Sign in to My Fees &amp; Payments</h2>
      <label className="block">Sign in as<select className={inputClass} value={loginMode} onChange={e => setLoginMode(e.target.value)}><option value="student">Enrolled student</option><option value="applicant">Admission applicant / resume payment</option></select></label>
      {loginMode === "student" ? <div className="grid gap-4 sm:grid-cols-3">
        <label>Student ID<input className={inputClass} required value={login.studentId} onChange={e => setLogin({ ...login, studentId: e.target.value })} /></label>
        <label>Registered mobile<input className={inputClass} required inputMode="numeric" maxLength={10} value={login.mobile} onChange={e => setLogin({ ...login, mobile: e.target.value })} /></label>
        <label>Date of birth<input className={inputClass} type="date" required value={login.dob} onChange={e => setLogin({ ...login, dob: e.target.value })} /></label>
      </div> : <div className="grid gap-4 sm:grid-cols-2"><label>Application ID<input className={inputClass} required value={login.applicationId} onChange={e => setLogin({ ...login, applicationId: e.target.value })} /></label><label>Private recovery code<input className={inputClass} type="password" autoComplete="off" required value={login.recoveryCode} onChange={e => setLogin({ ...login, recoveryCode: e.target.value })} /></label></div>}
      <button className={buttonClass} disabled={busy}>Sign in</button>
      <p className="text-sm text-slate-600">Applicants: use the code shown after submission. For older applications or a lost code, contact admissions to verify your identity.</p>
    </form>}
    {data && <>
      <div className="rounded-xl border bg-white p-6"><p className="text-sm text-blue-700">{data.person.applicationRef} {data.person.studentRef}</p><h2 className="text-2xl font-bold">{data.person.name}</h2><p className="text-slate-600">{data.person.course}</p></div>
      {admin && data.person.applicationId && <form className="space-y-3 rounded-xl border bg-white p-5" onSubmit={e => { e.preventDefault(); void run(async () => { const result = await feeRequest("/api/admin/payments/actions", { action: "reset_applicant_access", applicationId: data.person.applicationId, reason: recoveryReason }); setRecovery(result.recoveryCode); }); }}>
        <h3 className="font-bold">Issue / reset applicant payment recovery code</h3><label className="block text-sm">Identity verification and audit reason<input className={inputClass} required minLength={10} value={recoveryReason} onChange={e => setRecoveryReason(e.target.value)} /></label><button className={buttonClass} disabled={busy}>Issue private code</button>{recovery && <div><p className="text-sm">Share securely with the verified applicant. Existing sessions expire within 8 hours.</p><code className="block break-all bg-slate-100 p-3">{recovery}</code></div>}
      </form>}
      {!data.configuration && !data.plan && <p className="rounded-lg bg-amber-50 p-4 text-amber-900">Accounts must configure this course’s fee and semester structure before payment is available.</p>}
      {!data.plan?.locked && data.configuration && <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6"><h3 className="text-lg font-bold">Pay full course fee</h3><dl className="my-4 space-y-2"><div>Original fee: {feeMoney(data.configuration.originalAmount)}</div><div>10% upfront discount: −{feeMoney(data.full?.discount || 0)}</div><div className="font-bold">Payable: {feeMoney(data.full?.payable || 0)}</div></dl>
          <button className={buttonClass} disabled={busy || data.person.needsReview} onClick={() => void run(() => feeRequest("/api/fees/plan", { plan: "full", studentId, applicationId }))}>Choose full payment</button></div>
        <div className="rounded-xl border bg-white p-6"><h3 className="text-lg font-bold">Semester-wise payment</h3><p className="my-4">{data.configuration.semesters} semesters · {feeMoney(data.configuration.originalAmount)} total · no discount</p><p className="mb-4 text-sm text-slate-600">Each semester has its own due date and checkout.</p>
          <button className={buttonClass} disabled={busy} onClick={() => void run(() => feeRequest("/api/fees/plan", { plan: "semester", studentId, applicationId }))}>Choose semester plan</button></div>
      </div>}
      {data.plan && <>
        <div className="rounded-xl border bg-white p-6"><p className="font-bold text-blue-800">{data.plan.status} · {data.plan.kind === "full" ? "Full payment" : "Semester-wise"}</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">{[["Original fee", data.plan.originalAmount], ["Discount", data.plan.discount], ["Adjustments", data.plan.payable - data.plan.originalAmount + data.plan.discount], ["Payable", data.plan.payable], ["Collected", data.plan.collected], ["Outstanding", data.plan.outstanding]].map(([label, amount]) => <div key={label}><dt className="text-sm text-slate-600">{label}</dt><dd className="font-semibold">{feeMoney(Number(amount))}</dd></div>)}</dl>
          {data.plan.locked && <p className="mt-4 text-sm text-slate-600">The plan is locked once checkout starts. Accounts must review any changes to prevent duplicate collection.</p>}
          {data.person.needsReview && !data.plan.legacyReviewed && <p className="mt-4 text-amber-800">Historical payment records await accounts review. Checkout is paused to avoid duplicate collection.</p>}
          {!data.checkoutConfigured && !admin && <p className="mt-4 text-amber-800">Online checkout is not configured yet. Your application is saved.</p>}
        </div>
        <div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-full text-left text-sm"><caption className="p-4 text-left text-lg font-bold">Fee schedule</caption><thead className="bg-slate-50"><tr>{["Semester", "Due date", "Amount", "Paid", "Outstanding", "Status", "Action"].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{data.plan.schedule.map((o, i) => <tr className="border-t" key={o.id}><td className="p-3">{o.semester || "Full course"}</td><td className="p-3">{o.dueDate}</td><td className="p-3">{feeMoney(o.amount)}</td><td className="p-3">{feeMoney(o.paid)}</td><td className="p-3">{feeMoney(o.outstanding)}</td><td className="p-3">{o.status}</td><td className="p-3">{!admin && o.payable && !data.plan!.schedule.slice(0,i).some(x => x.outstanding) && <button className={buttonClass} disabled={busy || !data.checkoutConfigured || (data.person.needsReview && !data.plan!.legacyReviewed)} onClick={() => void pay(o.id)}>Pay now</button>}</td></tr>)}</tbody></table></div>
        <div className="rounded-xl border bg-white p-5"><h3 className="text-lg font-bold">Transaction history &amp; receipts</h3>{!data.plan.history.length && !data.plan.offline.length && <p className="mt-3 text-slate-600">No recorded payments yet.</p>}
          {data.plan.history.map(t => <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-4"><div><p className="font-semibold">{feeMoney(t.amount)} · {t.status}{t.refunded > 0 && ` · refunded ${feeMoney(t.refunded)}`}</p><p className="text-xs text-slate-600">{t.razorpayPaymentId} · {t.method} · {new Date(t.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p></div>{t.receiptId && <a className="font-semibold text-blue-700 underline" href={`/api/fees/receipts/${t.receiptId}`}>Download PDF receipt</a>}</div>)}
          {data.plan.offline.map(t => <div key={t.id} className="border-b py-3"><strong>{feeMoney(t.amount)} · {t.legacy ? "Historical opening credit" : "Verified offline credit"}</strong><p className="text-sm text-slate-600">{t.receivedAt} · {t.reference}</p></div>)}
        </div>
        {admin && <AdminFeeActions data={data} busy={busy} run={run} />}
      </>}
      <div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={busy} onClick={() => void load()}>Refresh fee status</button>
        {!admin && <><button className={buttonClass} disabled={busy} onClick={() => void run(async () => {
          const orders = await feeRequest("/api/fees/pending");
          for (const order of orders) await feeRequest(`/api/fees/orders/${order.id}`, {});
          setMessage("Payment status checked with Razorpay.");
        })}>Check payment confirmation</button><button className="rounded-lg border px-4 py-2" disabled={busy} onClick={() => void run(async () => { await feeRequest("/api/fees/logout", {}); setData(null); })}>Sign out</button></>}
      </div>
    </>}
    {!loading && !data && !needsLogin && <button className={buttonClass} onClick={() => void load()}>Retry loading fees</button>}
  </section>;
}
function AdminFeeActions({ data, busy, run }: { data: Portal; busy: boolean; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  const [form, setForm] = useState({ action: "offline", obligationId: "", amount: "", reference: "", reason: "", dueDate: "", receivedAt: "", legacy: false });
  return <form className="space-y-4 rounded-xl border border-blue-200 bg-white p-6" onSubmit={e => { e.preventDefault(); void run(() => feeRequest("/api/admin/payments/actions", { ...form, planId: data.plan!.id })); }}>
    <h3 className="text-lg font-bold">Audited accounts action</h3><p className="text-sm text-slate-600">Offline credits require actual bank/cash evidence. Historical opening credits affect balances and stay separate from new collections. Adjustments apply only to unpaid obligations without checkout orders.</p>
    <div className="grid gap-4 sm:grid-cols-2"><label>Action<select className={inputClass} value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}><option value="offline">Record verified offline / opening credit</option><option value="adjust">Amend unpaid semester fee / due date</option><option value="review_legacy">Complete historical review</option></select></label>
      {form.action !== "review_legacy" && <><label>Obligation<select className={inputClass} required value={form.obligationId} onChange={e => setForm({ ...form, obligationId: e.target.value })}><option value="">Select semester</option>{data.plan!.schedule.map(o => <option value={o.id} key={o.id}>{o.semester || "Full course"} · {feeMoney(o.outstanding)} outstanding</option>)}</select></label><label>Amount (INR)<input className={inputClass} required type="number" step="0.01" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label>
        {form.action === "offline" ? <><label>Bank / cash voucher / historical reference<input className={inputClass} required minLength={5} value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></label><label>Actual receipt date<input className={inputClass} required type="date" value={form.receivedAt} onChange={e => setForm({ ...form, receivedAt: e.target.value })} /></label><label className="flex gap-2"><input type="checkbox" checked={form.legacy} onChange={e => setForm({ ...form, legacy: e.target.checked })} />Historical opening credit (already collected)</label></> : <label>New due date<input className={inputClass} required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label>}</>}
      <label>Reason and evidence (audit log)<textarea className={inputClass} required minLength={10} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></label></div>
    <button className={buttonClass} disabled={busy}>Save audited action</button>
  </form>;
}
