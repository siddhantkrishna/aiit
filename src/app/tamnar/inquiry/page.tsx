"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TamnarInquiryPage() {
  const [submittedId, setSubmittedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const name = String(form.get("name") || "").trim();
    const qualification = String(
      form.get("qualification") || "",
    ).trim();
    const address = String(
      form.get("location") || "",
    ).trim();
    const mobile = String(
      form.get("mobile") || "",
    )
      .replace(/\D/g, "")
      .slice(0, 10);
    const course = String(
      form.get("course") || "",
    ).trim();

    if (!name || !qualification || !address || !mobile || !course) {
      setError(
        "Please fill in all fields. / कृपया सभी जानकारी भरें।",
      );
      setSaving(false);
      return;
    }

    if (mobile.length !== 10) {
      setError(
        "Please enter a valid 10-digit mobile number. / कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।",
      );
      setSaving(false);
      return;
    }

    const payload = {
      name,
      qualification,
      location: address,
      mobile,
      branch: "TAMNAR",
      message: `Interested Course(s): ${course}`,
    };

    try {
      const response = await fetch(
        "/api/online-inquiry",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to submit inquiry. / पूछताछ भेजी नहीं जा सकी।",
        );
      }

      setSubmittedId(
        data.inquiryId || data.leadId || "",
      );

      e.currentTarget.reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit inquiry. / पूछताछ भेजी नहीं जा सकी।",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        {submittedId ? (
          <section className="mx-auto flex min-h-[75vh] max-w-2xl items-center px-4 py-12 md:px-6">
            <div className="w-full rounded-3xl border border-green-200 bg-white p-8 text-center shadow-sm md:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
                ✓
              </div>

              <h1 className="mt-6 text-2xl font-black text-slate-900">
                Inquiry Submitted
                <span className="mt-1 block text-lg text-slate-500">
                  पूछताछ सफलतापूर्वक भेजी गई
                </span>
              </h1>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500">
                Our Tamnar team will contact you soon.
                <br />
                हमारी तमनार टीम जल्द ही आपसे संपर्क करेगी।
              </p>

              {submittedId && (
                <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-slate-50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Inquiry Number / पूछताछ संख्या
                  </p>

                  <p className="mt-1 text-lg font-black text-primary">
                    {submittedId}
                  </p>
                </div>
              )}

              <Link
                href="/tamnar"
                className="mt-7 inline-flex rounded-xl bg-primary px-7 py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
              >
                Back to Tamnar / तमनार पर वापस जाएं
              </Link>
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-6 md:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  AIIT College — Tamnar
                </p>

                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                  Career Inquiry
                  <span className="mt-1 block text-base font-semibold text-slate-500 md:text-lg">
                    करियर पूछताछ
                  </span>
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Fill the details below and our team will contact you.
                  <br />
                  नीचे दी गई जानकारी भरें, हमारी टीम आपसे संपर्क करेगी।
                </p>
              </div>

              <form
                onSubmit={submit}
                className="space-y-5 px-6 py-6 md:px-8 md:py-8"
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Name / नाम *
                  </span>

                  <input
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Enter your name / अपना नाम दर्ज करें"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Qualification / योग्यता *
                  </span>

                  <input
                    name="qualification"
                    type="text"
                    required
                    placeholder="e.g. 10th, 12th, Graduate / जैसे 10वीं, 12वीं, स्नातक"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Address / पता *
                  </span>

                  <textarea
                    name="location"
                    required
                    rows={3}
                    placeholder="Enter your full address / अपना पूरा पता दर्ज करें"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Mobile Number / मोबाइल नंबर *
                  </span>

                  <input
                    name="mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    minLength={10}
                    required
                    autoComplete="tel"
                    placeholder="10-digit mobile number / 10 अंकों का मोबाइल नंबर"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Which course are you interested in? / आप किस पाठ्यक्रम में रुचि रखते हैं? *
                  </span>

                  <textarea
                    name="course"
                    required
                    rows={3}
                    placeholder="e.g. BCA, DCA, PGDCA / जैसे BCA, DCA, PGDCA"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    You can enter multiple courses separated by commas.
                    <br />
                    आप एक से अधिक पाठ्यक्रम कॉमा लगाकर लिख सकते हैं।
                  </p>
                </label>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-primary px-6 py-4 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Submitting… / भेजा जा रहा है…"
                    : "Submit Inquiry / पूछताछ भेजें →"}
                </button>

                <p className="text-center text-xs leading-5 text-slate-400">
                  AIIT College Tamnar will contact you regarding your inquiry.
                  <br />
                  AIIT College Tamnar आपकी पूछताछ के संबंध में आपसे संपर्क करेगा।
                </p>
              </form>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
