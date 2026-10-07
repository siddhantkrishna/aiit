"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

type Option = {
  id: number;
  name: string;
  fullName?: string;
  enabled: boolean;
};

export default function TamnarInquiryPage() {
  const [courses, setCourses] = useState<Option[]>([]);
  const [universities, setUniversities] = useState<Option[]>([]);
  const [submittedId, setSubmittedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/courses", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/universities", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([courseData, universityData]) => {
        setCourses(
          Array.isArray(courseData)
            ? courseData.filter((x: Option) => x.enabled)
            : []
        );

        setUniversities(
          Array.isArray(universityData)
            ? universityData.filter((x: Option) => x.enabled)
            : []
        );
      })
      .catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/online-inquiry", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          branch: "TAMNAR",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to submit inquiry. / पूछताछ भेजी नहीं जा सकी।"
        );
      }

      setSubmittedId(data.inquiryId);
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
        <section className="bg-primary-dark text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              AIIT College Tamnar / एआईआईटी कॉलेज तमनार
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
              Career Inquiry
              <span className="block text-blue-300">
                करियर पूछताछ
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-blue-100 md:text-lg">
              Fill in your details and our team can help you with courses,
              eligibility, admissions, universities, fees and career guidance.
              <br />
              <span className="mt-2 block">
                अपनी जानकारी भरें। हमारी टीम आपको पाठ्यक्रम, पात्रता, प्रवेश,
                विश्वविद्यालय, फीस और करियर मार्गदर्शन के बारे में जानकारी
                देगी।
              </span>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
          {submittedId ? (
            <div className="rounded-3xl border border-green-200 bg-white p-8 text-center shadow-sm md:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
                ✓
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-900">
                Inquiry Received / पूछताछ प्राप्त हुई
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
                Your Tamnar inquiry has been submitted successfully.
                <br />
                आपकी तमनार पूछताछ सफलतापूर्वक भेज दी गई है।
              </p>

              <p className="mt-4 text-sm text-slate-500">
                Inquiry Number / पूछताछ संख्या
              </p>

              <div className="mx-auto mt-2 max-w-xs rounded-2xl bg-slate-50 px-5 py-4 text-lg font-black text-primary">
                {submittedId}
              </div>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
                Our team will contact you using the details you provided.
                <br />
                हमारी टीम आपके दिए गए विवरण के माध्यम से आपसे संपर्क करेगी।
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSubmittedId("")}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
                >
                  Submit Another Inquiry / दूसरी पूछताछ भेजें
                </button>

                <Link
                  href="/tamnar"
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Back to Tamnar / तमनार पर वापस जाएं
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 md:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Tamnar Branch / तमनार शाखा
                </p>

                <h2 className="mt-3 text-2xl font-black text-slate-900">
                  Your Details / आपकी जानकारी
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Fill only the information needed for counselling.
                  <br />
                  केवल परामर्श के लिए आवश्यक जानकारी भरें।
                </p>
              </div>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name / पूरा नाम *
                </span>

                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Enter your full name / अपना पूरा नाम दर्ज करें"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Mobile Number / मोबाइल नंबर *
                </span>

                <input
                  name="mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="10-digit mobile number / 10 अंकों का मोबाइल नंबर"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  WhatsApp Number / व्हाट्सऐप नंबर
                </span>

                <input
                  name="whatsapp"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="WhatsApp number / व्हाट्सऐप नंबर"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address / ईमेल पता
                </span>

                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email / अपना ईमेल दर्ज करें"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Current Qualification / वर्तमान योग्यता
                </span>

                <input
                  name="qualification"
                  type="text"
                  placeholder="e.g. 12th, Graduate, BCA / जैसे 12वीं, स्नातक, BCA"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  City / District / शहर / जिला
                </span>

                <input
                  name="location"
                  type="text"
                  placeholder="e.g. Tamnar, Raigarh / जैसे तमनार, रायगढ़"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Interested Course / इच्छित पाठ्यक्रम
                </span>

                <select
                  name="interestedCourseId"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">
                    Not Sure Yet / अभी निश्चित नहीं है
                  </option>

                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                      {course.fullName ? ` — ${course.fullName}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Preferred University / पसंदीदा विश्वविद्यालय
                </span>

                <select
                  name="preferredUniversityId"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">
                    Not Sure Yet / अभी निश्चित नहीं है
                  </option>

                  {universities.map((university) => (
                    <option key={university.id} value={university.id}>
                      {university.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  What Would You Like Help With?
                  <span className="block text-xs font-medium text-slate-400">
                    आपको किस जानकारी की आवश्यकता है?
                  </span>
                </span>

                <textarea
                  name="message"
                  rows={5}
                  placeholder="Course, eligibility, admission, fee, career guidance… / पाठ्यक्रम, पात्रता, प्रवेश, फीस, करियर मार्गदर्शन…"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>

              {error && (
                <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs leading-5 text-slate-500">
                  By submitting this form, you agree that AIIT College may
                  contact you regarding your inquiry.
                  <br />
                  यह फॉर्म जमा करके, आप सहमत हैं कि AIIT College आपकी पूछताछ
                  के संबंध में आपसे संपर्क कर सकता है।
                </p>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-5 w-full rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Sending… / भेजा जा रहा है…"
                    : "Send Tamnar Inquiry → / तमनार पूछताछ भेजें →"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
