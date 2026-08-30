"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const sidebarLinks = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: "📊",
  },
  {
    href: "/admin/dashboard/applications",
    label: "Applications",
    icon: "📋",
  },
  {
    href: "/admin/dashboard/vacancies",
    label: "Vacancies",
    icon: "💼",
  },
  {
    href: "/admin/dashboard/vacancy-applications",
    label: "Recruitment",
    icon: "👥",
  },
  {
    href: "/admin/dashboard/courses",
    label: "Courses",
    icon: "📚",
  },
  {
    href: "/admin/dashboard/universities",
    label: "Universities",
    icon: "🏛️",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function verifyAdmin() {
      try {
        const response = await fetch("/api/admin/verify", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (mounted) {
            router.replace("/admin/login");
          }
          return;
        }

        const data = await response.json();

        if (!mounted) return;

        if (data.authenticated === true) {
          setVerified(true);
        } else {
          router.replace("/admin/login");
        }
      } catch {
        if (mounted) {
          router.replace("/admin/login");
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    verifyAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  if (checkingAuth || !verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  const currentPage =
    sidebarLinks.find((link) => {
      if (link.href === "/admin/dashboard") {
        return pathname === link.href;
      }

      return pathname.startsWith(link.href);
    })?.label || "Admin";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:static lg:inset-auto`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Image
                src="/images/aiit-logo.png"
                alt="AIIT"
                width={36}
                height={36}
                className="rounded-full"
              />

              <div>
                <p className="text-sm font-bold text-primary-dark">
                  AIIT Admin
                </p>

                <p className="text-[10px] text-muted">
                  Dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const active =
                link.href === "/admin/dashboard"
                  ? pathname === link.href
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-blue-50 hover:text-primary"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left font-medium"
            >
              Logout
            </button>

            <Link
              href="/"
              className="block mt-1 px-3 py-2 text-sm text-muted hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              View Website
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-border px-4 py-3 flex items-center gap-4 lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-foreground">
            {currentPage}
          </h1>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}