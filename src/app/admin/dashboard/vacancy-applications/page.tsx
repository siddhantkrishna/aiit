"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: number;
  applicationId: string;
  firstName: string;
  lastName: string | null;
  mobile: string;
  email: string;
  vacancyTitle: string | null;
  resumePath: string | null;
  status: string;
  createdAt: string;
};

const statuses = ["all", "pending", "reviewed", "shortlisted", "rejected", "hired"] as const;
type StatusFilter = (typeof statuses)[number];

export default function VacancyApplicationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/vacancy-applications", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your admin session has expired. Please sign in again."
            : "Could not load vacancy applications. Please retry."
        );
      }
      const result: unknown = await response.json();
      if (!Array.isArray(result)) throw new Error("The server returned an unexpected response.");
      setRows(result as Row[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load vacancy applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Vacancy Applications</h1>
          <p className="mt-1 text-sm text-muted">Job applications submitted through the Careers section.</p>
          {!loading && !error && (
            <p className="mt-2 text-sm font-medium">{rows.length} application{rows.length === 1 ? "" : "s"} received</p>
          )}
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">Applications could not be loaded.</p>
          <p className="mt-2">{error}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => void load()} className="font-semibold underline">Try again</button>
            <Link href="/admin/login" className="underline">Admin login</Link>
          </div>
        </div>
      ) : loading ? (
        <div className="py-16 text-center text-muted">Loading recruitment applications...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center text-muted">
          No vacancy applications have been received yet.
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <label htmlFor="vacancy-application-status" className="text-sm font-medium">Status</label>
            <select id="vacancy-application-status" value={filter}
              onChange={(e) => setFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
              {statuses.map((status) => (
                <option key={status} value={status}>{status === "all" ? "All applications" : status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-border">
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Application ID</th>
                  <th scope="col" className="px-4 py-3">Applicant</th>
                  <th scope="col" className="px-4 py-3">Position</th>
                  <th scope="col" className="px-4 py-3">Contact</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Submitted</th>
                  <th scope="col" className="px-4 py-3">Resume</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-primary">{row.applicationId}</td>
                    <td className="px-4 py-3">{row.firstName} {row.lastName}</td>
                    <td className="px-4 py-3">{row.vacancyTitle || "Vacancy unavailable"}</td>
                    <td className="px-4 py-3 text-muted">{row.mobile}<span className="block break-all">{row.email}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3">{row.resumePath ? "Attached" : "Not attached"}</td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3">
                      <Link href={"/admin/dashboard/vacancy-applications/" + encodeURIComponent(row.applicationId)}
                        className="inline-block rounded-md bg-blue-50 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && <p className="p-8 text-center text-muted">No applications with this status.</p>}
          </div>
        </>
      )}
    </div>
  );
}
