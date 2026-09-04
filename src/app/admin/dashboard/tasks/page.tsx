"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  id: number;
  taskId: string | null;
  staffId: number | null;
  centreId: number | null;
  taskDate: string | null;
  taskName: string;
  description: string | null;
  deadline: string | null;
  assignedTo: number | null;
  priority: string | null;
  dueDate: string | null;
  status: string | null;
  qualityScore: number | string | null;
  completedAt: string | null;
  completionNotes: string | null;
  remarks: string | null;
};

const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const PRIORITY_OPTIONS = [
  "ALL",
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function priorityClass(priority: string) {
  switch (priority) {
    case "URGENT":
      return "bg-red-100 text-red-700";
    case "HIGH":
      return "bg-orange-100 text-orange-700";
    case "LOW":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (status !== "ALL") {
        params.set("status", status);
      }

      if (priority !== "ALL") {
        params.set("priority", priority);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/admin/tasks?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();

      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [status, priority]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return tasks;

    return tasks.filter((task) =>
      [
        task.taskId,
        task.taskName,
        task.description,
        task.remarks,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [tasks, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Operations
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Staff Tasks
          </h1>

          <p className="text-slate-500 mt-2">
            Assign, monitor and track staff work.
          </p>
        </div>

        <button
          onClick={loadTasks}
          className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task..."
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
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

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            {PRIORITY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL"
                  ? "All Priorities"
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
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No tasks found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Task
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Priority
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assigned
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Due
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => {
                  const taskStatus = task.status || "PENDING";
                  const taskPriority = task.priority || "NORMAL";

                  return (
                    <tr
                      key={task.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {task.taskName}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {task.taskId || `Task #${task.id}`}
                        </p>

                        {task.description && (
                          <p className="text-xs text-slate-500 mt-2 max-w-md">
                            {task.description}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(
                            taskPriority,
                          )}`}
                        >
                          {taskPriority}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {task.assignedTo
                          ? `Staff #${task.assignedTo}`
                          : task.staffId
                            ? `Staff #${task.staffId}`
                            : "Unassigned"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {task.dueDate
                          ? new Date(
                              task.dueDate,
                            ).toLocaleDateString("en-IN")
                          : task.deadline
                            ? new Date(
                                task.deadline,
                              ).toLocaleDateString("en-IN")
                            : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            taskStatus,
                          )}`}
                        >
                          {taskStatus.replace("_", " ")}
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
        Showing {filteredTasks.length} tasks.
      </p>
    </div>
  );
}