"use client";

import { startTransition, useEffect, useState } from "react";

type Service = {
  id: number;
  studentId: number;
  serviceType: string;
  status: string | null;
  priority: string | null;
  requestedAt: string;
  dueDate: string | null;
  completedAt: string | null;
  assignedTo: number | null;
  referenceNumber: string | null;
  notes: string | null;
  remarks: string | null;
};

const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "IN PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "IN PROGRESS":
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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("PENDING");
  const [editRemarks, setEditRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadServices() {
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
        `/api/admin/services?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load services");
      }

      const data = await response.json();

      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load student services.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { startTransition(() => {
    loadServices();
  }); }, [status]);

  async function saveReview() {
    if (!editingId) return;
    setSaving(true);setError("");
    try {
      const response=await fetch("/api/admin/services",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:editingId,status:editStatus,remarks:editRemarks})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Unable to update request.");
      setEditingId(null);await loadServices();
    }catch(e){setError(e instanceof Error?e.message:"Unable to update request.");}finally{setSaving(false);}
  }
  const filteredServices = services.filter((service) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      service.studentId,
      service.serviceType,
      service.status,
      service.priority,
      service.referenceNumber,
      service.notes,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(query),
      );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Student Support
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Student Services
          </h1>

          <p className="text-slate-500 mt-2">
            Track student requests, ownership and completion.
          </p>
        </div>

        <button
          onClick={loadServices}
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
            placeholder="Search student, service or reference..."
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
            Loading services...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No student services found.
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
                    Service
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
                    Status / Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredServices.map((service) => {
                  const serviceStatus =
                    service.status || "PENDING";

                  const priority =
                    service.priority || "NORMAL";

                  return (
                    <tr
                      key={service.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          Student #{service.studentId}
                        </p>

                        {service.referenceNumber && (
                          <p className="text-xs text-slate-400 mt-1">
                            Ref: {service.referenceNumber}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        <p>{service.serviceType}</p>
                        {service.notes && <p className="mt-1 max-w-xs whitespace-pre-wrap text-xs text-slate-500">{service.notes}</p>}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(
                            priority,
                          )}`}
                        >
                          {priority}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {service.assignedTo
                          ? `Staff #${service.assignedTo}`
                          : "Unassigned"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {service.dueDate
                          ? new Date(
                              service.dueDate,
                            ).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            serviceStatus,
                          )}`}
                        >
                          {serviceStatus}
                        </span>
                        <button onClick={()=>{setEditingId(service.id);setEditStatus(serviceStatus);setEditRemarks(service.remarks||"");}} className="mt-2 block text-xs font-semibold text-blue-700 underline">Update</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingId !== null && <section className="space-y-3 rounded-xl border border-blue-200 bg-white p-5">
        <h2 className="font-bold">Update student request #{editingId}</h2>
        <label className="block text-sm">Status<select className="mt-1 block w-full rounded-lg border p-2" value={editStatus} onChange={e=>setEditStatus(e.target.value)}>{STATUS_OPTIONS.filter(s=>s!=="ALL").map(s=><option key={s}>{s}</option>)}</select></label>
        <label className="block text-sm">Student-facing response<textarea rows={3} maxLength={1000} className="mt-1 block w-full rounded-lg border p-2" value={editRemarks} onChange={e=>setEditRemarks(e.target.value)} placeholder="Share a status update or explanation with the student"/></label>
        <div className="flex gap-2"><button disabled={saving} onClick={()=>void saveReview()} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Save response</button><button onClick={()=>setEditingId(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div>
      </section>}
      <p className="text-sm text-slate-500">
        Showing {filteredServices.length} services.
      </p>
    </div>
  );
}