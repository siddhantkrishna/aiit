"use client";

import { useEffect, useMemo, useState } from "react";

type Attendance = {
  id: number;
  staffId: number;
  centreId: number | null;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number | string | null;
  lateMinutes: number | null;
  leaveStatus: string | null;
};

const LEAVE_OPTIONS = [
  "ALL",
  "PRESENT",
  "ABSENT",
  "HALF DAY",
  "LEAVE",
];

function leaveClass(status: string) {
  switch (status) {
    case "PRESENT":
      return "bg-green-100 text-green-700";
    case "ABSENT":
      return "bg-red-100 text-red-700";
    case "LEAVE":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [leaveStatus, setLeaveStatus] = useState("ALL");

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (leaveStatus !== "ALL") {
        params.set("leaveStatus", leaveStatus);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/admin/attendance?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load attendance");
      }

      const data = await response.json();

      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, [leaveStatus]);

  const filteredAttendance = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return attendance;

    return attendance.filter((record) =>
      [
        record.staffId,
        record.attendanceDate,
        record.leaveStatus,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [attendance, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            People
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Staff Attendance
          </h1>

          <p className="text-slate-500 mt-2">
            Track attendance, working hours and leave.
          </p>
        </div>

        <button
          onClick={loadAttendance}
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
            placeholder="Search staff ID or attendance date..."
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={leaveStatus}
            onChange={(e) => setLeaveStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            {LEAVE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL"
                  ? "All Attendance"
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
            Loading attendance...
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No attendance records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Staff
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Check In
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Check Out
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hours
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredAttendance.map((record) => {
                  const status =
                    record.leaveStatus || "PRESENT";

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        Staff #{record.staffId}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {new Date(
                          record.attendanceDate,
                        ).toLocaleDateString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {record.checkIn
                          ? new Date(
                              record.checkIn,
                            ).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {record.checkOut
                          ? new Date(
                              record.checkOut,
                            ).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {record.workingHours ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${leaveClass(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
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
        Showing {filteredAttendance.length} attendance records.
      </p>
    </div>
  );
}