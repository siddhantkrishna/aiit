"use client";

import { useEffect, useMemo, useState } from "react";

type Transaction = {
  id: number;
  transactionCode: string;
  transactionDate: string;
  centreId: number | null;
  transactionType: string;
  category: string;
  description: string | null;
  amount: number | string;
  paymentMode: string | null;
  referenceNumber: string | null;
  status: string | null;
  notes: string | null;
};

const TYPE_OPTIONS = [
  "ALL",
  "INCOME",
  "EXPENSE",
  "TRANSFER",
  "REFUND",
  "ADJUSTMENT",
];

const STATUS_OPTIONS = [
  "ALL",
  "DRAFT",
  "POSTED",
  "VOID",
];

function typeClass(type: string) {
  switch (type) {
    case "INCOME":
      return "bg-green-100 text-green-700";
    case "EXPENSE":
      return "bg-red-100 text-red-700";
    case "REFUND":
      return "bg-orange-100 text-orange-700";
    case "TRANSFER":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "POSTED":
      return "bg-green-100 text-green-700";
    case "VOID":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

function money(value: number | string) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function AccountingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  async function loadTransactions() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (type !== "ALL") {
        params.set("type", type);
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/admin/accounting?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load transactions");
      }

      const data = await response.json();

      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load accounting transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [type, status]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return transactions;

    return transactions.filter((transaction) =>
      [
        transaction.transactionCode,
        transaction.category,
        transaction.description,
        transaction.paymentMode,
        transaction.referenceNumber,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [transactions, search]);

  const income = filteredTransactions
    .filter((item) => item.transactionType === "INCOME")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const expenses = filteredTransactions
    .filter((item) => item.transactionType === "EXPENSE")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const net = income - expenses;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
          Finance
        </p>

        <h1 className="text-3xl font-bold text-slate-900 mt-1">
          Accounting
        </h1>

        <p className="text-slate-500 mt-2">
          Track income, expenses and accounting transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Income</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {money(income)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Expenses</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {money(expenses)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Net</p>
          <p
            className={`text-3xl font-bold mt-2 ${
              net >= 0
                ? "text-blue-600"
                : "text-red-600"
            }`}
          >
            {money(net)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transaction, category, reference..."
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            {TYPE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL"
                  ? "All Transaction Types"
                  : item}
              </option>
            ))}
          </select>

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
            Loading accounting records...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No accounting transactions found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Transaction
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
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
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {transaction.transactionCode}
                      </p>

                      {transaction.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {transaction.description}
                        </p>
                      )}

                      {transaction.referenceNumber && (
                        <p className="text-xs text-slate-400 mt-1">
                          Ref: {transaction.referenceNumber}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeClass(
                          transaction.transactionType,
                        )}`}
                      >
                        {transaction.transactionType}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {transaction.category}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {money(transaction.amount)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {new Date(
                        transaction.transactionDate,
                      ).toLocaleDateString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          transaction.status || "DRAFT",
                        )}`}
                      >
                        {transaction.status || "DRAFT"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Showing {filteredTransactions.length} transactions.
      </p>
    </div>
  );
}