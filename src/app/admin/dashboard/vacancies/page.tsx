"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Vacancy {
  id: number;
  title: string;
  slug: string;
  department: string | null;
  employmentType: string | null;
  location: string | null;
  openings: number;
  description: string | null;
  responsibilities: string | null;
  qualifications: string | null;
  experience: string | null;
  salary: string | null;
  enabled: boolean;
}

type VacancyForm = {
  title: string;
  slug: string;
  department: string;
  employmentType: string;
  location: string;
  openings: number;
  description: string;
  responsibilities: string;
  qualifications: string;
  experience: string;
  salary: string;
  enabled: boolean;
};

const emptyForm: VacancyForm = {
  title: "",
  slug: "",
  department: "",
  employmentType: "Full-time",
  location: "AIIT College",
  openings: 1,
  description: "",
  responsibilities: "",
  qualifications: "",
  experience: "",
  salary: "",
  enabled: true,
};

const starterVacancies: Record<string, Partial<VacancyForm>> = {
  "Computer Teacher": {
    department: "Academic",
    description: "Teach computer subjects and support practical learning at AIIT College.",
    responsibilities: "Plan and deliver computer classes, conduct practical sessions, evaluate students, maintain academic records, and support college activities.",
    qualifications: "BCA, MCA, B.Sc IT, B.Tech, or equivalent computer qualification. Teaching qualification preferred.",
    experience: "1+ years preferred",
    salary: "As per qualification and institution norms",
  },
  "Office Boy": {
    department: "Administration & Support",
    description: "Support routine office and campus operations.",
    responsibilities: "Office support, document movement, campus assistance, basic errands, and general support duties.",
    qualifications: "Minimum 8th pass; responsible and reliable.",
    experience: "Freshers may apply",
    salary: "As per institution norms",
  },
  Advisor: {
    department: "Admissions",
    description: "Guide students and parents through course selection and the admission process.",
    responsibilities: "Handle counselling enquiries, explain courses, maintain lead follow-ups, coordinate applications, and support admissions targets.",
    qualifications: "Graduate degree with good communication and counselling skills.",
    experience: "1+ years preferred",
    salary: "As per experience and institution norms",
  },
  "Marketing Head": {
    department: "Marketing",
    description: "Lead student acquisition and brand marketing initiatives for AIIT College.",
    responsibilities: "Plan campaigns, manage marketing channels, coordinate the marketing team, track leads, optimize acquisition, and report performance.",
    qualifications: "Graduate degree with strong marketing, communication, and team-management skills.",
    experience: "2+ years preferred",
    salary: "As per experience and institution norms",
  },
  Manager: {
    department: "Administration",
    description: "Coordinate administrative operations and ensure efficient day-to-day functioning of the institution.",
    responsibilities: "Supervise operations, coordinate staff, manage records, support admissions and administration, and report to management.",
    qualifications: "Graduate degree; management or administrative experience preferred.",
    experience: "2+ years preferred",
    salary: "As per experience and institution norms",
  },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminVacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vacancy | null>(null);
  const [form, setForm] = useState<VacancyForm>(emptyForm);
  const [error, setError] = useState("");

  async function loadVacancies() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/vacancies", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load vacancies.");
      setVacancies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vacancies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVacancies();
  }, []);

  function openAdd(prefillTitle = "") {
    const preset = prefillTitle ? starterVacancies[prefillTitle] || {} : {};
    setEditing(null);
    setForm({
      ...emptyForm,
      title: prefillTitle,
      slug: prefillTitle ? slugify(prefillTitle) : "",
      ...preset,
    });
    setShowForm(true);
    setError("");
  }

  function openEdit(vacancy: Vacancy) {
    setEditing(vacancy);
    setForm({
      title: vacancy.title,
      slug: vacancy.slug,
      department: vacancy.department || "",
      employmentType: vacancy.employmentType || "Full-time",
      location: vacancy.location || "AIIT College",
      openings: vacancy.openings || 1,
      description: vacancy.description || "",
      responsibilities: vacancy.responsibilities || "",
      qualifications: vacancy.qualifications || "",
      experience: vacancy.experience || "",
      salary: vacancy.salary || "",
      enabled: vacancy.enabled,
    });
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/vacancies", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing ? { ...form, id: editing.id } : form,
        ),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save vacancy.");

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await loadVacancies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vacancy.");
    } finally {
      setSaving(false);
    }
  }

  async function addStarterVacancies() {
    setSaving(true);
    setError("");

    try {
      const existingTitles = new Set(
        vacancies.map((vacancy) => vacancy.title.trim().toLowerCase()),
      );

      for (const title of Object.keys(starterVacancies)) {
        if (existingTitles.has(title.toLowerCase())) continue;

        const response = await fetch("/api/admin/vacancies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug: slugify(title),
            ...starterVacancies[title],
            openings: 1,
            employmentType: "Full-time",
            location: "AIIT College",
            enabled: true,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Failed to add ${title}.`);
        }
      }

      await loadVacancies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add starter vacancies.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleVacancy(vacancy: Vacancy) {
    try {
      const response = await fetch("/api/admin/vacancies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vacancy.id, enabled: !vacancy.enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update vacancy.");
      await loadVacancies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vacancy.");
    }
  }

  async function deleteVacancy(vacancy: Vacancy) {
    if (!confirm(`Delete "${vacancy.title}"?`)) return;

    try {
      const response = await fetch("/api/admin/vacancies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vacancy.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete vacancy.");
      await loadVacancies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vacancy.");
    }
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Vacancies</h2>
          <p className="text-sm text-muted mt-1">
            Create, edit, publish, close and delete positions shown on the careers page.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/dashboard/vacancy-applications"
            className="px-4 py-2 border border-border rounded-lg text-sm font-semibold"
          >
            Applications
          </Link>
          <Link
            href="/vacancies"
            target="_blank"
            className="px-4 py-2 border border-border rounded-lg text-sm font-semibold"
          >
            View Careers
          </Link>
          <button
            onClick={() => openAdd()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark"
          >
            + Add Vacancy
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={addStarterVacancies}
          disabled={saving}
          className="px-3 py-1.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-60"
        >
          + Add Listed Vacancies
        </button>
        {Object.keys(starterVacancies).map((title) => (
          <button
            key={title}
            onClick={() => openAdd(title)}
            className="px-3 py-1.5 rounded-full border border-border bg-white text-sm hover:bg-blue-50"
          >
            + {title}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-border w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">
                  {editing ? "Edit Vacancy" : "Add Vacancy"}
                </h2>
                <p className="text-sm text-muted mt-1">
                  All fields can be changed later from this panel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-muted hover:text-foreground text-xl px-2"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                        slug: editing ? form.slug : slugify(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                    placeholder="e.g. Computer Teacher"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                    placeholder="computer-teacher"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Employment</label>
                  <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary">
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Openings</label>
                  <input type="number" min="1" required value={form.openings} onChange={(e) => setForm({ ...form, openings: Math.max(1, Number(e.target.value) || 1) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Responsibilities</label>
                <textarea rows={4} value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Qualifications</label>
                <textarea rows={3} value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Experience</label>
                  <input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" placeholder="e.g. 2+ years preferred" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Salary</label>
                  <input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" placeholder="e.g. ₹20,000 - ₹30,000" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="w-4 h-4" />
                Publish this vacancy on the website
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-60"
                >
                  {saving ? "Saving..." : editing ? "Update Vacancy" : "Add Vacancy"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-border text-sm font-semibold rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted">Loading vacancies...</div>
        ) : vacancies.length === 0 ? (
          <div className="p-10 text-center text-muted">No vacancies created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Department</th>
                  <th className="text-left px-4 py-3">Openings</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vacancies.map((vacancy) => (
                  <tr key={vacancy.id} className="border-b border-border hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{vacancy.title}</p>
                      <p className="text-xs text-muted mt-1">
                        {vacancy.employmentType || "Full-time"} · {vacancy.location || "AIIT College"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted">{vacancy.department || "AIIT College"}</td>
                    <td className="px-4 py-3">{vacancy.openings}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleVacancy(vacancy)}
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${vacancy.enabled ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                      >
                        {vacancy.enabled ? "Open" : "Closed"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(vacancy)} className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-gray-50">Edit</button>
                        <button onClick={() => deleteVacancy(vacancy)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50">Delete</button>
                        {vacancy.enabled && (
                          <Link href={`/vacancies/${vacancy.slug}`} target="_blank" className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-gray-50">View</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
