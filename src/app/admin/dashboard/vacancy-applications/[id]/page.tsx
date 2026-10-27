"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Data = {
  application: {
    applicationId: string;
    firstName: string;
    lastName: string | null;
    mobile: string;
    email: string;
    address: string | null;
    city: string | null;
    state: string | null;
    qualification: string | null;
    experience: string | null;
    status: string;
    resumePath: string | null;
  };
  vacancy: { title: string } | null;
};

const statuses = ["pending", "reviewed", "shortlisted", "rejected", "hired"];

export default function VacancyApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/vacancy-applications/" + encodeURIComponent(id), { cache: "no-store" });
      if (!response.ok) {
        throw new Error(response.status === 404 ? "Application not found." : "Unable to load the application. Please retry.");
      }
      setData((await response.json()) as Data);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load the application.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function update(status: string) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/vacancy-applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error("Could not update status. Please retry.");
      const result = await response.json();
      if (!result.application) throw new Error("Application could not be found.");
      setData((previous) => previous
        ? { ...previous, application: { ...previous.application, status: result.application.status } }
        : previous);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-20 text-center text-muted">Loading application...</div>;
  if (!data) return (
    <div className="py-20 text-center">
      <p role="alert" className="text-red-700">{error || "Application not found."}</p>
      <div className="mt-4 flex justify-center gap-4">
        <button type="button" onClick={() => void load()} className="text-primary underline">Try again</button>
        <button type="button" onClick={() => router.back()} className="text-primary underline">Go back</button>
      </div>
    </div>
  );

  const a = data.application;
  return (
    <div className="mx-auto max-w-4xl">
      <button type="button" onClick={() => router.back()} className="mb-3 text-sm text-muted hover:text-primary">
        ← Back to applications
      </button>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">{a.applicationId}</p>
          <h1 className="text-2xl font-bold">{a.firstName} {a.lastName}</h1>
          <p className="mt-1 text-sm text-muted">Applied for {data.vacancy?.title || "a vacancy"}</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Update application status">
          {statuses.map((status) => (
            <button key={status} type="button" onClick={() => void update(status)}
              disabled={saving || status === a.status} aria-pressed={status === a.status}
              className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium capitalize hover:bg-blue-50 disabled:opacity-50">
              {status}
            </button>
          ))}
        </div>
      </div>
      {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 font-bold">Applicant Details</h2>
          <div className="space-y-3 text-sm">
            <p><span className="text-muted">Mobile:</span> {a.mobile}</p>
            <p><span className="text-muted">Email:</span> {a.email}</p>
            <p><span className="text-muted">Address:</span> {a.address || "N/A"}</p>
            <p><span className="text-muted">City:</span> {a.city || "N/A"}</p>
            <p><span className="text-muted">State:</span> {a.state || "N/A"}</p>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 font-bold">Professional Details</h2>
          <div className="space-y-3 text-sm">
            <p><span className="text-muted">Qualification:</span> {a.qualification || "N/A"}</p>
            <p><span className="text-muted">Experience:</span> {a.experience || "N/A"}</p>
            <p><span className="text-muted">Status:</span> <span className="capitalize">{a.status}</span></p>
            {a.resumePath ? (
              <a href={a.resumePath} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex rounded-lg bg-primary px-4 py-2 text-sm text-white">Open Resume</a>
            ) : (
              <p className="text-muted">Resume: Not attached (optional)</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
