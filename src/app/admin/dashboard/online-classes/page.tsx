"use client";

import { useEffect, useState } from "react";

interface OnlineClass { id: number; title: string; description: string | null; instructor: string | null; scheduledAt: string; durationMinutes: number | null; meetingUrl: string | null; recordingUrl: string | null; status: string; enabled: boolean; }

const initialForm = { title: "", description: "", instructor: "", scheduledAt: "", durationMinutes: "60", meetingUrl: "", recordingUrl: "", status: "SCHEDULED" };

export default function AdminOnlineClassesPage() {
  const [items, setItems] = useState<OnlineClass[]>([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/online-classes", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to load classes.");
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/online-classes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create class.");
      setForm(initialForm); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create class."); }
    finally { setSaving(false); }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this online class?")) return;
    const response = await fetch(`/api/admin/online-classes?id=${id}`, { method: "DELETE" });
    if (!response.ok) { const data = await response.json(); setError(data.error || "Delete failed."); return; }
    await load();
  }

  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Digital Campus</p><h1 className="mt-2 text-3xl font-black text-slate-900">Online Classes</h1><p className="mt-2 text-sm text-slate-500">Publish live classes and recordings for students.</p></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
      {([['title','Class title'],['instructor','Instructor'],['scheduledAt','Schedule'],['durationMinutes','Duration (minutes)'],['meetingUrl','Live meeting URL'],['recordingUrl','Recording URL']] as const).map(([key,label]) => <label key={key} className={key==='title' ? 'md:col-span-2' : ''}><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span><input required={key==='title' || key==='scheduledAt'} type={key==='scheduledAt' ? 'datetime-local' : key==='durationMinutes' ? 'number' : 'text'} value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary" /></label>)}
      <label className="md:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Description</span><textarea rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary" /></label>
      <div className="md:col-span-2"><button disabled={saving} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50">{saving ? 'Publishing…' : 'Publish class'}</button></div>
    </form>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{items.length===0 ? <div className="p-8 text-center text-sm text-slate-500">No classes published.</div> : items.map(item => <div key={item.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div><p className="font-bold text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-500">{new Date(item.scheduledAt).toLocaleString('en-IN')} · {item.instructor || 'AIIT Faculty'}</p></div><div className="flex gap-2"><a href={item.meetingUrl || '#'} target="_blank" rel="noopener noreferrer" className={`rounded-lg px-3 py-2 text-xs font-semibold ${item.meetingUrl ? 'bg-primary/10 text-primary' : 'pointer-events-none bg-slate-100 text-slate-400'}`}>Meeting</a><button onClick={() => remove(item.id)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">Delete</button></div></div>)}</div></div>
  </div>;
}
