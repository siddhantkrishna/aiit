"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: number;
  leadId: string;
  name: string;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  qualification: string | null;
  source: string | null;
  status: string;
  priority: string;
  nextFollowUpAt: string | null;
  nextAction: string | null;
  expectedAdmissionDate: string | null;
  notes: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = [
  "ALL",
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "CONVERTED",
  "LOST",
];

function statusClass(status: string) {
  switch (status) {
    case "CONVERTED":
      return "bg-green-100 text-green-700";
    case "LOST":
      return "bg-red-100 text-red-700";
    case "FOLLOW_UP":
    case "INTERESTED":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/admin/leads?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load leads");
      }

      const data = await response.json();

      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, [status]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return leads;

    return leads.filter((lead) =>
      [
        lead.leadId,
        lead.name,
        lead.mobile,
        lead.email,
        lead.location,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [leads, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Admissions
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Leads & Enquiries
          </h1>

          <p className="text-slate-500 mt-2">
            Track every enquiry from first contact to admission.
          </p>
        </div>

        <button
          onClick={loadLeads}
          className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead ID, name, mobile, email..."
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL"
                  ? "All Statuses"
                  : item.replace("_", " ")}
              </option>
            ))}
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
            Loading leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No leads found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lead
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Source
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Follow-up
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {lead.name}
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        {lead.leadId}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {lead.mobile || "—"}
                      </p>

                      {lead.email && (
                        <p className="text-xs text-slate-400 mt-1">
                          {lead.email}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {lead.source || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          lead.status,
                        )}`}
                      >
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {lead.nextFollowUpAt
                          ? new Date(
                              lead.nextFollowUpAt,
                            ).toLocaleDateString("en-IN")
                          : "—"}
                      </p>

                      {lead.nextAction && (
                        <p className="text-xs text-slate-400 mt-1">
                          {lead.nextAction}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Showing {filteredLeads.length} leads.
      </p>
    </div>
  );
}