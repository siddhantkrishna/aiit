"use client";

import { FormEvent, useState } from "react";

export default function VacancyApplicationForm({ vacancyId, title }: { vacancyId: number; title: string }) {
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      data.set("vacancyId", String(vacancyId)); data.set("declaration", "true");
      const response = await fetch("/api/vacancy-applications", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Failed to submit application."); return; }
      form.reset(); setApplicationId(result.applicationId);
    } catch { setError("Unable to submit the application. Please try again."); }
    finally { setSubmitting(false); }
  }

  if (applicationId) return <div className="bg-white border border-green-200 rounded-2xl p-8"><p className="text-sm font-semibold text-green-700">Application received</p><h2 className="text-2xl font-bold mt-2">Thank you for applying for {title}.</h2><p className="text-muted mt-3">Your application ID is <span className="font-semibold text-foreground">{applicationId}</span>.</p></div>;

  const fields = [
    ["firstName", "First Name", "text", true], ["lastName", "Last Name", "text", false], ["mobile", "Mobile", "tel", true], ["email", "Email", "email", true],
    ["address", "Address", "text", false], ["city", "City", "text", false], ["state", "State", "text", false], ["qualification", "Highest Qualification", "text", true], ["experience", "Experience", "text", true],
  ] as const;

  return <form onSubmit={submit} className="bg-white border border-border rounded-2xl p-6 md:p-8 space-y-6">
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="grid sm:grid-cols-2 gap-5">
      {fields.map(([name, label, type, required]) => <label key={name} className={`text-sm font-medium text-foreground ${name === "address" ? "sm:col-span-2" : ""}`}>{label}{required ? " *" : ""}<input name={name} required={required} type={type} className="mt-2 w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"/></label>)}
      <label className="sm:col-span-2 text-sm font-medium text-foreground">Resume *<input name="resume" required type="file" accept=".pdf,.doc,.docx,application/pdf" className="mt-2 block w-full rounded-lg border border-border px-3 py-2.5"/><span className="mt-1 block text-xs text-muted">PDF, DOC or DOCX up to 5MB.</span></label>
    </div>
    <label className="flex gap-3 text-sm text-muted"><input required type="checkbox" className="mt-1"/>I confirm that the information provided is accurate and complete.</label>
    <button disabled={submitting} className="w-full sm:w-auto px-7 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-60">{submitting ? "Submitting..." : "Submit Application"}</button>
  </form>;
}
