"use client";
import DocumentUpload from "@/components/DocumentUpload";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Application = {
  id: number;
  applicationId: string;
  courseId: number;
  universityId: number | null;
  studyMode: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  qualification: string | null;
  tenthBoard: string;
  tenthYear: string;
  tenthPercentage: string;
  twelfthBoard: string;
  twelfthYear: string;
  twelfthPercentage: string;
  gradUniversity: string;
  gradYear: string;
  gradPercentage: string;
  paymentScreenshotPath: string | null;
  paymentScreenshotUploadedAt: string | null;
  status: string;
  applicationStatus: string | null;
  documentStatus: string | null;
  verificationStatus: string | null;
  nextAction: string | null;
  dueDate: string | null;
  remarks: string | null;
  declaration: boolean;
  createdAt: string;
  updatedAt: string;
};

type Document = {
  id: number;
  docType: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
};

type ApplicationResponse = {
  application: Application;
  documents: Document[];
  history: { id: number; oldStatus: string | null; newStatus: string; changedAt: string; changedBy: number | null; notes: string | null }[];
};

const statuses = [
  "RECEIVED",
  "UNDER REVIEW",
  "DOCUMENTS PENDING",
  "VERIFIED",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
];

function statusClass(status: string) {
  switch (status) {
    case "APPROVED":
    case "VERIFIED":
    case "COMPLETED":
      return "bg-green-50 text-green-700 border-green-200";

    case "REJECTED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";

    case "DOCUMENTS PENDING":
    case "UNDER REVIEW":
    case "SUBMITTED":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params.id;
  const applicationId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [review, setReview] = useState({ applicationStatus: "RECEIVED", documentStatus: "PENDING", verificationStatus: "PENDING", nextAction: "", dueDate: "", remarks: "" });
  const [data, setData] = useState<ApplicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadApplication() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/applications/${applicationId}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Application not found");
      }

      const result = await response.json();

      setData(result);
      setReview({ applicationStatus: result.application.applicationStatus || "RECEIVED", documentStatus: result.application.documentStatus || "PENDING", verificationStatus: result.application.verificationStatus || "PENDING", nextAction: result.application.nextAction || "", dueDate: result.application.dueDate || "", remarks: result.application.remarks || "" });
    } catch (err) {
      console.error(err);
      setData(null);
      setError("Unable to load application.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (applicationId) {
      loadApplication();
    }
  }, [applicationId]);

  async function updateStatus(newStatus: string) {
    if (!data || saving) return;

    const confirmed = window.confirm(
      `Change application status to "${formatStatus(newStatus)}"?`,
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/applications/${applicationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...review, applicationStatus: newStatus,
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update");
      }

      await loadApplication();
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : "Failed to update application status.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500">
          Loading application...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <p className="text-slate-600">
          {error || "Application not found."}
        </p>

        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline text-sm font-medium"
        >
          ← Back
        </button>
      </div>
    );
  }

  const app = data.application;

  const currentStatus =
    app.applicationStatus ||
    app.status ||
    "RECEIVED";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-blue-600 mb-3"
          >
            ← Back to Applications
          </button>

          <h1 className="text-3xl font-bold text-slate-900">
            {app.applicationId}
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Submitted{" "}
            {new Date(app.createdAt).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              },
            )}
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${statusClass(
            currentStatus,
          )}`}
        >
          {formatStatus(currentStatus)}
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              disabled={saving}
              onClick={() => updateStatus(status)}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                currentStatus === status
                  ? statusClass(status)
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              } disabled:opacity-50`}
            >
              {formatStatus(status)}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); updateStatus(review.applicationStatus); }} className="bg-white rounded-2xl border p-6 grid gap-4 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-lg font-bold">Verification & missing documents</h2>
        <label className="text-sm">Application status<select aria-label="Application status" value={review.applicationStatus} onChange={e => setReview({ ...review, applicationStatus: e.target.value })} className="mt-1 w-full border rounded p-2">{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
        {["documentStatus", "verificationStatus"].map(key => <label key={key} className="text-sm">{key === "documentStatus" ? "Document verification" : "Applicant verification"}<select aria-label={key} value={review[key as "documentStatus" | "verificationStatus"]} onChange={e => setReview({ ...review, [key]: e.target.value })} className="mt-1 w-full border rounded p-2">{["PENDING", "VERIFIED", "REJECTED"].map(v => <option key={v}>{v}</option>)}</select></label>)}
        <label className="text-sm">Due date<input aria-label="Due date" type="date" value={review.dueDate} onChange={e => setReview({ ...review, dueDate: e.target.value })} className="mt-1 w-full border rounded p-2" /></label>
        <label className="text-sm">Next action / missing documents (visible in verified status lookup)<textarea aria-label="Next action" value={review.nextAction} onChange={e => setReview({ ...review, nextAction: e.target.value })} maxLength={2000} className="mt-1 w-full border rounded p-2" /></label>
        <label className="text-sm">Internal remarks<textarea aria-label="Internal remarks" value={review.remarks} onChange={e => setReview({ ...review, remarks: e.target.value })} maxLength={4000} className="mt-1 w-full border rounded p-2" /></label>
        <button disabled={saving} className="rounded-lg bg-blue-600 text-white p-3 disabled:opacity-50">Save review</button>
      </form>
      <section className="bg-white rounded-2xl border p-6">
        <h2 className="text-lg font-bold">Review history</h2>
        <ul className="mt-4 space-y-3">{data.history.map(h => <li key={h.id} className="border-b pb-3 text-sm"><strong>{h.oldStatus || "Submitted"} → {h.newStatus}</strong><p>{new Date(h.changedAt).toLocaleString("en-IN")} {h.changedBy ? `· Admin #${h.changedBy}` : ""}</p><p className="whitespace-pre-wrap">{h.notes}</p></li>)}</ul>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Applicant Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          <Info label="Full Name">
            {app.firstName} {app.lastName}
          </Info>

          <Info label="Father Name">
            {app.fatherName || "—"}
          </Info>

          <Info label="Mother Name">
            {app.motherName || "—"}
          </Info>

          <Info label="Mobile">
            {app.mobile || "—"}
          </Info>

          <Info label="Email">
            {app.email || "—"}
          </Info>

          <Info label="Date of Birth">
            {app.dob || "—"}
          </Info>

          <Info label="Gender">
            {app.gender || "—"}
          </Info>

          <Info label="City">
            {app.city || "—"}
          </Info>

          <Info label="State">
            {app.state || "—"}
          </Info>

          <Info label="PIN Code">
            {app.pinCode || "—"}
          </Info>
        </div>

        <div className="mt-6">
          <Info label="Address">
            {app.address || "—"}
          </Info>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Academic Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          <Info label="Highest qualification">{app.qualification || "—"}</Info>
          <Info label="10th Board">
            {app.tenthBoard || "—"}
          </Info>

          <Info label="10th Year">
            {app.tenthYear || "—"}
          </Info>

          <Info label="10th Percentage">
            {app.tenthPercentage || "—"}
          </Info>

          <Info label="12th Board">
            {app.twelfthBoard || "—"}
          </Info>

          <Info label="12th Year">
            {app.twelfthYear || "—"}
          </Info>

          <Info label="12th Percentage">
            {app.twelfthPercentage || "—"}
          </Info>

          <Info label="Graduation University">
            {app.gradUniversity || "—"}
          </Info>

          <Info label="Graduation Year">
            {app.gradYear || "—"}
          </Info>

          <Info label="Graduation Percentage">
            {app.gradPercentage || "—"}
          </Info>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Application Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
          <Info label="Course ID">
            {app.courseId}
          </Info>

          <Info label="University ID">
            {app.universityId ?? "—"}
          </Info>

          <Info label="Study Mode">
            {app.studyMode || "—"}
          </Info>

          <Info label="Document Status">
            {app.documentStatus || "PENDING"}
          </Info>

          <Info label="Verification">
            {app.verificationStatus || "PENDING"}
          </Info>

          <Info label="Next Action">
            {app.nextAction || "—"}
          </Info>

          <Info label="Due Date">
            {app.dueDate || "—"}
          </Info>

          <Info label="Declaration">
            {app.declaration ? "Accepted" : "Not Accepted"}
          </Info>
        </div>

        {app.remarks && (
          <div className="mt-6">
            <Info label="Remarks">
              {app.remarks}
            </Info>
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Documents
        </h2>
        <p className="mt-2 text-xs">Links expire in two minutes. Reload for fresh links.</p>
        <DocumentUpload endpoint={`/api/applications/${applicationId}/documents`} types={["photo", "aadhaar", "tenthMarksheet", "twelfthMarksheet", "gradMarksheet", "otherDoc"]} onUploaded={loadApplication} />

        {data.documents.length === 0 ? (
          <p className="text-sm text-slate-500 mt-5">
            No documents uploaded.
          </p>
        ) : (
          <div className="mt-5 divide-y divide-slate-100">
            {data.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {doc.fileName}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    {doc.docType}
                  </p>
                </div>

                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                >
                  View Document
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Payment
        </h2>

        <div className="mt-5">
          {app.paymentScreenshotPath ? (
            <div className="space-y-3">
              <p className="text-sm text-green-600 font-medium">
                Payment screenshot uploaded
              </p>

              <a
                href={app.paymentScreenshotPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                View Payment Screenshot
              </a>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No payment screenshot uploaded.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-800 break-words">
        {children}
      </p>
    </div>
  );
}