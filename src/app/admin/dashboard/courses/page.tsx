"use client";

import { useEffect, useState } from "react";

interface Course {
  id: number;
  name: string;
  fullName: string;
  duration: string;
  eligibility: string;
  studyMode: string;
  category: string;
  fee: string;
  enabled: boolean;
}

const emptyCourse = {
  name: "",
  fullName: "",
  duration: "",
  eligibility: "",
  studyMode: "Regular",
  category: "Computer",
  fee: "",
  enabled: true,
};

export default function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyCourse);
  const [error, setError] = useState("");
  const [showDisabled, setShowDisabled] = useState(false);
  const visibleCourses = showDisabled ? courses : courses.filter(course => course.enabled);

  function loadCourses() {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadCourses(); }, []);

  function openAdd() {
    setEditing(null);
    setError("");
    setForm(emptyCourse);
    setShowForm(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setError("");
    setForm({
      name: course.name,
      fullName: course.fullName || "",
      duration: course.duration || "",
      eligibility: course.eligibility || "",
      studyMode: course.studyMode || "Regular",
      category: course.category || "Computer",
      fee: course.fee || "",
      enabled: course.enabled,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(editing ? `/api/courses/${editing.id}` : "/api/courses", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Unable to save course.");
      }
      setShowForm(false);
      loadCourses();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save course.");
    }
  }

  async function toggleEnabled(course: Course) {
    setError("");
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...course, enabled: !course.enabled }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Unable to change course status.");
      }
      loadCourses();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to change course status.");
    }
  }

  async function deleteCourse(id: number) {
    if (!confirm("Delete this course?")) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    loadCourses();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted">Loading...</p></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-muted text-sm">{courses.filter(course => course.enabled).length} active courses</p>
          <button
            type="button"
            onClick={() => setShowDisabled(value => !value)}
            className="text-sm text-primary underline underline-offset-2"
          >
            {showDisabled ? "Hide disabled courses" : `Show disabled courses (${courses.filter(course => !course.enabled).length})`}
          </button>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
        >
          + Add Course
        </button>
      </div>

      {error && !showForm && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editing ? "Edit Course" : "Add Course"}
            </h2>
            {error && (
              <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Short Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                  placeholder="e.g., BCA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                  placeholder="e.g., Bachelor of Computer Applications"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                    placeholder="e.g., 3 Years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Legacy fee description (not used for checkout)</label>
                  <input
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                    placeholder="Leave blank; configure approved university-wise fees in Payments"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Eligibility</label>
                <input
                  value={form.eligibility}
                  onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                  placeholder="e.g., 12th Pass"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Study Mode</label>
                  <select
                    value={form.studyMode}
                    onChange={(e) => setForm({ ...form, studyMode: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                  >
                    <option>Regular</option>
                    <option>Distance</option>
                    <option>Online</option>
                    <option>Private</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                  >
                    <option>Computer</option>
                    <option>University</option>
                    <option>Education</option>
                    <option>Medical</option>
                    <option>Professional</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm">Enabled (visible on website)</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
                >
                  {editing ? "Update" : "Add Course"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-border text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Mode</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleCourses.map((course) => (
                <tr key={course.id} className="border-b border-border hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{course.name}</p>
                    <p className="text-xs text-muted">{course.fullName}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{course.duration}</td>
                  <td className="px-4 py-3 text-muted">{course.studyMode}</td>
                  <td className="px-4 py-3 text-muted">{course.category}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleEnabled(course)}
                      className={`px-2 py-0.5 text-xs rounded-full border ${
                        course.enabled
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}
                    >
                      {course.enabled ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(course)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCourse(course.id)}
                        className="px-2.5 py-1 bg-red-50 text-red-700 text-xs rounded-md hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
