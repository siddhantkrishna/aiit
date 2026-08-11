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
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState("");

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

    if (file.size > 5 * 1024 * 1024) {
      setError("Payment screenshot must be less than 5MB.");
      e.target.value = "";
      setPaymentScreenshot(null);
      setPaymentPreview("");
      return;
    }

    setPaymentScreenshot(file);
    setPaymentPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!paymentScreenshot) {
      setError(
        "Please upload your successful payment screenshot before submitting the application."
      );
      setLoading(false);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!formData.get("declaration")) {
      setError("Please accept the declaration to submit.");
      setLoading(false);
      return;
    }

    formData.set("paymentScreenshot", paymentScreenshot);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
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

  if (submitted) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-2xl border border-border p-8 md:p-12">
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

              <div className="bg-background rounded-xl border border-border p-6 mb-6">
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

              <p className="text-sm text-muted mb-6">
                Please save your Application ID. You can use it to check your
                application status.
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
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-primary-dark text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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

            <p className="text-blue-200">
              Fill in the details below to apply for admission at AIIT College
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="py-8 md:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Course Selection */}
              <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Course Selection
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Select Course{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="courseId"
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
                    <label className="block text-sm font-medium text-foreground mb-1">
                      University
                    </label>

                    <select
                      name="universityId"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="">
                        Select university (optional)
                      </option>

                      {universities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.shortName})
                        </option>
                      ))}
                    </select>
                  </div>

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

              {/* Personal Details */}
              <div className="bg-white rounded-xl border border-border p-6">
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

              {/* Address */}
              <div className="bg-white rounded-xl border border-border p-6">
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

              {/* Education Details */}
              <div className="bg-white rounded-xl border border-border p-6">
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
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="e.g., CBSE, MP Board"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Year
                    </label>

                    <input
                      name="tenthYear"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="e.g., 2020"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Percentage
                    </label>

                    <input
                      name="tenthPercentage"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="e.g., CBSE, MP Board"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Year
                    </label>

                    <input
                      name="twelfthYear"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="e.g., 2022"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Percentage
                    </label>

                    <input
                      name="twelfthPercentage"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="University name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Year
                    </label>

                    <input
                      name="gradYear"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="e.g., 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Percentage
                    </label>

                    <input
                      name="gradPercentage"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      placeholder="e.g., 65%"
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="bg-white rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Upload Documents
                </h2>

                <p className="text-sm text-muted mb-4">
                  Accepted formats: JPG, PNG, PDF. Max size: 5MB per file.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Passport Photo
                    </label>

                    <input
                      type="file"
                      name="photo"
                      accept="image/*"
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Aadhaar Card
                    </label>

                    <input
                      type="file"
                      name="aadhaar"
                      accept="image/*,.pdf"
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      10th Marksheet
                    </label>

                    <input
                      type="file"
                      name="tenthMarksheet"
                      accept="image/*,.pdf"
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      12th Marksheet
                    </label>

                    <input
                      type="file"
                      name="twelfthMarksheet"
                      accept="image/*,.pdf"
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Graduation Marksheet (Optional)
                    </label>

                    <input
                      type="file"
                      name="gradMarksheet"
                      accept="image/*,.pdf"
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Other Document (Optional)
                    </label>

                    <input
                      type="file"
                      name="otherDoc"
                      accept="image/*,.pdf"
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-xl border border-border p-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Complete Your Payment
                  </h2>

                  <p className="text-sm text-muted max-w-xl mx-auto mb-6">
                    Scan the QR code below using any UPI app and make your
                    payment. You may pay any amount you wish.
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
                        Upload a screenshot showing your successful
                        transaction. Your application cannot be submitted
                        without this screenshot.
                      </p>
                    </div>

                    <label className="block text-sm font-medium text-foreground mb-2">
                      Payment Screenshot{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="border-2 border-dashed border-border rounded-xl p-5">
                      <input
                        type="file"
                        name="paymentScreenshot"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        required
                        onChange={handlePaymentScreenshotChange}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                      />

                      <p className="text-xs text-muted mt-2">
                        JPG, PNG or WebP · Maximum 5MB
                      </p>

                      {paymentPreview && (
                        <div className="mt-5">
                          <p className="text-sm font-medium text-green-700 mb-3">
                            Payment screenshot uploaded
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
                    </div>

                    <p className="text-xs text-muted mt-3">
                      Payment verification is done manually using the uploaded
                      transaction screenshot.
                    </p>
                  </div>
                </div>
              </div>

              {/* Declaration */}
              <div className="bg-white rounded-xl border border-border p-6">
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

              {/* Submit */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading || !paymentScreenshot}
                  className="px-10 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
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