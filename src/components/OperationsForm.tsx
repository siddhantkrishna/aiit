"use client";

import { useEffect, useState } from "react";

type Field = { key: string; label: string; type?: "text" | "number" | "date" | "datetime-local" | "textarea"; required?: boolean; options?: string[]; source?: string };
type Props = { endpoint: string; fields: Field[]; records?: { id: number }[]; onSaved: () => void; title?: string; allowCreate?: boolean };

function inputValue(value: unknown, type?: Field["type"]) {
  if (value == null) return "";
  if (type === "datetime-local") {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  return String(value);
}
function recordLabel(record: { id: number }) {
  const row = record as Record<string, unknown>;
  return `${row.studentId || row.leadId || row.employeeId || row.taskId || row.receiptId || row.transactionCode || row.attendanceDate || row.serviceType || `#${row.id}`} - ${row.name || row.firstName || row.taskName || ""}`;
}

export default function OperationsForm({ endpoint, fields, records = [], onSaved, title = "Add or update record", allowCreate = true }: Props) {
  const [selectedId, setSelectedId] = useState(allowCreate ? "" : String(records[0]?.id || ""));
  const [options, setOptions] = useState<Record<string, { id: number; label: string }[]>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const selected = records.find(row => String(row.id) === selectedId) as Record<string, unknown> | undefined;

  useEffect(() => {
    let active = true;
    fetch("/api/admin/options", { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load choices");
      if (active) setOptions(data);
    }).catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allowCreate && !selectedId) return;
    setSaving(true); setMessage("");
    const element = event.currentTarget;
    const form = new FormData(element);
    const values: Record<string, unknown> = Object.fromEntries(form.entries());
    for (const field of fields) if (field.type === "datetime-local" && values[field.key]) values[field.key] = new Date(String(values[field.key])).toISOString();
    if (selectedId) values.id = Number(selectedId);
    try {
      const response = await fetch(endpoint, { method: selectedId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save");
      setMessage("Saved."); if (!selectedId) element.reset(); onSaved();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save"); }
    finally { setSaving(false); }
  }

  return <details className="rounded-xl border border-slate-200 bg-white p-4">
    <summary className="cursor-pointer font-semibold text-blue-700">{title}</summary>
    <label className="mt-4 block text-sm">Record
      <select aria-label="Record to edit" value={selectedId} onChange={e => { setSelectedId(e.target.value); setMessage(""); }} className="mt-1 w-full rounded-lg border p-2">
        {allowCreate && <option value="">Add new</option>}{!allowCreate && !records.length && <option value="">No records</option>}
        {records.map(row => <option key={row.id} value={row.id}>{recordLabel(row)}</option>)}
      </select>
    </label>
    <form key={selectedId || "new"} onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
      {fields.map(field => <label key={field.key} className="block text-sm">{field.label}{field.required ? " *" : ""}
        {field.options || field.source ? <select aria-label={field.label} name={field.key} defaultValue={inputValue(selected?.[field.key])} required={field.required} className="mt-1 w-full rounded-lg border p-2">
          <option value="">Choose</option>{field.source ? (options[field.source] || []).map(item => <option key={item.id} value={item.id}>{item.label}</option>) : field.options?.map(item => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select> : field.type === "textarea" ? <textarea aria-label={field.label} name={field.key} defaultValue={inputValue(selected?.[field.key])} required={field.required} maxLength={4000} className="mt-1 w-full rounded-lg border p-2" /> :
          <input aria-label={field.label} name={field.key} type={field.type || "text"} defaultValue={inputValue(selected?.[field.key], field.type)} required={field.required} step={field.type === "number" ? "0.01" : undefined} maxLength={2000} className="mt-1 w-full rounded-lg border p-2" />}
      </label>)}
      <div className="sm:col-span-2"><button disabled={saving || !allowCreate && !selectedId} className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button><p role="status" className="mt-2 text-sm">{message}</p></div>
    </form>
  </details>;
}
