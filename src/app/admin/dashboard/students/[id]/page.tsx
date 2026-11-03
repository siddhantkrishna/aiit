"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DocumentUpload from "@/components/DocumentUpload";
import OperationsForm from "@/components/OperationsForm";

type Student = { id: number; studentId: string; firstName: string | null; lastName: string | null; fatherName: string | null; motherName: string | null; mobile: string | null; email: string | null; dob: string | null; address: string | null; totalFee: string | null; amountPaid: string | null; amountPending: string | null; studyMode: string | null; admissionDate: string | null; enrollmentNumber: string | null; universityStatus: string | null; universityNextAction: string | null; requiredDocuments: string | null; examStatus: string | null; resultStatus: string | null; certificateStatus: string | null; admitCardPath: string | null };
type RecordData = { student: Student; course: string | null; university: string | null; centre: string | null;
  documents: { id: number; source: string; name: string; type: string; path: string | null; status: string | null }[];
  payments: { id: number; receiptId: string; amount: string; paymentDate: string; paymentStatus: string | null }[];
  services: { id: number; serviceType: string; status: string | null; dueDate: string | null }[];
  results: { id: number; examination: string; subject: string; marksObtained: string; maxMarks: string; resultStatus: string }[];
};
export default function StudentRecordPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RecordData | null>(null);
  const [error, setError] = useState("");
  const [accessCode, setAccessCode] = useState("");
  async function load() {
    try { const response = await fetch(`/api/admin/students/${id}`, { cache: "no-store" }); const value = await response.json(); if (!response.ok) throw new Error(value.error); setData(value); setError(""); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to load record."); }
  }
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/students/${id}`, { cache: "no-store" }).then(async response => {
      const value = await response.json(); if (!response.ok) throw new Error(value.error); if (active) setData(value);
    }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [id]);
  async function verifyDocument(documentId: number, verificationStatus: string) {
    try {
      const response = await fetch(`/api/admin/students/${id}/documents`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId, verificationStatus }) });
      const value = await response.json(); if (!response.ok) throw new Error(value.error); await load();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to verify document."); }
  }
  async function issueCode() {
    try {
      const response = await fetch("/api/admin/students", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: Number(id), action: "issue-access-code" }) });
      const value = await response.json(); if (!response.ok) throw new Error(value.error); setAccessCode(value.accessCode);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to issue code."); }
  }
  if (!data) return <div><Link href="/admin/dashboard/students">← Students</Link><p role="status" className="mt-4">{error || "Loading student record…"}</p></div>;
  const s = data.student;
  return <div className="max-w-6xl mx-auto space-y-6">
    <Link href="/admin/dashboard/students" className="text-blue-600">← Students</Link>
    <h1 className="text-3xl font-bold">{s.firstName} {s.lastName}</h1><p>{s.studentId} · {data.course} · {data.university || "AIIT"} · {data.centre} · {s.studyMode}</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <section className="bg-white rounded-xl border p-5 grid sm:grid-cols-3 gap-4">
      <p>Agreed fee: INR {s.totalFee || "0"}</p><p>Collected: INR {s.amountPaid || "0"}</p><p>Pending: INR {s.amountPending || "0"}</p>
      <p>Mobile: {s.mobile}</p><p>Email: {s.email || "—"}</p><p>Birth date: {s.dob}</p><p>Father: {s.fatherName || "—"}</p><p>Mother: {s.motherName || "—"}</p><p>Admission: {s.admissionDate}</p><p className="sm:col-span-3">Address: {s.address || "—"}</p>
    </section>
    <OperationsForm endpoint="/api/admin/students" records={[s]} allowCreate={false} onSaved={load} title="Update student & university processing" fields={[
      { key: "firstName", label: "First name", required: true }, { key: "lastName", label: "Last name" }, { key: "fatherName", label: "Father name" }, { key: "motherName", label: "Mother name" },
      { key: "mobile", label: "Mobile", required: true }, { key: "email", label: "Email" }, { key: "centreId", label: "Centre", source: "centres" }, { key: "universityId", label: "University", source: "universities" },
      { key: "studyMode", label: "Study mode" }, { key: "studentStatus", label: "Student status", options: ["ACTIVE", "INACTIVE", "COMPLETED", "DROPPED"], required: true },
      { key: "totalFee", label: "Agreed total fee (INR)", type: "number", required: true }, { key: "documentStatus", label: "Documents", options: ["PENDING", "VERIFIED", "REJECTED"] },
      { key: "universityStatus", label: "University processing", options: ["PENDING", "DOCUMENTS PENDING", "SUBMITTED", "ENROLLED", "ACTION REQUIRED", "COMPLETED"] },
      { key: "universitySubmittedAt", label: "University submission date", type: "date" }, { key: "enrollmentNumber", label: "Enrollment number" }, { key: "requiredDocuments", label: "Documents required", type: "textarea" },
      { key: "universityNextAction", label: "Pending university action", type: "textarea" }, { key: "examStatus", label: "Exam form status" }, { key: "resultStatus", label: "Result status" },
      { key: "certificateStatus", label: "Certificate / degree status" }, { key: "remarks", label: "Internal remarks", type: "textarea" },
    ]} />
    <section className="bg-white rounded-xl border p-5"><h2 className="text-lg font-bold">Private service access</h2><p className="mt-2 text-sm">Issue a private access code after verifying the student in person or by a trusted channel. Issuing a new code invalidates previous codes and sessions.</p><button onClick={issueCode} className="mt-3 border rounded-lg px-4 py-2">Issue / replace access code</button>{accessCode && <div role="status" className="mt-3 break-all"><p>Share securely with this student. Shown only here:</p><code className="select-all">{accessCode}</code><button onClick={() => setAccessCode("")} className="ml-4 underline">Hide</button></div>}</section>
    <DocumentUpload endpoint={`/api/admin/students/${id}/documents`} types={["ADMIT_CARD", "EXAM_FORM", "RESULT", "CERTIFICATE", "UNIVERSITY_DOCUMENT", "SUPPORTING"]} onUploaded={load} />
    <section className="bg-white rounded-xl border p-5"><h2 className="text-lg font-bold">Documents</h2><p className="text-xs mt-1">Secure links expire after two minutes. Refresh this page for new links.</p><ul className="mt-3 space-y-2">{data.documents.map((d, i) => <li key={`${d.name}-${i}`}>{d.type} · {d.status} · {d.path ? <a href={d.path} target="_blank" rel="noreferrer" className="text-blue-600 underline">{d.name}</a> : d.name}{d.source === "student" && <span className="ml-3 inline-flex gap-3"><button onClick={() => verifyDocument(d.id, "VERIFIED")} className="text-green-700 underline">Verify</button><button onClick={() => verifyDocument(d.id, "REJECTED")} className="text-red-700 underline">Reject</button></span>}</li>)}</ul>{s.admitCardPath && <a href={s.admitCardPath} className="text-blue-600" target="_blank" rel="noreferrer">Admit card</a>}</section>
    <section className="bg-white rounded-xl border p-5"><h2 className="text-lg font-bold">Payment history</h2><ul className="mt-3 space-y-2">{data.payments.map(p => <li key={p.id}>{p.paymentDate} · INR {p.amount} · {p.paymentStatus} {p.paymentStatus === "VERIFIED" && <a className="text-blue-600 underline" href={`/api/admin/payments/${p.id}/receipt`}>Download receipt</a>}</li>)}</ul><Link className="mt-3 inline-block text-blue-600" href="/admin/dashboard/payments">Manage payments →</Link></section>
    <section className="bg-white rounded-xl border p-5"><h2 className="text-lg font-bold">Academic progress & results</h2><p className="mt-2">Exam: {s.examStatus || "Pending"} · Result: {s.resultStatus || "Pending"} · Certificate: {s.certificateStatus || "Pending"}</p><ul className="mt-3 space-y-2">{data.results.map(r => <li key={r.id}>{r.examination} · {r.subject} · {r.marksObtained}/{r.maxMarks} · {r.resultStatus}</li>)}</ul></section>
    <section className="bg-white rounded-xl border p-5"><h2 className="text-lg font-bold">Student services</h2><ul className="mt-3 space-y-2">{data.services.map(r => <li key={r.id}>{r.serviceType} · {r.status} · Due {r.dueDate || "—"}</li>)}</ul><Link className="mt-3 inline-block text-blue-600" href="/admin/dashboard/services">Manage services →</Link></section>
  </div>;
}
