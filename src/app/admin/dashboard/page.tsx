\"use client\";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  today: number;
}

const cards = [
  { key: "total" as const, label: "Total Applications", tone: "border-blue-100 bg-blue-50 text-blue-800", icon: "▣" },
  { key: "pending" as const, label: "Pending Review", tone: "border-amber-100 bg-amber-50 text-amber-800", icon: "◷" },
  { key: "approved" as const, label: "Approved", tone: "border-emerald-100 bg-emerald-50 text-emerald-800", icon: "✓" },
  { key: "rejected" as const, label: "Rejected", tone: "border-rose-100 bg-rose-50 text-rose-800", icon: "×" },
  { key: "today" as const, label: "Today's Applications", tone: "border-violet-100 bg-violet-50 text-violet-800", icon: "◫" },
];

const quickActions = [
  { href: "/admin/dashboard/applications", label: "View Applications", description: "Review and manage admission applications.", icon: "▣" },
  { href: "/admin/dashboard/courses", label: "Manage Courses", description: "Update course offerings and availability.", icon: "◈" },
  { href: "/admin/dashboard/universities", label: "Manage Universities", description: "Maintain partner university information.", icon: "⌂" },
  { href: "/admin/dashboard/vacancies", label: "Manage Vacancies", description: "Keep current roles and openings up to date.", icon: "◌" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    today: 0,
  });
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl bg-white border border-border animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-32 rounded-xl bg-white border border-border animate-pulse" />
          ))}
        </div>
        <div className="h-56 rounded-2xl bg-white border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-primary-dark text-white p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-light">
          AIIT College Administration
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mt-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome back, Admin</h1>
            <p className="text-sm md:text-base text-blue-200 mt-2 max-w-2xl">
              Monitor admissions, manage academic content, and keep recruitment operations moving from one place.
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-primary-dark hover:bg-blue-50 transition-colors"
          >
            View Website →
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Overview</p>
          <h2 className="text-xl font-bold text-foreground mt-1">Application snapshot</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {cards.map((card) => (
            <div key={card.key} className={`rounded-xl border p-5 ${card.tone}`}>
              <div className="flex items-center justify-between">
                <span className="h-10 w-10 rounded-lg bg-white/80 flex items-center justify-center text-lg font-bold">
                  {card.icon}
                </span>
                <span className="text-xs font-medium opacity-70">AIIT</span>
              </div>
              <p className="text-3xl font-bold mt-5">{stats[card.key]}</p>
              <p className="text-sm mt-1 opacity-80">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Workspace</p>
            <h2 className="text-xl font-bold text-foreground mt-1">Quick actions</h2>
          </div>
          <p className="text-sm text-muted">Jump straight into the area you need.</p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-xl border border-border p-5 hover:border-primary/40 hover:bg-blue-50/40 transition-colors"
            >
              <div className="h-11 w-11 rounded-lg bg-blue-50 text-primary flex items-center justify-center text-lg font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                {action.icon}
              </div>
              <h3 className="font-semibold text-foreground mt-4">{action.label}</h3>
              <p className="text-sm text-muted leading-relaxed mt-1">{action.description}</p>
              <span className="inline-flex mt-4 text-sm font-semibold text-primary">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Recruitment</p>
            <h2 className="text-lg font-bold text-foreground mt-1">Keep hiring workflows organized</h2>
            <p className="text-sm text-muted mt-1">
              Manage open roles and review incoming candidates from the recruitment workspace.
            </p>
          </div>
          <Link
            href="/admin/dashboard/vacancy-applications"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Review Candidates →
          </Link>
        </div>
      </section>
    </div>
  );
}
