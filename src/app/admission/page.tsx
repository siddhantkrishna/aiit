"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Course {
  id: number;
  name: string;
  fullName: string;
  studyMode: string;
  category: string;
  enabled: boolean;
  universityId: number | null;
}

interface University {
  id: number;
  name: string;
  shortName: string;
  enabled: boolean;
}

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
];

export default function AdmissionPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedFee, setSelectedFee] = useState<{ originalAmount: number; semesters: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState("");

  const [recoveryCode, setRecoveryCode] = useState("");
  const [warning, setWarning] = useState("");
  const [submissionKey] = useState(() => typeof window === "undefined" ? "" : (sessionStorage.getItem("aiit-admission-key") || (() => {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
    sessionStorage.setItem("aiit-admission-key", key); return key;
  })()));

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses(data.filter((c: Course) => c.enabled));
        }
      })
      .catch(() => {});

    fetch("/api/universities")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUniversities(data.filter((u: University) => u.enabled));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedUniversity || !selectedCourse) return;
    const controller = new AbortController();
    fetch(`/api/university-course-fees?universityId=${selectedUniversity}&courseId=${selectedCourse}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Fee quote unavailable");
        return response.json();
      })
      .then(data => setSelectedFee(data.available ? { originalAmount: data.originalAmount, semesters: data.semesters } : null))
      .catch(() => { if (!controller.signal.aborted) setSelectedFee(null); });
    return () => controller.abort();
  }, [selectedUniversity, selectedCourse]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("submissionKey", submissionKey);

    if (!formData.get("declaration")) {
      setError("Please accept the declaration to submit.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setApplicationId(data.applicationId);
        setSubmitted(true);
        setRecoveryCode(data.recoveryCode);
        setWarning(data.warning || "");
        sessionStorage.removeItem("aiit-admission-key");
        window.scrollTo(0, 0);
      } else {
        setError(
          data.error || "Failed to submit application. Please try again."
        );
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  }

  if (submitted) return <><Navbar /><main className="min-h-screen bg-slate-50 px-4 py-16"><div className="mx-auto max-w-2xl space-y-6 rounded-2xl border bg-white p-8">
    <h1 className="text-3xl font-bold text-slate-900">Application saved</h1>
    <p>Application ID: <strong>{applicationId}</strong></p>
    <p className="rounded-lg bg-amber-50 p-4 text-amber-900">Payment pending. Your application remains saved if checkout fails or closes.</p>
    <div><p className="mb-2 font-semibold">Save your private payment recovery code</p><code className="block break-all rounded-lg bg-slate-100 p-3 text-sm">{recoveryCode}</code><p className="mt-2 text-sm text-slate-600">Use this code with your Application ID to resume payment later. Keep it private.</p></div>
    {warning && <p role="alert" className="text-amber-800">{warning}</p>}
    <Link href="/online-fee-payment" className="inline-block rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white">Choose payment plan →</Link>
    <p className="text-sm text-slate-600">You can also return to My Fees &amp; Payments from the website menu.</p>
  </div></main><Footer /></>;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <section className="relative overflow-hidden bg-primary-dark text-white py-14 md:py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-blue-900 opacity-95" />
          <div className="absolute -top-28 -right-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Image
              src="/images/aiit-logo.png"
              alt="AIIT"
              width={64}
              height={64}
              className="rounded-full mx-auto mb-4 bg-white p-1"
            />

            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Online Admission Form
            </h1>

            <p className="text-blue-100 max-w-2xl mx-auto">
              Complete your application in one secure flow. Your application ID is generated instantly after submission.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 text-xs md:text-sm">
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">01 · Course</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">02 · Personal details</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">03 · Documents</span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">04 · Submit</span>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-4 gap-3">
                {[
                  ["01", "Course", "Choose your program"],
                  ["02", "Profile", "Personal information"],
                  ["03", "Education", "Academic history"],
                  ["04", "Documents", "Upload & submit"],
                ].map(([number, title, caption]) => (
                  <div key={number} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{number}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{title}</p>
                        <p className="text-xs text-slate-500">{caption}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Course Selection
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      University <span className="text-red-500">*</span>
                    </label>
                    <select name="universityId" required value={selectedUniversity}
                      onChange={e => { setSelectedUniversity(e.target.value); setSelectedCourse(""); setSelectedFee(null); }}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                      <option value="">Choose university first</option>
                      {universities.map(u => <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Select Course <span className="text-red-500">*</span>
                    </label>
                    <select name="courseId" required disabled={!selectedUniversity} value={selectedCourse}
                      onChange={e => { setSelectedCourse(e.target.value); setSelectedFee(null); }}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-60">
                      <option value="">{selectedUniversity ? "Choose course" : "Select university first"}</option>
                      {courses.filter(c => !c.universityId || c.universityId === Number(selectedUniversity)).map(c =>
                        <option key={c.id} value={c.id}>{c.name} — {c.fullName}</option>)}
                    </select>
                  </div>
                  {selectedCourse && <p aria-live="polite" className="col-span-full text-sm text-slate-600">
                    {selectedFee
                      ? `Approved fee for this university and course: ₹${(selectedFee.originalAmount / 100).toLocaleString("en-IN")} · ${selectedFee.semesters} installment(s). Full upfront payment is eligible for a 10% discount.`
                      : "The fee for this university and course has not yet been configured. Accounts must approve its amount before checkout."}
                  </p>}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Study Mode <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="studyMode"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="">Choose study mode</option>
                      <option value="Regular">Regular</option>
                      <option value="Distance">Distance</option>
                      <option value="Online">Online</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Personal Details
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="firstName"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Father&apos;s Name{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="fatherName"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter father's name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Mother&apos;s Name{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="motherName"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter mother's name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dob"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Mobile Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="mobile"
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Address
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      required
                      rows={2}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="city"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="state"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="">Select state</option>

                      {indianStates.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="pinCode"
                      required
                      pattern="[0-9]{6}"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="6-digit PIN code"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Education Details
                </h2>

                <h3 className="text-sm font-semibold text-primary mb-3">
                  10th (High School)
                </h3>

                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Board
                    </label>
                    <input
                      name="tenthBoard"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., CBSE, MP Board"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Year
                    </label>
                    <input
                      name="tenthYear"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., 2020"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Percentage
                    </label>
                    <input
                      name="tenthPercentage"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., 75%"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-primary mb-3">
                  12th (Intermediate)
                </h3>

                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Board
                    </label>
                    <input
                      name="twelfthBoard"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., CBSE, MP Board"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Year
                    </label>
                    <input
                      name="twelfthYear"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., 2022"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Percentage
                    </label>
                    <input
                      name="twelfthPercentage"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., 70%"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-primary mb-3">
                  Graduation (Optional)
                </h3>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      University
                    </label>
                    <input
                      name="gradUniversity"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="University name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Year
                    </label>
                    <input
                      name="gradYear"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Percentage
                    </label>
                    <input
                      name="gradPercentage"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., 65%"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Upload Documents
                </h2>

                <p className="text-sm text-muted mb-4">
                  Accepted formats: JPG, PNG, PDF. Max size: 5MB per file.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    ["photo", "Passport Photo", "image/*"],
                    ["aadhaar", "Aadhaar Card", "image/*,.pdf"],
                    ["tenthMarksheet", "10th Marksheet", "image/*,.pdf"],
                    ["twelfthMarksheet", "12th Marksheet", "image/*,.pdf"],
                    [
                      "gradMarksheet",
                      "Graduation Marksheet (Optional)",
                      "image/*,.pdf",
                    ],
                    ["otherDoc", "Other Document (Optional)", "image/*,.pdf"],
                  ].map(([name, label, accept]) => (
                    <div key={name}>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {label}
                      </label>

                      <input
                        type="file"
                        name={name}
                        accept={accept}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="declaration"
                    value="true"
                    className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />

                  <span className="text-sm text-muted leading-relaxed">
                    I hereby declare that all the information provided above is
                    true and correct to the best of my knowledge. I understand
                    that any false or misleading information may lead to
                    cancellation of my admission.
                  </span>
                </label>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-10 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg shadow-lg shadow-primary/20"
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}