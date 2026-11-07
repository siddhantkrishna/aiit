"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/universities", label: "Universities" },
  { href: "/admission", label: "Admission" },
  { href: "/status", label: "Check Status" },
  { href: "/contact", label: "Contact" },
  { href: "/vacancies", label: "Vacancies" },
];

const onlineServiceLinks = [
  { href: "/student", label: "Student Portal" },
  { href: "/online-classes", label: "Online Classes" },
  { href: "/online-inquiry", label: "Online Inquiry" },
  { href: "/online-result", label: "Online Result" },
  { href: "/online-fee-payment", label: "My Fees & Payments" },
  { href: "/online-exams", label: "Online Exam" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/aiit-logo.png"
              alt="AIIT College"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-primary-dark leading-tight">
                AIIT College
              </p>
              <p className="text-[10px] text-muted leading-tight">
                Aryabhatta Institute of Information Technology
              </p>
            </div>
          </Link>

          <div className="hidden xl:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2 py-2 text-sm font-medium text-foreground hover:text-primary rounded-lg hover:bg-blue-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="relative group">
              <button type="button" className="px-2 py-2 text-sm font-medium text-foreground hover:text-primary rounded-lg hover:bg-blue-50 transition-colors">Online Services ▾</button>
              <div className="invisible absolute right-0 top-full mt-2 w-56 translate-y-1 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {onlineServiceLinks.map((link) => <Link key={link.href} href={link.href} prefetch={false} prefetch={false} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-primary">{link.label}</Link>)}
              </div>
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-2 border-l border-slate-200 pl-3">
              <Link
                href="/student"
                className="rounded-lg border border-primary px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Log In
              </Link>
            </div>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="xl:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-border bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium text-foreground hover:text-primary rounded-lg hover:bg-blue-50"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border pt-2 mt-2">
              <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted">Online Services</p>
              {onlineServiceLinks.map((link) => <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-blue-50 hover:text-primary" onClick={() => setOpen(false)}>{link.label}</Link>)}
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <Link
                href="/student"
                className="block rounded-lg border border-primary px-3 py-2.5 text-center text-sm font-semibold text-primary"
                onClick={() => setOpen(false)}
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
