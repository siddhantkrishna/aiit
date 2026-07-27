"use client";

import { useEffect, useState } from "react";

interface University {
  id: number;
  name: string;
  shortName: string;
  location: string;
  description: string;
  website: string;
  enabled: boolean;
}

const emptyUni = {
  name: "",
  shortName: "",
  location: "",
  description: "",
  website: "",
  enabled: true,
};

export default function UniversitiesManagement() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);
  const [form, setForm] = useState(emptyUni);

  function loadUnis() {
    fetch("/api/universities")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUniversities(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadUnis(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyUni);
    setShowForm(true);
  }

  function openEdit(uni: University) {
    setEditing(uni);
    setForm({
      name: uni.name,
      shortName: uni.shortName || "",
      location: uni.location || "",
      description: uni.description || "",
      website: uni.website || "",
      enabled: uni.enabled,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/universities/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    loadUnis();
  }

  async function deleteUni(id: number) {
    if (!confirm("Delete this university?")) return;
    await fetch(`/api/universities/${id}`, { method: "DELETE" });
    loadUnis();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted">Loading...</p></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted text-sm">{universities.length} universities</p>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
        >
          + Add University
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-border p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">
              {editing ? "Edit University" : "Add University"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">University Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                  placeholder="e.g., Dr. C.V. Raman University"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Short Name</label>
                  <input
                    value={form.shortName}
                    onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                    placeholder="e.g., CVRU"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                    placeholder="e.g., Bilaspur, CG"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary resize-none"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm">Enabled</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
                >
                  {editing ? "Update" : "Add University"}
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

      {/* Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {universities.map((uni) => (
          <div
            key={uni.id}
            className="bg-white rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {uni.shortName || uni.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-sm truncate">
                  {uni.name}
                </h3>
                {uni.location && (
                  <p className="text-xs text-muted">{uni.location}</p>
                )}
              </div>
            </div>
            {uni.description && (
              <p className="text-xs text-muted mb-3 line-clamp-2">
                {uni.description}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(uni)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100"
              >
                Edit
              </button>
              <button
                onClick={() => deleteUni(uni.id)}
                className="px-3 py-1.5 bg-red-50 text-red-700 text-xs rounded-md hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
