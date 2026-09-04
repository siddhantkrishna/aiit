"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Clock3,
  CheckCircle2,
  XCircle,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  today: number;
};

const cards = [
  {
    key: "total",
    label: "Total Applications",
    icon: FileText,
  },
  {
    key: "pending",
    label: "Pending",
    icon: Clock3,
  },
  {
    key: "approved",
    label: "Approved",
    icon: CheckCircle2,
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: XCircle,
  },
  {
    key: "today",
    label: "Today's Applications",
    icon: CalendarDays,
  },
] as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/stats", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics");
      }

      const data = await response.json();

      setStats({
        total: Number(data.total || 0),
        pending: Number(data.pending || 0),
        approved: Number(data.approved || 0),
        rejected: Number(data.rejected || 0),
        today: Number(data.today || 0),
      });
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Administration
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            AIIT Dashboard
          </h1>

          <p className="text-slate-500 mt-2">
            Admissions and operational overview.
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {cards.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={21} />
              </div>

              <span className="text-xs font-medium text-slate-400">
                LIVE
              </span>
            </div>

            <div className="mt-6">
              <p className="text-3xl font-bold text-slate-900">
                {loading
                  ? "—"
                  : stats?.[key] !== undefined
                    ? stats[key].toLocaleString("en-IN")
                    : "0"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Application Pipeline
          </h2>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Pending</span>
              <span className="font-semibold text-amber-600">
                {loading ? "—" : stats?.pending ?? 0}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{
                  width:
                    !stats || stats.total === 0
                      ? "0%"
                      : `${Math.min(
                          (stats.pending / stats.total) * 100,
                          100,
                        )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Approved</span>
              <span className="font-semibold text-emerald-600">
                {loading ? "—" : stats?.approved ?? 0}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width:
                    !stats || stats.total === 0
                      ? "0%"
                      : `${Math.min(
                          (stats.approved / stats.total) * 100,
                          100,
                        )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Rejected</span>
              <span className="font-semibold text-red-600">
                {loading ? "—" : stats?.rejected ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Today
          </h2>

          <div className="mt-6 rounded-xl bg-slate-50 p-6">
            <p className="text-sm text-slate-500">
              Applications received today
            </p>

            <p className="mt-2 text-4xl font-bold text-blue-600">
              {loading ? "—" : stats?.today ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}