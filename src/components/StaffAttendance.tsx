"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ATTENDANCE_STATUSES,
  indiaDate,
  indiaDateTime,
  monthRange,
} from "@/lib/attendance/rules";

type RecordRow = {
  id: number;
  staffId: number;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  shiftStart: string | null;
  leaveStatus: string | null;
  workingHours: string | null;
  lateMinutes: number | null;
  notes: string | null;
  version: number;
};
type Employee = {
  id: number;
  employeeId: string;
  name: string;
  department: string | null;
  status?: string | null;
};
type Summary = {
  total: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  late: number;
  hours: string;
};
type HistoryRow = {
  record: RecordRow;
  employeeId: string;
  name: string;
  department: string | null;
  isDemo: boolean;
};
type DayRow = { employee: Employee; record: RecordRow | null; isDemo: boolean };
type Report = {
  filters: { today: string; date: string; month: string };
  rows: HistoryRow[];
  total: number;
  matchingSummary: Summary;
  officialDaily: Summary;
  officialMonthly: Summary;
  roster: DayRow[];
  employees: Employee[];
  departments: string[];
  demoPeriod: { from: string | null; to: string | null; total: number };
};
type Draft = {
  staffId: number;
  attendanceDate: string;
  id?: number;
  version?: number;
  leaveStatus: string;
  shiftStart: string;
  checkIn: string;
  checkOut: string;
  notes: string;
};
const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100";
const button =
  "rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50";
const secondary =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50";
function draftFor(row: DayRow, date: string): Draft {
  const record = row.record;
  return {
    id: record?.id,
    version: record?.version,
    staffId: row.employee.id,
    attendanceDate: date,
    leaveStatus: record?.leaveStatus || "PRESENT",
    shiftStart: record?.shiftStart?.slice(0, 5) || "09:00",
    checkIn: record?.checkIn ? indiaDateTime(record.checkIn) : "",
    checkOut: record?.checkOut ? indiaDateTime(record.checkOut) : "",
    notes: record?.notes || "",
  };
}
async function writeAttendance(method: "POST" | "PUT", body: unknown) {
  const response = await fetch("/api/admin/attendance", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Unable to save attendance.");
  return result;
}
function Stats({ title, values }: { title: string; values: Summary }) {
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5"
      aria-label={title}
    >
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">
        {values.total} official records · DEMO excluded
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          ["Present", values.present],
          ["Absent", values.absent],
          ["Half Day", values.halfDay],
          ["Leave", values.leave],
          ["Late arrivals", values.late],
          ["Working hours", Number(values.hours).toFixed(2)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 text-xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function StaffAttendance({ staffId }: { staffId?: number }) {
  const [filters, setFilters] = useState(() => ({
    date: indiaDate(),
    month: indiaDate().slice(0, 7),
    ...monthRange(indiaDate().slice(0, 7)),
    staffId: staffId ? String(staffId) : "",
    search: "",
    department: "",
    status: "ALL",
    scope: "all",
  }));
  const [active, setActive] = useState(filters);
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1);
  const [view, setView] = useState(staffId ? "history" : "mark");
  const [data, setData] = useState<Report | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState("PRESENT");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const query = new URLSearchParams({
    ...active,
    page: String(page),
  }).toString();
  const load = useCallback(
    (signal?: AbortSignal) =>
      fetch(`/api/admin/attendance?${query}`, { cache: "no-store", signal })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error || "Unable to load attendance.");
          const report = result as Report;
          setData(report);
          setDrafts(
            Object.fromEntries(
              report.roster.map((row) => [
                row.employee.id,
                draftFor(row, report.filters.date),
              ]),
            ),
          );
          setSelected([]);
          setError("");
        })
        .catch((e) => {
          if (e.name !== "AbortError")
            setError(
              e instanceof Error ? e.message : "Unable to load attendance.",
            );
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        }),
    [query],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, revision]);
  function apply(next = filters) {
    setRevision((v) => v + 1);
    setLoading(true);
    setPage(1);
    setActive({ ...next });
    setMessage("");
  }
  function patch(id: number, updates: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...updates,
        ...(["ABSENT", "LEAVE"].includes(updates.leaveStatus || "")
          ? { checkIn: "", checkOut: "" }
          : {}),
      },
    }));
  }
  async function save(ids: number[]) {
    if (busy || !ids.length) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await writeAttendance("POST", { records: ids.map((id) => drafts[id]) });
      await load();
      setMessage(
        `${ids.length} attendance record${ids.length === 1 ? "" : "s"} saved.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save attendance.");
    } finally {
      setBusy(false);
    }
  }
  async function clock(row: DayRow, action: "check_in" | "check_out") {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await writeAttendance("PUT", {
        action,
        staffId: row.employee.id,
        version: row.record?.version,
        shiftStart: drafts[row.employee.id].shiftStart,
      });
      await load();
      setMessage(
        action === "check_in"
          ? "Check-in recorded using the server’s India time."
          : "Check-out saved and working hours calculated.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to record time.");
    } finally {
      setBusy(false);
    }
  }
  function edit(row: HistoryRow) {
    const next = {
      ...filters,
      date: row.record.attendanceDate,
      month: row.record.attendanceDate.slice(0, 7),
      ...monthRange(row.record.attendanceDate.slice(0, 7)),
      staffId: String(row.record.staffId),
      status: "ALL",
      scope: row.isDemo ? "demo" : "official",
    };
    setFilters(next);
    apply(next);
    setView("mark");
  }
  function csv(scope: string) {
    return `/api/admin/attendance?${new URLSearchParams({ ...active, scope, export: "csv" })}`;
  }
  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="text-sm font-medium">
          Attendance day (India)
          <input
            type="date"
            required
            className={input}
            value={filters.date}
            onChange={(e) =>
              setFilters({
                ...filters,
                date: e.target.value,
                month: e.target.value.slice(0, 7),
              })
            }
          />
        </label>
        <label className="text-sm font-medium">
          Report month
          <input
            type="month"
            required
            className={input}
            value={filters.month}
            onChange={(e) => {
              const month = e.target.value;
              if (month)
                setFilters({ ...filters, month, ...monthRange(month) });
            }}
          />
        </label>
        <label className="text-sm font-medium">
          Search employee / ID / date
          <input
            className={input}
            maxLength={255}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </label>
        {!staffId && (
          <label className="text-sm font-medium">
            Employee
            <select
              className={input}
              value={filters.staffId}
              onChange={(e) =>
                setFilters({ ...filters, staffId: e.target.value })
              }
            >
              <option value="">All staff</option>
              {data?.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.employeeId}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm font-medium">
          Department
          <select
            className={input}
            value={filters.department}
            onChange={(e) =>
              setFilters({ ...filters, department: e.target.value })
            }
          >
            <option value="">All departments</option>
            {data?.departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Status
          <select
            className={input}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="ALL">All statuses / unmarked</option>
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
            <option value="LATE">Late arrivals</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Records
          <select
            className={input}
            value={filters.scope}
            onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
          >
            <option value="all">All — DEMO labeled</option>
            <option value="official">Official only</option>
            <option value="demo">DEMO only</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button className={button} disabled={busy || loading}>
            Apply filters
          </button>
          <button
            type="button"
            className={secondary}
            disabled={busy || loading}
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            Refresh
          </button>
        </div>
        {view === "history" && (
          <>
            <label className="text-sm font-medium">
              History from
              <input
                type="date"
                required
                className={input}
                value={filters.from}
                onChange={(e) =>
                  setFilters({ ...filters, from: e.target.value })
                }
              />
            </label>
            <label className="text-sm font-medium">
              History to
              <input
                type="date"
                required
                min={filters.from}
                className={input}
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </label>
          </>
        )}
      </form>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-4 text-sm text-green-800"
        >
          {message}
        </p>
      )}
      {loading && (
        <p role="status" className="text-sm text-slate-600">
          Loading attendance…
        </p>
      )}
      {data && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Stats
              title={`Official daily attendance · ${data.filters.date}`}
              values={data.officialDaily}
            />
            <Stats
              title={`Official monthly attendance · ${data.filters.month}`}
              values={data.officialMonthly}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p>
              <strong>{data.demoPeriod.total} DEMO records</strong> are labeled
              in tables and excluded from both official dashboards and the
              official CSV.
            </p>
            {data.demoPeriod.from && data.demoPeriod.to && (
              <button
                className={secondary}
                disabled={busy || loading}
                onClick={() => {
                  const next = {
                    ...filters,
                    scope: "demo",
                    status: "ALL",
                    from: data.demoPeriod.from!,
                    to: data.demoPeriod.to!,
                    month: data.demoPeriod.to!.slice(0, 7),
                    date: data.demoPeriod.to!,
                    search: "",
                    department: "",
                  };
                  setFilters(next);
                  apply(next);
                  setView("history");
                }}
              >
                View DEMO records
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className={view === "mark" ? button : secondary}
              disabled={busy}
              onClick={() => setView("mark")}
            >
              Mark attendance
            </button>
            <button
              className={view === "history" ? button : secondary}
              disabled={busy}
              onClick={() => setView("history")}
            >
              History &amp; exports
            </button>
            <span className="text-xs text-slate-500">
              All dates and times: Asia/Kolkata
            </span>
          </div>
          {view === "mark" && !loading && (
            <>
              <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      data.roster.length > 0 &&
                      selected.length === data.roster.length
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? data.roster.map((r) => r.employee.id)
                          : [],
                      )
                    }
                    disabled={busy}
                  />
                  Select all visible staff
                </label>
                <label className="text-sm">
                  Bulk status
                  <select
                    className={input}
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                  >
                    {ATTENDANCE_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <button
                  className={secondary}
                  disabled={busy || !selected.length}
                  onClick={() =>
                    selected.forEach((id) =>
                      patch(id, { leaveStatus: bulkStatus }),
                    )
                  }
                >
                  Apply status to selected
                </button>
                <button
                  className={button}
                  disabled={
                    busy || !selected.length || active.date > data.filters.today
                  }
                  onClick={() => void save(selected)}
                >
                  Save selected ({selected.length})
                </button>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                Mark presence with or without recorded times. Hours and late
                minutes are calculated when you save; hours require check-out.
                Scheduled start defaults to 09:00; set the employee’s actual
                shift before saving. You can record an overnight check-out
                within 24 hours. Clock-now actions use the saved record; save
                edited fields first.
              </p>
              {active.date > data.filters.today && (
                <p className="text-sm text-amber-800">
                  Future attendance cannot be marked.
                </p>
              )}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <caption className="p-4 text-left font-semibold">
                    Staff roster · {data.filters.date}
                  </caption>
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Select",
                        "Employee",
                        "Status",
                        "Scheduled start",
                        "Check in (India)",
                        "Check out (India)",
                        "Hours / Late",
                        "Notes",
                        "Actions",
                      ].map((h) => (
                        <th key={h} className="whitespace-nowrap p-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.roster.map((row) => {
                      const d = drafts[row.employee.id];
                      if (!d) return null;
                      const noTimes = ["ABSENT", "LEAVE"].includes(
                        d.leaveStatus,
                      );
                      const dirty =
                        JSON.stringify(d) !==
                        JSON.stringify(draftFor(row, data.filters.date));
                      const nowDisabled =
                        busy ||
                        data.filters.date !== data.filters.today ||
                        dirty;
                      return (
                        <tr
                          key={row.employee.id}
                          className="border-t border-slate-100 align-top"
                        >
                          <td className="p-3">
                            <input
                              aria-label={`Select ${row.employee.name}`}
                              type="checkbox"
                              checked={selected.includes(row.employee.id)}
                              disabled={busy}
                              onChange={(e) =>
                                setSelected((current) =>
                                  e.target.checked
                                    ? [...current, row.employee.id]
                                    : current.filter(
                                        (id) => id !== row.employee.id,
                                      ),
                                )
                              }
                            />
                          </td>
                          <td className="min-w-44 p-3">
                            <Link
                              className="font-semibold text-blue-700 underline"
                              href={`/admin/dashboard/staff/${row.employee.id}`}
                            >
                              {row.employee.name}
                            </Link>
                            <p className="mt-1 text-xs text-slate-500">
                              {row.employee.employeeId} ·{" "}
                              {row.employee.department || "No department"}
                            </p>
                            <p className="mt-1 text-xs">
                              {row.employee.status} ·{" "}
                              {row.record ? "Recorded" : "Unmarked"}
                            </p>
                            {row.isDemo && (
                              <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                                DEMO
                              </span>
                            )}
                          </td>
                          <td className="min-w-36 p-3">
                            <select
                              aria-label={`Status for ${row.employee.name}`}
                              className={input}
                              value={d.leaveStatus}
                              disabled={busy}
                              onChange={(e) =>
                                patch(row.employee.id, {
                                  leaveStatus: e.target.value,
                                })
                              }
                            >
                              {ATTENDANCE_STATUSES.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="min-w-36 p-3">
                            <input
                              aria-label={`Scheduled start for ${row.employee.name}`}
                              className={input}
                              type="time"
                              value={d.shiftStart}
                              disabled={busy || noTimes}
                              onChange={(e) =>
                                patch(row.employee.id, {
                                  shiftStart: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="min-w-56 p-3">
                            <input
                              aria-label={`Check in for ${row.employee.name}`}
                              className={input}
                              type="datetime-local"
                              step="1"
                              value={d.checkIn}
                              disabled={busy || noTimes}
                              onChange={(e) =>
                                patch(row.employee.id, {
                                  checkIn: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="min-w-56 p-3">
                            <input
                              aria-label={`Check out for ${row.employee.name}`}
                              className={input}
                              type="datetime-local"
                              step="1"
                              value={d.checkOut}
                              disabled={busy || noTimes}
                              onChange={(e) =>
                                patch(row.employee.id, {
                                  checkOut: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="whitespace-nowrap p-3">
                            <p>
                              {row.record?.workingHours == null
                                ? "—"
                                : `${row.record.workingHours} h`}
                            </p>
                            <p className="mt-1 text-xs">
                              {row.record?.lateMinutes || 0} min late
                            </p>
                          </td>
                          <td className="min-w-48 p-3">
                            <textarea
                              aria-label={`Notes for ${row.employee.name}`}
                              className={input}
                              maxLength={1000}
                              value={d.notes}
                              disabled={busy}
                              onChange={(e) =>
                                patch(row.employee.id, {
                                  notes: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="space-y-2 whitespace-nowrap p-3">
                            <button
                              className={button}
                              disabled={
                                busy || active.date > data.filters.today
                              }
                              onClick={() => void save([row.employee.id])}
                            >
                              Save
                            </button>
                            {!row.record?.checkIn ? (
                              <button
                                className={secondary}
                                disabled={nowDisabled || noTimes}
                                onClick={() => void clock(row, "check_in")}
                              >
                                Check in now
                              </button>
                            ) : (
                              !row.record.checkOut && (
                                <button
                                  className={secondary}
                                  disabled={nowDisabled || noTimes}
                                  onClick={() => void clock(row, "check_out")}
                                >
                                  Check out now
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!data.roster.length && (
                  <p className="p-6 text-slate-500">
                    No staff match these filters. Choose All staff and All
                    statuses to mark attendance.
                  </p>
                )}
              </div>
            </>
          )}
          {view === "history" && !loading && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <a className={secondary} href={csv("official")}>
                  Export official CSV
                </a>
                <a className={secondary} href={csv("demo")}>
                  Export DEMO CSV
                </a>
                <p className="text-sm text-slate-500">
                  {data.total} matching records ·{" "}
                  {Number(data.matchingSummary.hours).toFixed(2)} hours in this
                  view
                </p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <caption className="p-4 text-left font-semibold">
                    Attendance history · {active.from} to {active.to}
                  </caption>
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Employee",
                        "Department",
                        "Date",
                        "Status",
                        "Scheduled start",
                        "Check in (India)",
                        "Check out (India)",
                        "Hours",
                        "Late",
                        "Notes",
                        "Action",
                      ].map((h) => (
                        <th className="whitespace-nowrap p-3" key={h}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr
                        className="border-t border-slate-100"
                        key={row.record.id}
                      >
                        <td className="p-3">
                          <Link
                            className="font-semibold text-blue-700 underline"
                            href={`/admin/dashboard/staff/${row.record.staffId}`}
                          >
                            {row.name}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {row.employeeId}
                          </p>
                          {row.isDemo && (
                            <strong className="text-xs text-amber-800">
                              DEMO
                            </strong>
                          )}
                        </td>
                        <td className="p-3">{row.department || "—"}</td>
                        <td className="whitespace-nowrap p-3">
                          {row.record.attendanceDate}
                        </td>
                        <td className="p-3">
                          {row.record.leaveStatus || "Unclassified"}
                        </td>
                        <td className="p-3">
                          {row.record.shiftStart?.slice(0, 5) || "—"}
                        </td>
                        <td className="whitespace-nowrap p-3">
                          {row.record.checkIn
                            ? indiaDateTime(row.record.checkIn).replace(
                                "T",
                                " ",
                              )
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap p-3">
                          {row.record.checkOut
                            ? indiaDateTime(row.record.checkOut).replace(
                                "T",
                                " ",
                              )
                            : "—"}
                        </td>
                        <td className="p-3">
                          {row.record.workingHours ?? "—"}
                        </td>
                        <td className="p-3">
                          {row.record.lateMinutes || 0} min
                        </td>
                        <td className="max-w-64 break-words p-3">
                          {row.record.notes || "—"}
                        </td>
                        <td className="p-3">
                          <button
                            className={secondary}
                            onClick={() => edit(row)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.rows.length && (
                  <p className="p-6 text-slate-500">
                    No attendance records match these filters.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  className={secondary}
                  disabled={page <= 1}
                  onClick={() => {
                    setLoading(true);
                    setPage(page - 1);
                  }}
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {page} of {Math.max(1, Math.ceil(data.total / 100))}
                </span>
                <button
                  className={secondary}
                  disabled={page * 100 >= data.total}
                  onClick={() => {
                    setLoading(true);
                    setPage(page + 1);
                  }}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
      {!data && !loading && (
        <button
          className={secondary}
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          Retry loading attendance
        </button>
      )}
    </div>
  );
}
