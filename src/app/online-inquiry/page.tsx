"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";

type Option = { id: number; name: string; fullName?: string; enabled: boolean };

export default function OnlineInquiryPage() {
  const [courses, setCourses] = useState<Option[]>([]);
  const [universities, setUniversities] = useState<Option[]>([]);
  const [submittedId, setSubmittedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/courses", { cache: "no-store" }).then(r => r.json()), fetch("/api/universities", { cache: "no-store" }).then(r => r.json())])
      .then(([courseData, universityData]) => {
        setCourses(Array.isArray(courseData) ? courseData.filter((x: Option) => x.enabled) : []);
        setUniversities(Array.isArray(universityData) ? universityData.filter((x: Option) => x.enabled) : []);
      })
      .catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/online-inquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit inquiry.");
      setSubmittedId(data.inquiryId);
      e.currentTarget.reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to submit inquiry."); }
    finally { setSaving(false); }
  }

  return <>
    <Navbar />
    <main className="min-h-screen bg-slate-50">
      <section className="bg-primary-dark text-white"><div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">Talk to AIIT</p><h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Online Inquiry</h1><p className="mt-5 max-w-2xl text-blue-100 md:text-lg">Tell us what you want to study. Our admissions team can help you compare programs, eligibility, universities, fees, and next steps.</p></div></section>
      <section className="mx-auto max-w-5xl px-4 py-10 md:px-6 lg:px-8">
        {submittedId ? <div className="rounded-3xl border border-green-200 bg-white p-10 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div><h2 className="mt-5 text-2xl font-black text-slate-900">Inquiry received</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Your inquiry number is <span className="font-bold text-slate-900">{submittedId}</span>. Keep it for reference. Our team will contact you using the details you submitted.</p><button onClick={() => setSubmittedId("")} className="mt-7 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Submit another inquiry</button></div> : <form onSubmit={submit} className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2"><h2 className="text-xl font-bold text-slate-900">Your details</h2><p className="mt-1 text-sm text-slate-500">Only the information needed for counselling.</p></div>
          {[['name','Full name','text'],['mobile','Mobile number','tel'],['whatsapp','WhatsApp number','tel'],['email','Email address','email'],['qualification','Current qualification','text'],['location','City / district','text']].map(([name,label,type]) => <label key={name}><span className="mb-2 block text-sm font-semibold text-slate-700">{label}{name==='name'||name==='mobile' ? ' *' : ''}</span><input name={name} type={type} required={name==='name'||name==='mobile'} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>)}
          <label><span className="mb-2 block text-sm font-semibold text-slate-700">Interested course</span><select name="interestedCourseId" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"><option value="">Not sure yet</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}{c.fullName ? ` — ${c.fullName}` : ''}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-semibold text-slate-700">Preferred university</span><select name="preferredUniversityId" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"><option value="">Not sure yet</option>{universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
          <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">What would you like help with?</span><textarea name="message" rows={5} placeholder="Course, eligibility, university, fee, admission process, career guidance…" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>
          {error && <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <div className="md:col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs leading-5 text-slate-500">By submitting this form, you agree that AIIT may contact you regarding your inquiry.</p><button disabled={saving} className="shrink-0 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50">{saving ? 'Sending…' : 'Send inquiry →'}</button></div>
        </form>}
      </section>
    </main>
    <Footer />
  </>;
}
