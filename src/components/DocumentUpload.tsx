"use client";
import { useState } from "react";

export default function DocumentUpload({ endpoint, types, onUploaded }: { endpoint: string; types: string[]; onUploaded: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; setBusy(true); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "POST", body: new FormData(form) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Upload failed");
      setMessage("Uploaded securely. Review verification status before approval."); form.reset(); onUploaded();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={upload} className="mt-4 rounded-xl border bg-white p-4 space-y-3">
    <p className="font-semibold">Add missing / supporting document</p>
    <label className="block text-sm">Document type<select name="docType" aria-label="Document type" required className="mt-1 w-full border rounded p-2">{types.map(type => <option key={type}>{type}</option>)}</select></label>
    <label className="block text-sm">File (JPG, PNG, WebP, PDF; up to 3MB)<input name="file" aria-label="Document file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className="mt-1 block w-full" /></label>
    <button disabled={busy} className="bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">{busy ? "Uploading…" : "Upload securely"}</button><p role="status" className="text-sm">{message}</p>
  </form>;
}
