"use client";

import { useEffect, useState } from "react";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  today: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Applications", value: stats.total, color: "bg-blue-50 text-blue-700 border-blue-200", icon: "📋" },
    { label: "Pending", value: stats.pending, color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: "🟡" },
    { label: "Approved", value: stats.approved, color: "bg-green-50 text-green-700 border-green-200", icon: "🟢" },
    { label: "Rejected", value: stats.rejected, color: "bg-red-50 text-red-700 border-red-200", icon: "🔴" },
    { label: "Today's Applications", value: stats.today, color: "bg-purple-50 text-purple-700 border-purple-200", icon: "📅" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-5 ${card.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm mt-1 opacity-80">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/admin/dashboard/applications"
            className="p-4 rounded-lg border border-border hover:bg-blue-50 hover:border-primary transition-colors text-center"
          >
            <span className="text-2xl">📋</span>
            <p className="text-sm font-medium mt-2">View Applications</p>
          </a>
          <a
            href="/admin/dashboard/courses"
            className="p-4 rounded-lg border border-border hover:bg-blue-50 hover:border-primary transition-colors text-center"
          >
            <span className="text-2xl">📚</span>
            <p className="text-sm font-medium mt-2">Manage Courses</p>
          </a>
          <a
            href="/admin/dashboard/universities"
            className="p-4 rounded-lg border border-border hover:bg-blue-50 hover:border-primary transition-colors text-center"
          >
            <span className="text-2xl">🏛️</span>
            <p className="text-sm font-medium mt-2">Manage Universities</p>
          </a>
          <a
            href="/"
            target="_blank"
            className="p-4 rounded-lg border border-border hover:bg-blue-50 hover:border-primary transition-colors text-center"
          >
            <span className="text-2xl">🌐</span>
            <p className="text-sm font-medium mt-2">View Website</p>
          </a>
        </div>
      </div>
    </div>
  );
}
