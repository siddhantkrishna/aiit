"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Application = {
  id: number;
  applicationId: string;
  firstName: string;
  lastName?: string | null;
  mobile: string;
  email?: string | null;
  status?: string | null;
  applicationStatus?: string | null;
  courseId?: number | null;
  universityId?: number | null;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Received",
  "UNDER REVIEW": "Under Review",
  "DOCUMENTS PENDING": "Documents Pending",
  VERIFIED: "Verified",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  pending: "Pending",
};

function getStatus(application: Application) {
  return application.applicationStatus || application.status || "pending";
}

function statusClass(status: string) {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
    case "VERIFIED":
      return "bg-green-100 text-green-700";

    case "REJECTED":
    case "CANCELLED":
      return "bg-red-100 text-red-700";

    case "DOCUMENTS PENDING":
    case "SUBMITTED":
    case "UNDER REVIEW":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/applications", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await response.json();

      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const status = getStatus(application);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const matchesSearch =
        !query ||
        application.applicationId.toLowerCase().includes(query) ||
        application.firstName.toLowerCase().includes(query) ||
        (application.lastName || "").toLowerCase().includes(query) ||
        application.mobile.toLowerCase().includes(query) ||
        (application.email || "").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [applications, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Admissions
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Applications
          </h1>

          <p className="text-slate-500 mt-2">
            Manage and review all admission applications.
          </p>
        </div>

        <button
          onClick={loadApplications}
          className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search application ID, name, mobile or email"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="RECEIVED">Received</option>
            <option value="UNDER REVIEW">Under Review</option>
            <option value="DOCUMENTS PENDING">
              Documents Pending
            </option>
            <option value="VERIFIED">Verified</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No applications found.
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Try changing the search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Application
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Applicant
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map((application) => {
                  const status = getStatus(application);

                  return (
                    <tr
                      key={application.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {application.applicationId}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {application.firstName}{" "}
                          {application.lastName || ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {application.mobile}
                        </p>

                        {application.email && (
                          <p className="text-xs text-slate-400 mt-1">
                            {application.email}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            status,
                          )}`}
                        >
                          {STATUS_LABELS[status] || status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(
                          application.createdAt,
                        ).toLocaleDateString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/dashboard/applications/${application.id}`}
                          className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500">
        Showing {filteredApplications.length} of{" "}
        {applications.length} applications.
      </div>
    </div>
  );
}