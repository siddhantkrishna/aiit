"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

interface StatusResult {
  applicationId: string;
  name: string;
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
  const [searchType, setSearchType] = useState<"applicationId" | "mobile">("applicationId");
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
      const param = searchType === "applicationId" ? `applicationId=${query}` : `mobile=${query}`;
      const res = await fetch(`/api/applications/status?${param}`);
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
              Enter your Application ID or Mobile Number to check your
              application status
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => { setSearchType("applicationId"); setQuery(""); setSearched(false); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    searchType === "applicationId"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-foreground"
                  }`}
                >
                  Application ID
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchType("mobile"); setQuery(""); setSearched(false); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    searchType === "mobile"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-foreground"
                  }`}
                >
                  Mobile Number
                </button>
              </div>

              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchType === "applicationId"
                      ? "e.g., AIIT-2025-123456"
                      : "e.g., 9876543210"
                  }
                  className="w-full px-4 py-3 border border-border rounded-lg text-sm mb-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
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
                            {r.name}
                          </h3>
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
