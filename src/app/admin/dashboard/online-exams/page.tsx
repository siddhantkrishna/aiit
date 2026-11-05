"use client";

import { useEffect, useState } from "react";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
};

type Exam = {
  id: number;
  examCode: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  published: boolean;
};

const emptyForm = {
  examCode: "",
  title: "",
  instructions: "",
  startsAt: "",
  endsAt: "",
  durationMinutes: "60",
  passingMarks: "",
  published: false,
};

function blankQuestion(): Question {
  return { id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correctAnswer: 0, marks: 1 };
}

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-600";

export default function AdminOnlineExamsPage() {
  const [rows, setRows] = useState<Exam[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [questions, setQuestions] = useState<Question[]>(() => [blankQuestion()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch("/api/admin/online-exams", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to load exams.");
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load exams."))
      .finally(() => setLoading(false));
  }, []);

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "",
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : "",
        questions,
      };
      const response = await fetch("/api/admin/online-exams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create exam.");
      setForm(emptyForm);
      setQuestions([blankQuestion()]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exam.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this exam and any submitted attempts?")) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/online-exams?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete exam.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete exam.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Digital Campus</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Online Exams</h1>
        <p className="mt-2 text-sm text-slate-500">Create multiple-choice exams. Answer keys stay on the server and are never sent to students.</p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            Exam code
            <input required maxLength={100} value={form.examCode} onChange={(e) => setForm({ ...form, examCode: e.target.value })}
              placeholder="e.g. BASICS-101" className={inputClass} />
          </label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">
            Exam title
            <input required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Introduction to Computing" className={inputClass} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Starts at (optional)
            <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={inputClass} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Ends at (optional)
            <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={inputClass} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Duration (minutes)
            <input type="number" min={1} max={600} required value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className={inputClass} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Passing marks
            <input type="number" min={0} placeholder="Blank = 40% of total marks" value={form.passingMarks}
              onChange={(e) => setForm({ ...form, passingMarks: e.target.value })} className={inputClass} />
          </label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-3">
            Instructions
            <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              rows={2} placeholder="Instructions visible to students" className={inputClass} />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-bold text-slate-900">Questions</h2>
              <p className="mt-1 text-xs text-slate-500">Add questions, four answer options, and select the correct response.</p>
            </div>
            <button type="button" onClick={() => setQuestions((items) => [...items, blankQuestion()])}
              className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              Add question
            </button>
          </div>
          {questions.map((question, index) => (
            <section key={question.id} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Question {index + 1}</h3>
                <button type="button" disabled={questions.length === 1}
                  onClick={() => setQuestions((items) => items.filter((item) => item.id !== question.id))}
                  className="text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40">
                  Remove
                </button>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Question
                <textarea required rows={2} value={question.question}
                  onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                  className={inputClass} placeholder="Type the question here" />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="text-sm font-semibold text-slate-700">
                    Option {optionIndex + 1}
                    <input required value={option} onChange={(e) => {
                      const options = [...question.options];
                      options[optionIndex] = e.target.value;
                      updateQuestion(question.id, { options });
                    }} className={inputClass} />
                  </label>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Correct answer
                  <select value={question.correctAnswer} onChange={(e) => updateQuestion(question.id, { correctAnswer: Number(e.target.value) })}
                    className={inputClass}>
                    {question.options.map((_, optionIndex) => (
                      <option key={optionIndex} value={optionIndex}>Option {optionIndex + 1}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Marks
                  <input type="number" min={1} max={100} required value={question.marks}
                    onChange={(e) => updateQuestion(question.id, { marks: Number(e.target.value) })}
                    className={inputClass} />
                </label>
              </div>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Publish immediately (otherwise save as draft)
          </label>
          <button type="submit" disabled={saving || questions.length === 0}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Creating..." : "Create Exam"}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Existing exams</h2>
        {loading ? <p className="text-sm text-slate-500">Loading exams...</p> :
          rows.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No exams yet.</p> :
          rows.map((exam) => (
            <div key={exam.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600">{exam.examCode}</p>
                <h3 className="mt-1 font-bold text-slate-900">{exam.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{exam.totalMarks} marks · {exam.durationMinutes} min · {exam.published ? "Published" : "Draft"}</p>
              </div>
              <button type="button" onClick={() => remove(exam.id)}
                className="self-start rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                Delete
              </button>
            </div>
          ))}
      </section>
    </div>
  );
}
