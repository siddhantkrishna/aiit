"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import StaffAttendance from "@/components/StaffAttendance";

type Member = {
  id: number;
  name: string;
  employeeId: string;
  role: string | null;
  department: string | null;
  status: string | null;
  joiningDate: string | null;
  employmentType: string | null;
  email: string | null;
  mobile: string | null;
};
export default function StaffProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [member, setMember] = useState<Member | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/staff/${id}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Unable to load staff profile.");
        setMember(result);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [id]);
  return (
    <div className="space-y-6">
      <Link
        href="/admin/dashboard/staff"
        className="text-sm font-semibold text-blue-700 underline"
      >
        ← Staff
      </Link>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      {member ? (
        <>
          <header className="rounded-xl border border-slate-200 bg-white p-6">
            <h1 className="text-3xl font-bold text-slate-900">{member.name}</h1>
            <p className="mt-2 text-slate-500">
              {member.employeeId} · {member.status}
            </p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Role", member.role],
                ["Department", member.department],
                ["Joining date", member.joiningDate],
                ["Employment type", member.employmentType],
                ["Email", member.email],
                ["Mobile", member.mobile],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="mt-1 font-medium">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </header>
          <h2 className="text-2xl font-bold">Attendance history</h2>
          <StaffAttendance key={member.id} staffId={member.id} />
        </>
      ) : (
        !error && <p>Loading staff profile…</p>
      )}
    </div>
  );
}
