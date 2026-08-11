"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface AppDetail {
  application: {
    id: number;
    applicationId: string;
    courseId: number;
    universityId: number | null;
    studyMode: string;
    firstName: string;
    lastName: string;
    fatherName: string;
    motherName: string;
    dob: string;
    gender: string;
    mobile: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    tenthBoard: string;
    tenthYear: string;
    tenthPercentage: string;
    twelfthBoard: string;
    twelfthYear: string;
    twelfthPercentage: string;
    gradUniversity: string;
    gradYear: string;
    gradPercentage: string;
    paymentScreenshotPath: string | null;
    paymentScreenshotUploadedAt: string | null;
    status: string;
    declaration: boolean;
    createdAt: string;
    updatedAt: string;
  };
  documents: Array<{
    id: number;
    docType: string;
    fileName: string;
    filePath: string;
    fileSize: number | null;
  }>;
}

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const docLabels: Record<string, string> = {
  photo: "Passport Photo",
  aadhaar: "Aadhaar Card",
  tenthMarksheet: "10th Marksheet",
  twelfthMarksheet: "12th Marksheet",
  gradMarksheet: "Graduation Marksheet",
  otherDoc: "Other Document",
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [data, setData] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const appId = params.id as string;

  async function loadApplication() {
    try {
      const response = await fetch(`/api/applications/${appId}`);

      if (!response.ok) {
        setData(null);
        return;
      }

      const result = await response.json();

      if (result.application) {
        setData(result);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Failed to load application:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplication();
  }, [appId]);

  async function updateStatus(status: string) {
    if (
      !confirm(
        `Are you sure you want to ${status} this application?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/applications/${appId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        alert("Failed to update application status.");
        return;
      }

      await loadApplication();
    } catch {
      alert("Failed to update application status.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Application not found</p>

        <button
          onClick={() => router.back()}
          className="mt-4 text-primary hover:underline text-sm"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  const app = data.application;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted hover:text-primary mb-2 inline-block"
          >
            ← Back to Applications
          </button>

          <h1 className="text-2xl font-bold text-foreground">
            {app.applicationId}
          </h1>

          <p className="text-muted text-sm">
            Submitted on{" "}
            {new Date(app.createdAt).toLocaleDateString(
              "en-IN",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}
          </p>
        </div>

        <div className="flex gap-2">
          {app.status !== "approved" && (
            <button
              onClick={() => updateStatus("approved")}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
            >
              ✓ Approve
            </button>
          )}

          {app.status !== "rejected" && (
            <button
              onClick={() => updateStatus("rejected")}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
            >
              ✕ Reject
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <span
          className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium border ${
            statusBadge[app.status] ||
            statusBadge.pending
          }`}
        >
          Status:{" "}
          {app.status.charAt(0).toUpperCase() +
            app.status.slice(1)}
        </span>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl border border-border p-6 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Payment Verification
            </h2>

            <p className="text-sm text-muted mt-1">
              Review the payment screenshot submitted by the applicant.
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              app.paymentScreenshotPath
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}
          >
            {app.paymentScreenshotPath
              ? "Payment Screenshot Uploaded"
              : "Payment Pending"}
          </span>
        </div>

        {app.paymentScreenshotPath ? (
          <div className="border border-border rounded-xl p-5">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-lg">
                <Image
                  src={app.paymentScreenshotPath}
                  alt="Payment screenshot"
                  width={600}
                  height={900}
                  className="w-full h-auto max-h-[700px] object-contain rounded-lg border border-border"
                  unoptimized
                />
              </div>

              {app.paymentScreenshotUploadedAt && (
                <p className="text-xs text-muted mt-4">
                  Uploaded on{" "}
                  {new Date(
                    app.paymentScreenshotUploadedAt
                  ).toLocaleString("en-IN")}
                </p>
              )}

              <a
                href={app.paymentScreenshotPath}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-primary hover:bg-gray-50"
              >
                View Full Screenshot
              </a>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-yellow-300 bg-yellow-50 rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-yellow-800">
              Payment screenshot has not been uploaded yet.
            </p>

            <p className="text-xs text-yellow-700 mt-1">
              The applicant can upload it from the payment section after
              submitting the application.
            </p>
          </div>
        )}
      </div>

      {/* Personal Details */}
      <div className="bg-white rounded-xl border border-border p-6 mb-4">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Personal Details
        </h2>

        <div className="grid sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
          <div>
            <span className="text-muted">Name:</span>{" "}
            <span className="font-medium ml-1">
              {app.firstName} {app.lastName}
            </span>
          </div>

          <div>
            <span className="text-muted">
              Father&apos;s Name:
            </span>{" "}
            <span className="font-medium ml-1">
              {app.fatherName}
            </span>
          </div>

          <div>
            <span className="text-muted">
              Mother&apos;s Name:
            </span>{" "}
            <span className="font-medium ml-1">
              {app.motherName}
            </span>
          </div>

          <div>
            <span className="text-muted">
              Date of Birth:
            </span>{" "}
            <span className="font-medium ml-1">
              {app.dob}
            </span>
          </div>

          <div>
            <span className="text-muted">Gender:</span>{" "}
            <span className="font-medium ml-1">
              {app.gender}
            </span>
          </div>

          <div>
            <span className="text-muted">Mobile:</span>{" "}
            <span className="font-medium ml-1">
              {app.mobile}
            </span>
          </div>

          <div>
            <span className="text-muted">Email:</span>{" "}
            <span className="font-medium ml-1">
              {app.email || "N/A"}
            </span>
          </div>

          <div>
            <span className="text-muted">
              Study Mode:
            </span>{" "}
            <span className="font-medium ml-1">
              {app.studyMode || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border border-border p-6 mb-4">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Address
        </h2>

        <div className="grid sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
          <div className="sm:col-span-2">
            <span className="text-muted">Address:</span>{" "}
            <span className="font-medium ml-1">
              {app.address}
            </span>
          </div>

          <div>
            <span className="text-muted">City:</span>{" "}
            <span className="font-medium ml-1">
              {app.city}
            </span>
          </div>

          <div>
            <span className="text-muted">State:</span>{" "}
            <span className="font-medium ml-1">
              {app.state}
            </span>
          </div>

          <div>
            <span className="text-muted">PIN Code:</span>{" "}
            <span className="font-medium ml-1">
              {app.pinCode}
            </span>
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="bg-white rounded-xl border border-border p-6 mb-4">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Education Details
        </h2>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-primary mb-1">
              10th (High School)
            </h3>

            <div className="grid sm:grid-cols-3 gap-2">
              <div>
                <span className="text-muted">Board:</span>{" "}
                <span className="font-medium ml-1">
                  {app.tenthBoard || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-muted">Year:</span>{" "}
                <span className="font-medium ml-1">
                  {app.tenthYear || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-muted">
                  Percentage:
                </span>{" "}
                <span className="font-medium ml-1">
                  {app.tenthPercentage || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-primary mb-1">
              12th (Intermediate)
            </h3>

            <div className="grid sm:grid-cols-3 gap-2">
              <div>
                <span className="text-muted">Board:</span>{" "}
                <span className="font-medium ml-1">
                  {app.twelfthBoard || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-muted">Year:</span>{" "}
                <span className="font-medium ml-1">
                  {app.twelfthYear || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-muted">
                  Percentage:
                </span>{" "}
                <span className="font-medium ml-1">
                  {app.twelfthPercentage || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {(app.gradUniversity ||
            app.gradYear ||
            app.gradPercentage) && (
            <div>
              <h3 className="font-semibold text-primary mb-1">
                Graduation
              </h3>

              <div className="grid sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-muted">
                    University:
                  </span>{" "}
                  <span className="font-medium ml-1">
                    {app.gradUniversity || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-muted">Year:</span>{" "}
                  <span className="font-medium ml-1">
                    {app.gradYear || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-muted">
                    Percentage:
                  </span>{" "}
                  <span className="font-medium ml-1">
                    {app.gradPercentage || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border border-border p-6 mb-4">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Uploaded Documents
        </h2>

        {data.documents.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-sm text-muted">
              No documents uploaded.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.documents.map((doc) => {
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                doc.filePath
              );

              return (
                <div
                  key={doc.id}
                  className="border border-border rounded-lg p-3"
                >
                  <p className="text-xs font-medium text-muted mb-2">
                    {docLabels[doc.docType] ||
                      doc.docType}
                  </p>

                  {isImage ? (
                    <Image
                      src={doc.filePath}
                      alt={doc.docType}
                      width={200}
                      height={150}
                      className="rounded-lg object-cover w-full h-32"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                      <span className="text-3xl">PDF</span>
                    </div>
                  )}

                  <p className="text-xs text-muted mt-2 truncate">
                    {doc.fileName}
                  </p>

                  <a
                    href={doc.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 text-xs text-primary hover:underline text-center"
                  >
                    View / Download
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}