"use client";

import { useEffect, useMemo, useState } from "react";

type Staff = {
  id: number;
  employeeId: string;
  name: string;
  role: string | null;
  department: string | null;
  centreId: number | null;
  joiningDate: string | null;
  employmentType: string | null;
  salary: number | string | null;
  managerId: number | null;
  status: string | null;
  email: string | null;
  mobile: string | null;
};

const STATUS_OPTIONS = [
  "ALL",
  "ACTIVE",
  "INACTIVE",
  "ON LEAVE",
  "TERMINATED",
];

function statusClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "TERMINATED":
      return "bg-red-100 text-red-700";
    case "ON LEAVE":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  async function loadStaff() {
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
        `/api/admin/staff?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load staff");
      }

      const data = await response.json();

      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load staff.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, [status]);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return staff;

    return staff.filter((member) =>
      [
        member.employeeId,
        member.name,
        member.role,
        member.department,
        member.email,
        member.mobile,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [staff, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            People
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Staff
          </h1>

          <p className="text-slate-500 mt-2">
            Manage AIIT employees, roles and employment status.
          </p>
        </div>

        <button
          onClick={loadStaff}
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
            placeholder="Search employee, name, role, department..."
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
                  : item}
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
            Loading staff...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No staff found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Employee
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Department
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Joining Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStaff.map((member) => {
                  const memberStatus =
                    member.status || "ACTIVE";

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {member.name}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {member.employeeId}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {member.role || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {member.department || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {member.mobile || "—"}
                        </p>

                        {member.email && (
                          <p className="text-xs text-slate-400 mt-1">
                            {member.email}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            memberStatus,
                          )}`}
                        >
                          {memberStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {member.joiningDate
                          ? new Date(
                              member.joiningDate,
                            ).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Showing {filteredStaff.length} staff members.
      </p>
    </div>
  );
}