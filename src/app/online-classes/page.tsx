"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useMemo, useState } from "react";

interface OnlineClass {
  id: number;
  title: string;
  description: string | null;
  instructor: string | null;
  scheduledAt: string;
  durationMinutes: number | null;
  meetingUrl: string | null;
  recordingUrl: string | null;
  status: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OnlineClassesPage() {
  const [classes, setClasses] = useState<OnlineClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const response = await fetch("/api/online-classes", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load classes.");
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load classes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const nextClass = useMemo(() => classes[0], [classes]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <section className="relative overflow-hidden bg-primary-dark text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-blue-900" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24 lg:px-8">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">AIIT Digital Campus</p>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Online Classes</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 md:text-lg">
                One place for your live lectures, class links, recordings, and upcoming sessions.
              </p>
            </div>
            {nextClass && (
              <div className="mt-10 max-w-2xl rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Next scheduled class</p>
                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{nextClass.title}</h2>
                    <p className="mt-1 text-sm text-blue-100">{formatDate(nextClass.scheduledAt)} · {nextClass.durationMinutes || 60} min</p>
                  </div>
                  {nextClass.meetingUrl && <a href={nextClass.meetingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex w-fit rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary-dark sm:mt-0">Join class →</a>}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
          {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse rounded-3xl bg-white shadow-sm" />)}
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-lg font-bold text-slate-900">No upcoming online classes</p>
              <p className="mt-2 text-sm text-slate-500">The academic team has not published the next session yet.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((item) => (
                <article key={item.id} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{item.status}</span>
                    <span className="text-xs text-slate-400">{item.durationMinutes || 60} min</span>
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm font-medium text-primary">{formatDate(item.scheduledAt)}</p>
                  <p className="mt-3 min-h-10 text-sm leading-6 text-slate-500">{item.description || "Live online session from AIIT College."}</p>
                  {item.instructor && <p className="mt-4 text-sm text-slate-600">Instructor: <span className="font-semibold">{item.instructor}</span></p>}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {item.meetingUrl && <a href={item.meetingUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">Join live class</a>}
                    {item.recordingUrl && <a href={item.recordingUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Watch recording</a>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
