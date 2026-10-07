"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Course = {
  id: number;
  name: string;
  fullName?: string;
  enabled: boolean;
};

export default function TamnarInquiryPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [submittedId, setSubmittedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/courses", {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses(
            data.filter((course: Course) => course.enabled)
          );
        }
      })
      .catch(() => {
        setCourses([]);
      });
  }, []);

  function toggleCourse(courseId: number) {
    setSelectedCourses((current) =>
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId]
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (selectedCourses.length === 0) {
      setError(
        "Please select at least one course. / कृपया कम से कम एक पाठ्यक्रम चुनें।"
      );
      return;
    }

    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);

    const selectedCourseNames = selectedCourses
      .map((id) => courses.find((course) => course.id === id))
      .filter(Boolean)
      .map((course) =>
        course?.fullName
          ? `${course.name} — ${course.fullName}`
          : course?.name || ""
      )
      .filter(Boolean);

    const payload = {
      name: form.get("name"),
      qualification: form.get("qualification"),
      location: form.get("location"),
      mobile: form.get("mobile"),
      branch: "TAMNAR",
      interestedCourseId: selectedCourses[0],
      message: `Interested Courses: ${selectedCourseNames.join(", ")}`,
    };

    try {
      const response = await fetch("/api/online-inquiry", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to submit inquiry. / पूछताछ भेजी नहीं जा सकी।"
        );
      }

      setSubmittedId(data.inquiryId || data.leadId || "");
      setSelectedCourses([]);
      e.currentTarget.reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit inquiry. / पूछताछ भेजी नहीं जा सकी।"
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
                <span className="block mt-1 text-lg text-slate-500">
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
                  <span className="block text-base font-semibold text-slate-500 md:text-lg">
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
                    placeholder="Enter your address / अपना पता दर्ज करें"
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

                <div>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-700">
                      Which course are you interested in?
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      आप किस पाठ्यक्रम में रुचि रखते हैं?
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      You can select multiple courses.
                      <br />
                      आप एक से अधिक पाठ्यक्रम चुन सकते हैं।
                    </p>
                  </div>

                  <div className="space-y-3">
                    {courses.length > 0 ? (
                      courses.map((course) => {
                        const selected = selectedCourses.includes(course.id);

                        return (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => toggleCourse(course.id)}
                            className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                              selected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-black ${
                                selected
                                  ? "border-primary bg-primary text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              ✓
                            </span>

                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-slate-900">
                                {course.name}
                              </span>

                              {course.fullName && (
                                <span className="mt-1 block text-xs leading-5 text-slate-500">
                                  {course.fullName}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Course list is currently unavailable.
                        <br />
                        पाठ्यक्रम सूची अभी उपलब्ध नहीं है।
                      </div>
                    )}
                  </div>
                </div>

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
