"use client";

import { useEffect, useMemo, useState } from "react";

type Student = {
  id: number;
  studentId: string;
  firstName: string | null;
  lastName: string | null;
  mobile: string | null;
  email: string | null;
  programName: string | null;
  studentStatus: string | null;
  paymentStatus: string | null;
  amountPending: number | string | null;
  admissionDate: string | null;
};

const STATUS_OPTIONS = [
  "ALL",
  "ACTIVE",
  "INACTIVE",
  "COMPLETED",
  "DROPPED",
];

function statusClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "COMPLETED":
      return "bg-blue-100 text-blue-700";
    case "DROPPED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  async function loadStudents() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (status !== "ALL") {
        params.set("status", status);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/admin/students?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load students");
      }

      const data = await response.json();

      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load students.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, [status]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) =>
      [
        student.studentId,
        student.firstName,
        student.lastName,
        student.mobile,
        student.email,
        student.programName,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [students, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Student Management
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Students
          </h1>

          <p className="text-slate-500 mt-2">
            Manage enrolled students and their current status.
          </p>
        </div>

        <button
          onClick={loadStudents}
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
            placeholder="Search student ID, name, mobile, email..."
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
            Loading students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No students found.
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
                    Student
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Program
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fees Pending
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Admission
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => {
                  const studentStatus =
                    student.studentStatus || "ACTIVE";

                  return (
                    <tr
                      key={student.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {student.firstName || ""}{" "}
                          {student.lastName || ""}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {student.studentId}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {student.mobile || "—"}
                        </p>

                        {student.email && (
                          <p className="text-xs text-slate-400 mt-1">
                            {student.email}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {student.programName || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            studentStatus,
                          )}`}
                        >
                          {studentStatus.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        ₹
                        {Number(
                          student.amountPending || 0,
                        ).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {student.admissionDate
                          ? new Date(
                              student.admissionDate,
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
        Showing {filteredStudents.length} students.
      </p>
    </div>
  );
}