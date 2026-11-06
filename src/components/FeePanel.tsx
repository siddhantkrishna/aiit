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
  const [showPlanChoices, setShowPlanChoices] = useState(false);
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
      {!data.configuration && !data.plan && <p className="rounded-lg bg-amber-50 p-4 text-amber-900">Accounts must configure an approved fee for this university and course before payment is available.</p>}
      {data.configuration && (!data.plan || (showPlanChoices && !data.plan.locked)) && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-slate-900">Choose how you want to pay</h3>
          <p className="text-sm text-slate-600">No payment deadlines. You can pay any semester whenever you want.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold text-slate-600">Pay everything now · 10% off</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{feeMoney(data.full?.payable || 0)}</p>
              <p className="mt-2 text-sm text-slate-600">Save {feeMoney(data.full?.discount || 0)} on the total fee.</p>
              <button className={`${buttonClass} mt-5 w-full py-3`} disabled={busy || data.person.needsReview} onClick={() => void run(async () => {
                await feeRequest("/api/fees/plan", { plan: "full", studentId, applicationId });
                setShowPlanChoices(false);
              })}>Choose full payment</button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold text-slate-600">Pay semester by semester</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{feeMoney(data.configuration.originalAmount)}</p>
              <p className="mt-2 text-sm text-slate-600">{data.configuration.semesters} separate payment options. Pay any semester in any order, at any time.</p>
              <button className={`${buttonClass} mt-5 w-full py-3`} disabled={busy} onClick={() => void run(async () => {
                await feeRequest("/api/fees/plan", { plan: "semester", studentId, applicationId });
                setShowPlanChoices(false);
              })}>Choose semester payments</button>
            </div>
          </div>
        </div>
      )}
      {data.plan && !showPlanChoices && (
        <div className="space-y-5">
          <section className="rounded-2xl border bg-white p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{data.plan.kind === "full" ? "One-time payment" : "Your semester payments"}</h3>
                <p className="mt-1 text-sm text-slate-600">{data.plan.kind === "semester" ? "Pay any unpaid semester at any time. You do not need to pay Semester 1 before Semester 2." : "One payment with your 10% discount."}</p>
              </div>
              {!data.plan.locked && <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-blue-700" type="button" disabled={busy} onClick={() => setShowPlanChoices(true)}>Change payment option</button>}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-5 sm:grid-cols-3">
              <div><p className="text-xs text-slate-500">Total to pay</p><p className="mt-1 text-lg font-bold">{feeMoney(data.plan.payable)}</p></div>
              <div><p className="text-xs text-slate-500">Paid</p><p className="mt-1 text-lg font-bold text-green-700">{feeMoney(data.plan.collected)}</p></div>
              <div><p className="text-xs text-slate-500">Remaining</p><p className="mt-1 text-lg font-bold">{feeMoney(data.plan.outstanding)}</p></div>
            </div>
            {data.plan.kind === "full" && data.plan.discount > 0 && <p className="mt-4 text-sm text-green-700">Includes a {feeMoney(data.plan.discount)} full-payment discount.</p>}
            {data.plan.locked && <p className="mt-3 text-xs text-slate-500">Payment option locked after checkout begins to prevent duplicate charges.</p>}
            {data.person.needsReview && !data.plan.legacyReviewed && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Accounts must review historical collections before a new payment can be made.</p>}
            {!data.checkoutConfigured && !admin && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Online checkout is not configured yet. Your fee plan and application are saved.</p>}
          </section>
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900">{data.plan.kind === "full" ? "Complete your payment" : "Select a semester to pay"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.plan.schedule.map(o => (
                <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-900">{o.semester === 0 ? "Full course" : `Semester ${o.semester}`}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${o.outstanding <= 0 ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-700"}`}>{o.outstanding <= 0 ? "Paid" : "Unpaid"}</span>
                  </div>
                  <p className="mt-3 text-2xl font-bold">{feeMoney(o.outstanding > 0 ? o.outstanding : o.amount)}</p>
                  {o.paid > 0 && <p className="mt-1 text-xs text-slate-600">{feeMoney(o.paid)} received · {feeMoney(o.outstanding)} remaining</p>}
                  {o.outstanding <= 0 ? <p className="mt-4 text-sm font-medium text-green-700">Payment complete</p>
                    : !admin && o.payable ? <button type="button" className={`${buttonClass} mt-4 w-full py-3`} disabled={busy || !data.checkoutConfigured || (data.person.needsReview && !data.plan!.legacyReviewed)} onClick={() => void pay(o.id)}>
                        {data.checkoutConfigured ? `Pay ${feeMoney(o.outstanding)}` : "Checkout unavailable"}
                      </button>
                    : !admin && <p className="mt-4 text-sm text-amber-800">Payment confirmation or reconciliation is pending. Check payment status before retrying.</p>}
                </div>
              ))}
            </div>
          </section>
          {(data.plan.history.length > 0 || data.plan.offline.length > 0) && (
            <details className="rounded-xl border bg-white p-5">
              <summary className="cursor-pointer font-semibold">Payment history and receipts</summary>
              <div className="mt-3">
                {data.plan.history.map(t => <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3">
                  <div><p className="font-semibold">{feeMoney(t.amount)} · {t.status}</p><p className="text-xs text-slate-600">{t.razorpayPaymentId} · {t.method}</p></div>
                  {t.receiptId && <a className="text-sm font-semibold text-blue-700 underline" href={`/api/fees/receipts/${t.receiptId}`}>Download receipt</a>}
                </div>)}
                {data.plan.offline.map(t => <p className="border-t py-3 text-sm" key={t.id}>{feeMoney(t.amount)} · Recorded offline · {t.reference}</p>)}
              </div>
            </details>
          )}
          {admin && <AdminFeeActions data={data} busy={busy} run={run} />}
        </div>
      )}
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
  const [form, setForm] = useState({ action: "offline", obligationId: "", amount: "", reference: "", reason: "", receivedAt: "", legacy: false });
  return <form className="space-y-4 rounded-xl border border-blue-200 bg-white p-6" onSubmit={e => { e.preventDefault(); void run(() => feeRequest("/api/admin/payments/actions", { ...form, planId: data.plan!.id })); }}>
    <h3 className="text-lg font-bold">Audited accounts action</h3><p className="text-sm text-slate-600">Offline credits require actual bank/cash evidence. Historical opening credits affect balances and stay separate from new collections. Adjustments apply only to unpaid obligations without checkout orders.</p>
    <div className="grid gap-4 sm:grid-cols-2"><label>Action<select className={inputClass} value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}><option value="offline">Record verified offline / opening credit</option><option value="adjust">Amend unpaid semester amount</option><option value="review_legacy">Complete historical review</option></select></label>
      {form.action !== "review_legacy" && <><label>Obligation<select className={inputClass} required value={form.obligationId} onChange={e => setForm({ ...form, obligationId: e.target.value })}><option value="">Select semester</option>{data.plan!.schedule.map(o => <option value={o.id} key={o.id}>{o.semester || "Full course"} · {feeMoney(o.outstanding)} outstanding</option>)}</select></label><label>Amount (INR)<input className={inputClass} required type="number" step="0.01" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label>
        {form.action === "offline" ? <><label>Bank / cash voucher / historical reference<input className={inputClass} required minLength={5} value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></label><label>Actual receipt date<input className={inputClass} required type="date" value={form.receivedAt} onChange={e => setForm({ ...form, receivedAt: e.target.value })} /></label><label className="flex gap-2"><input type="checkbox" checked={form.legacy} onChange={e => setForm({ ...form, legacy: e.target.checked })} />Historical opening credit (already collected)</label></> : null}</>}
      <label>Reason and evidence (audit log)<textarea className={inputClass} required minLength={10} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></label></div>
    <button className={buttonClass} disabled={busy}>Save audited action</button>
  </form>;
}
