"use client";

import { useEffect, useState } from "react";

type DashboardStats = {
  leads: number;
  applications: number;
  students: number;
  activeStudents: number;
  collections: number;
  pendingFees: number;
  staff: number;
  openTasks: number;
  openServices: number;
};

const cards = [
  {
    key: "leads",
    label: "Total Leads",
    icon: "📈",
  },
  {
    key: "applications",
    label: "Applications",
    icon: "📋",
  },
  {
    key: "students",
    label: "Total Students",
    icon: "🎓",
  },
  {
    key: "activeStudents",
    label: "Active Students",
    icon: "✅",
  },
  {
    key: "collections",
    label: "Collections",
    icon: "₹",
  },
  {
    key: "pendingFees",
    label: "Pending Fees",
    icon: "⏳",
  },
  {
    key: "staff",
    label: "Active Staff",
    icon: "👥",
  },
  {
    key: "openTasks",
    label: "Open Tasks",
    icon: "📝",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }

      const data = await response.json();

      setStats({
        leads: Number(data.leads || 0),
        applications: Number(data.applications || 0),
        students: Number(data.students || 0),
        activeStudents: Number(data.activeStudents || 0),
        collections: Number(data.collections || 0),
        pendingFees: Number(data.pendingFees || 0),
        staff: Number(data.staff || 0),
        openTasks: Number(data.openTasks || 0),
        openServices: Number(data.openServices || 0),
      });
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mt-3" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white border border-border rounded-xl p-5"
            >
              <div className="h-5 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-5" />
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-600 font-medium">
          {error || "Dashboard data unavailable."}
        </p>

        <button
          onClick={loadDashboard}
          className="mt-4 px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-primary uppercase tracking-wider">
          Overview
        </p>

        <h2 className="text-3xl font-bold text-foreground mt-1">
          AIIT Management Dashboard
        </h2>

        <p className="text-muted mt-2">
          Live operational overview of admissions, students, finance and staff.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const rawValue =
            stats[card.key as keyof DashboardStats];

          const value =
            card.key === "collections" || card.key === "pendingFees"
              ? formatCurrency(Number(rawValue))
              : Number(rawValue).toLocaleString("en-IN");

          return (
            <div
              key={card.key}
              className="bg-white border border-border rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{card.icon}</span>

                <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
                  +
                </span>
              </div>

              <p className="text-2xl font-bold text-foreground mt-5">
                {value}
              </p>

              <p className="text-sm text-muted mt-1">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground">
            Operations
          </h3>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-sm text-muted">
                Open student services
              </span>

              <span className="font-bold text-foreground">
                {stats.openServices}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-sm text-muted">
                Open staff tasks
              </span>

              <span className="font-bold text-foreground">
                {stats.openTasks}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">
                Active staff
              </span>

              <span className="font-bold text-foreground">
                {stats.staff}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground">
            Student Health
          </h3>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-sm text-muted">
                Total students
              </span>

              <span className="font-bold text-foreground">
                {stats.students}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-sm text-muted">
                Active students
              </span>

              <span className="font-bold text-foreground">
                {stats.activeStudents}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">
                Pending fees
              </span>

              <span className="font-bold text-red-600">
                {formatCurrency(stats.pendingFees)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary-dark text-white rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-blue-200">
              AIIT System Status
            </p>

            <h3 className="text-xl font-bold mt-1">
              Core database systems connected
            </h3>
          </div>

          <span className="inline-flex items-center px-4 py-2 rounded-lg bg-white/10 text-sm font-semibold">
            ● Live
          </span>
        </div>
      </div>
    </div>
  );
}
