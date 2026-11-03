"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

interface StatusResult {
  applicationId: string;
  applicationStatus: string;
  nextAction: string | null;
  course: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
}

const statusDisplay: Record<string, { icon: string; label: string; color: string }> = {
  pending: { icon: "🟡", label: "Pending Verification", color: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  approved: { icon: "🟢", label: "Approved", color: "bg-green-50 text-green-800 border-green-200" },
  rejected: { icon: "🔴", label: "Rejected", color: "bg-red-50 text-red-800 border-red-200" },
};

export default function StatusPage() {
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [results, setResults] = useState<StatusResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch("/api/applications/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: query, mobile, dob }) });
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
        setError(data.error || "No application found");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section className="bg-primary-dark text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Check Application Status
            </h1>
            <p className="text-lg text-blue-200">
              Enter your application number, registered mobile and date of birth. / आवेदन की स्थिति देखें।
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-border p-6">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Application number"
                  required
                  placeholder="Application number"
                  className="w-full px-4 py-3 border border-border rounded-lg text-sm mb-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <label className="block mb-3 text-sm">Registered mobile
                  <input required aria-label="Registered mobile" inputMode="numeric" pattern="[6-9][0-9]{9}" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full border rounded-lg p-3 mt-1" />
                </label>
                <label className="block mb-4 text-sm">Date of birth
                  <input required aria-label="Date of birth" type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full border rounded-lg p-3 mt-1" />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {loading ? "Searching..." : "Check Status"}
                </button>
              </form>
            </div>

            {searched && !loading && (
              <div className="mt-6">
                {error ? (
                  <div className="bg-white rounded-xl border border-border p-8 text-center">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-muted">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((r) => {
                      const s = statusDisplay[r.status] || statusDisplay.pending;
                      return (
                        <div
                          key={r.applicationId}
                          className="bg-white rounded-xl border border-border p-6"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted">
                              {r.applicationId}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${s.color}`}
                            >
                              {s.icon} {s.label}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-foreground">
                            {r.applicationStatus || s.label}
                          </h3>
                          {r.nextAction && <p className="mt-2 text-sm">Action required: {r.nextAction}</p>}
                          <p className="text-sm text-muted mt-1">
                            Course: {r.course}
                          </p>
                          <p className="text-sm text-muted mt-1">
                            Submitted:{" "}
                            {new Date(r.submittedAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
