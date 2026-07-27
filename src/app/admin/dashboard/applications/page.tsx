"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Application {
  id: number;
  applicationId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  courseId: number;
  universityId: number | null;
  status: string;
  createdAt: string;
}

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  function loadApps() {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setApplications(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadApps(); }, []);

  async function updateStatus(appId: string, status: string) {
    if (!confirm(`Are you sure you want to ${status} this application?`)) return;
    await fetch(`/api/applications/${appId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadApps();
  }

  async function deleteApp(appId: string) {
    if (!confirm("Are you sure you want to delete this application?")) return;
    await fetch(`/api/applications/${appId}`, { method: "DELETE" });
    loadApps();
  }

  const filtered = filter === "all"
    ? applications
    : applications.filter((a) => a.status === filter);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted">Loading...</p></div>;
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-white border border-border text-foreground hover:bg-blue-50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "all" && ` (${applications.length})`}
            {f !== "all" && ` (${applications.filter((a) => a.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted">Application ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Student Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Mobile</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted">
                    No applications found
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="border-b border-border hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary">
                      {app.applicationId}
                    </td>
                    <td className="px-4 py-3">
                      {app.firstName} {app.lastName}
                    </td>
                    <td className="px-4 py-3 text-muted">{app.mobile}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(app.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          statusBadge[app.status] || statusBadge.pending
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <Link
                          href={`/admin/dashboard/applications/${app.applicationId}`}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100"
                        >
                          View
                        </Link>
                        {app.status !== "approved" && (
                          <button
                            onClick={() => updateStatus(app.applicationId, "approved")}
                            className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-md hover:bg-green-100"
                          >
                            Approve
                          </button>
                        )}
                        {app.status !== "rejected" && (
                          <button
                            onClick={() => updateStatus(app.applicationId, "rejected")}
                            className="px-2.5 py-1 bg-red-50 text-red-700 text-xs rounded-md hover:bg-red-100"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => deleteApp(app.applicationId)}
                          className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs rounded-md hover:bg-gray-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
