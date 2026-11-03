"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import Image from "next/image";

interface Course {
  id: number;
  name: string;
  fullName: string;
  studyMode: string;
  category: string;
  universityId: number | null;
  enabled: boolean;
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
  const [centres, setCentres] = useState<{id: number; name: string}[]>([]);
  const [qualification, setQualification] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState("");

  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState("");
  const [paymentUploading, setPaymentUploading] = useState(false);
  const [paymentUploaded, setPaymentUploaded] = useState(false);

  useEffect(() => {
    fetch("/api/centres").then(r => r.json()).then(d => { if (Array.isArray(d)) setCentres(d); }).catch(() => setError("Unable to load centres. Please retry."));
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses(data.filter((c: Course) => c.enabled));
          setSelectedCourse(new URLSearchParams(window.location.search).get("course") || "");
        } else { setError("Unable to load verified admission options. Please retry or contact AIIT."); }
      })
      .catch(() => setError("Unable to load admission options. Please retry."));

    fetch("/api/universities")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUniversities(data.filter((u: University) => u.enabled));
        } else { setError("Unable to load verified admission options. Please retry or contact AIIT."); }
      })
      .catch(() => setError("Unable to load admission options. Please retry."));
  }, []);

  useEffect(() => {
    return () => {
      if (paymentPreview) {
        URL.revokeObjectURL(paymentPreview);
      }
    };
  }, [paymentPreview]);

  function handlePaymentScreenshotChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setError("");

    const file = e.target.files?.[0];

    if (!file) {
      setPaymentScreenshot(null);
      setPaymentPreview("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Payment screenshot must be JPG, PNG, or WebP.");
      e.target.value = "";
      setPaymentScreenshot(null);
      setPaymentPreview("");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Payment screenshot must be less than 3MB.");
      e.target.value = "";
      setPaymentScreenshot(null);
      setPaymentPreview("");
      return;
    }

    setPaymentScreenshot(file);
    setPaymentPreview(URL.createObjectURL(file));
    setPaymentUploaded(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    if ([...formData.values()].reduce((sum, value) => sum + (value instanceof File ? value.size : 0), 0) > 4 * 1024 * 1024) {
      setError("Keep combined documents below 4MB. Compress scans before submitting."); setLoading(false); return;
    }
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

      if (res.ok && data.success) {
        setApplicationId(data.applicationId);
        setSubmitted(true);
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

  async function handlePaymentUpload() {
    if (!paymentScreenshot || !applicationId) {
      setError("Please select your successful payment screenshot.");
      return;
    }

    setPaymentUploading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("applicationId", applicationId);
      formData.append("paymentScreenshot", paymentScreenshot);

      const res = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPaymentUploaded(true);
        setError("");
      } else {
        setError(
          data.error ||
            "Failed to upload payment screenshot. Please try again."
        );
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setPaymentUploading(false);
  }

  if (submitted) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-background">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl border border-border p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✓</span>
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-2">
                Application Submitted Successfully!
              </h1>

              <p className="text-muted mb-6">
                Your admission application has been received and is being
                reviewed.
              </p>

              <div className="bg-background rounded-xl border border-border p-6 mb-8">
                <p className="text-sm text-muted mb-1">
                  Your Application ID
                </p>

                <p className="text-2xl font-bold text-primary">
                  {applicationId}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-sm font-medium text-yellow-800">
                    Pending Verification
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Complete Your Payment
                </h2>

                <p className="text-sm text-muted max-w-xl mx-auto mb-6">
                  Scan the QR code below using any UPI app and make your
                  payment. Confirm the registration amount with AIIT before paying.
                </p>

                <div className="flex justify-center mb-6">
                  <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                    <Image
                      src="/images/aiit-qr.jpeg"
                      alt="AIIT payment QR code"
                      width={320}
                      height={320}
                      className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] object-contain"
                    />
                  </div>
                </div>

                <div className="max-w-xl mx-auto text-left">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      After payment
                    </p>

                    <p className="text-sm text-blue-800">
                      Upload a screenshot showing your successful transaction.
                      Your payment will be manually verified by AIIT.
                    </p>
                  </div>

                  {paymentUploaded ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                      <div className="text-green-700 font-semibold mb-1">
                        Payment Screenshot Uploaded
                      </div>

                      <p className="text-sm text-green-700">
                        Your payment screenshot has been received and will be
                        manually verified.
                      </p>
                    </div>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Payment Screenshot{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <div className="border-2 border-dashed border-border rounded-xl p-5">
                        <input
                          aria-label="Payment screenshot"
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          onChange={handlePaymentScreenshotChange}
                          className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                        />

                        <p className="text-xs text-muted mt-2">
                          JPG, PNG or WebP · Maximum 3MB
                        </p>

                        {paymentPreview && (
                          <div className="mt-5">
                            <p className="text-sm font-medium text-green-700 mb-3">
                              Screenshot selected
                            </p>

                            <div className="border border-border rounded-xl p-3 bg-background">
                              <Image
                                src={paymentPreview}
                                alt="Payment screenshot preview"
                                width={600}
                                height={800}
                                className="max-h-[500px] w-auto max-w-full mx-auto rounded-lg object-contain"
                                unoptimized
                              />
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handlePaymentUpload}
                          disabled={paymentUploading || !paymentScreenshot}
                          className="w-full mt-5 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {paymentUploading
                            ? "Uploading..."
                            : "Upload Payment Screenshot"}
                        </button>
                      </div>

                      <p className="text-xs text-muted mt-3">
                        AIIT verifies payment against the bank or cash record. A screenshot alone does not confirm payment.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm text-muted mb-6">
                  Please save your Application ID. You can use it to check
                  your application status.
                </p>

                <div className="flex flex-wrap gap-3 justify-center">
                  <a
                    href="/status"
                    className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Check Status
                  </a>

                  <a
                    href="/"
                    className="px-6 py-2.5 border border-border text-foreground font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Home
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

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
                <label className="block mb-4 text-sm font-medium">Centre *
                  <select name="centreId" aria-label="Centre" required className="mt-1 w-full rounded-lg border p-3"><option value="">Choose centre</option>{centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                </label>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="courseId" className="block text-sm font-medium text-foreground mb-1">
                      Select Course <span className="text-red-500">*</span>
                    </label>

                    <select id="courseId"
                      name="courseId"
                      value={selectedCourse}
                      onChange={e => setSelectedCourse(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="">Choose a course</option>

                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="universityId" className="block text-sm font-medium text-foreground mb-1">
                      University
                    </label>

                    <select id="universityId"
                      name="universityId"
                      value={courses.find(c => String(c.id) === selectedCourse)?.universityId || ""}
                      onChange={() => {}}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="">
                        AIIT course / choose course first
                      </option>

                      {universities.filter(u => u.id === courses.find(c => String(c.id) === selectedCourse)?.universityId).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.shortName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="studyMode" className="block text-sm font-medium text-foreground mb-1">
                      Study Mode <span className="text-red-500">*</span>
                    </label>

                    <select id="studyMode"
                      name="studyMode"
                      value={courses.find(c => String(c.id) === selectedCourse)?.studyMode || ""}
                      onChange={() => {}}
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="">Choose study mode</option>
                      {courses.find(c => String(c.id) === selectedCourse)?.studyMode && <option>{courses.find(c => String(c.id) === selectedCourse)?.studyMode}</option>}
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
                    <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input id="firstName"
                      name="firstName"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">
                      Last Name
                    </label>
                    <input id="lastName"
                      name="lastName"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label htmlFor="fatherName" className="block text-sm font-medium text-foreground mb-1">
                      Father&apos;s Name{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input id="fatherName"
                      name="fatherName"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter father's name"
                    />
                  </div>

                  <div>
                    <label htmlFor="motherName" className="block text-sm font-medium text-foreground mb-1">
                      Mother&apos;s Name{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input id="motherName"
                      name="motherName"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter mother's name"
                    />
                  </div>

                  <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-foreground mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input id="dob"
                      type="date"
                      name="dob"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-foreground mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select id="gender"
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
                    <label htmlFor="mobile" className="block text-sm font-medium text-foreground mb-1">
                      Mobile Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input id="mobile"
                      name="mobile"
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                      Email
                    </label>
                    <input id="email"
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
                    <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea id="address"
                      name="address"
                      required
                      rows={2}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input id="city"
                      name="city"
                      required
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-foreground mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select id="state"
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
                    <label htmlFor="pinCode" className="block text-sm font-medium text-foreground mb-1">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input id="pinCode"
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
                <label className="block mb-5 text-sm font-medium">Highest qualification *
                  <select name="qualification" aria-label="Highest qualification" required value={qualification} onChange={e => setQualification(e.target.value)} className="mt-1 w-full border rounded-lg p-3"><option value="">Choose qualification</option>{["10th", "12th", "Diploma", "Graduate", "Postgraduate", "Other"].map(v => <option key={v}>{v}</option>)}</select>
                </label>

                <h3 className="text-sm font-semibold text-primary mb-3">
                  10th (High School)
                </h3>

                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label htmlFor="tenthBoard" className="block text-sm font-medium text-foreground mb-1">
                      Board
                    </label>
                    <input id="tenthBoard"
                      name="tenthBoard"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., CBSE, MP Board"
                    />
                  </div>

                  <div>
                    <label htmlFor="tenthYear" className="block text-sm font-medium text-foreground mb-1">
                      Year
                    </label>
                    <input id="tenthYear"
                      name="tenthYear"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., 2020"
                    />
                  </div>

                  <div>
                    <label htmlFor="tenthPercentage" className="block text-sm font-medium text-foreground mb-1">
                      Percentage
                    </label>
                    <input id="tenthPercentage"
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
                    <label htmlFor="twelfthBoard" className="block text-sm font-medium text-foreground mb-1">
                      Board
                    </label>
                    <input id="twelfthBoard"
                      name="twelfthBoard"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., CBSE, MP Board"
                    />
                  </div>

                  <div>
                    <label htmlFor="twelfthYear" className="block text-sm font-medium text-foreground mb-1">
                      Year
                    </label>
                    <input id="twelfthYear"
                      name="twelfthYear"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., 2022"
                    />
                  </div>

                  <div>
                    <label htmlFor="twelfthPercentage" className="block text-sm font-medium text-foreground mb-1">
                      Percentage
                    </label>
                    <input id="twelfthPercentage"
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
                    <label htmlFor="gradUniversity" className="block text-sm font-medium text-foreground mb-1">
                      University
                    </label>
                    <input id="gradUniversity"
                      name="gradUniversity"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="University name"
                    />
                  </div>

                  <div>
                    <label htmlFor="gradYear" className="block text-sm font-medium text-foreground mb-1">
                      Year
                    </label>
                    <input id="gradYear"
                      name="gradYear"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
                      placeholder="e.g., 2024"
                    />
                  </div>

                  <div>
                    <label htmlFor="gradPercentage" className="block text-sm font-medium text-foreground mb-1">
                      Percentage
                    </label>
                    <input id="gradPercentage"
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
                  Accepted formats: JPG, PNG, PDF. Max size: 3MB per file, 4MB combined.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    ["photo", "Passport Photo", "image/*"],
                    ["aadhaar", "Aadhaar Card", "image/*,.pdf"],
                    ["tenthMarksheet", "10th Marksheet", "image/*,.pdf"],
                    ["twelfthMarksheet", "12th Marksheet", "image/*,.pdf"],
                    [
                      "gradMarksheet",
                      "Graduation Marksheet (if applicable)",
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
                        aria-label={label}
                        required={["photo", "aadhaar", "tenthMarksheet"].includes(name) || name === "twelfthMarksheet" && ["12th", "Graduate", "Postgraduate"].includes(qualification) || name === "gradMarksheet" && ["Graduate", "Postgraduate"].includes(qualification)}
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