"use client";

import { useEffect, useMemo, useState } from "react";

type Payment = {
  id: number;
  receiptId: string;
  receiptNumber: string | null;
  studentId: number | null;
  applicationId: number | null;
  centreId: number | null;
  paymentDate: string;
  amount: number | string;
  paymentType: string | null;
  paymentMode: string | null;
  referenceNumber: string | null;
  paymentStatus: string | null;
  notes: string | null;
};

const STATUS_OPTIONS = [
  "ALL",
  "RECEIVED",
  "VERIFIED",
  "PENDING",
  "REJECTED",
  "REFUNDED",
];

function statusClass(status: string) {
  switch (status) {
    case "VERIFIED":
      return "bg-green-100 text-green-700";
    case "REJECTED":
    case "REFUNDED":
      return "bg-red-100 text-red-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function formatCurrency(value: number | string) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  async function loadPayments() {
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
        `/api/admin/payments?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load payments");
      }

      const data = await response.json();

      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, [status]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return payments;
    }

    return payments.filter((payment) =>
      [
        payment.receiptId,
        payment.receiptNumber,
        payment.referenceNumber,
        payment.paymentType,
        payment.paymentMode,
        payment.studentId,
        payment.applicationId,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [payments, search]);

  const total = filteredPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Finance
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Payments
          </h1>

          <p className="text-slate-500 mt-2">
            Track collections, receipts and payment verification.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Records
          </p>

          <p className="text-3xl font-bold text-slate-900 mt-2">
            {filteredPayments.length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Amount
          </p>

          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt, reference, student or application..."
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL" ? "All Statuses" : item}
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
            Loading payments...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No payments found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Receipt
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mode
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => {
                  const paymentStatus =
                    payment.paymentStatus || "RECEIVED";

                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {payment.receiptNumber ||
                            payment.receiptId}
                        </p>

                        {payment.referenceNumber && (
                          <p className="text-xs text-slate-400 mt-1">
                            Ref: {payment.referenceNumber}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {payment.studentId
                          ? `Student #${payment.studentId}`
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {payment.paymentMode || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {payment.paymentDate
                          ? new Date(
                              payment.paymentDate,
                            ).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            paymentStatus,
                          )}`}
                        >
                          {paymentStatus}
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
    </div>
  );
}