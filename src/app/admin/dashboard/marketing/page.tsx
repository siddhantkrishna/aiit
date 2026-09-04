"use client";

import { useEffect, useMemo, useState } from "react";

type Campaign = {
  id: number;
  campaignCode: string;
  campaignName: string;
  campaignType: string | null;
  centreId: number | null;
  objective: string | null;
  targetAudience: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | string | null;
  status: string;
  leadsGenerated: number | null;
  applicationsGenerated: number | null;
  admissionsGenerated: number | null;
  revenueGenerated: number | string | null;
  notes: string | null;
};

const STATUS_OPTIONS = [
  "ALL",
  "PLANNED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

function statusClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "COMPLETED":
      return "bg-blue-100 text-blue-700";
    case "PAUSED":
      return "bg-yellow-100 text-yellow-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function money(value: number | string | null) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  async function loadCampaigns() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      const response = await fetch(
        `/api/admin/marketing?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load campaigns");
      }

      const data = await response.json();

      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load marketing campaigns.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, [status]);

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return campaigns;
    }

    return campaigns.filter((campaign) =>
      [
        campaign.campaignCode,
        campaign.campaignName,
        campaign.campaignType,
        campaign.objective,
        campaign.targetAudience,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [campaigns, search]);

  const totalBudget = filteredCampaigns.reduce(
    (sum, campaign) => sum + Number(campaign.budget || 0),
    0,
  );

  const totalLeads = filteredCampaigns.reduce(
    (sum, campaign) => sum + Number(campaign.leadsGenerated || 0),
    0,
  );

  const totalAdmissions = filteredCampaigns.reduce(
    (sum, campaign) =>
      sum + Number(campaign.admissionsGenerated || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Growth
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Marketing
          </h1>

          <p className="text-slate-500 mt-2">
            Manage campaigns and measure admissions performance.
          </p>
        </div>

        <button
          onClick={loadCampaigns}
          className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Campaigns
          </p>

          <p className="text-3xl font-bold text-slate-900 mt-2">
            {filteredCampaigns.length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Leads Generated
          </p>

          <p className="text-3xl font-bold text-blue-600 mt-2">
            {totalLeads.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Admissions Generated
          </p>

          <p className="text-3xl font-bold text-green-600 mt-2">
            {totalAdmissions.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaign..."
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === "ALL"
                  ? "All Statuses"
                  : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading campaigns...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-800">
              No campaigns found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Campaign
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Budget
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Leads
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Applications
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Admissions
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {campaign.campaignName}
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        {campaign.campaignCode}
                      </p>

                      {campaign.campaignType && (
                        <p className="text-xs text-slate-500 mt-1">
                          {campaign.campaignType}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {money(campaign.budget)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {campaign.leadsGenerated ?? 0}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {campaign.applicationsGenerated ?? 0}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-green-600">
                      {campaign.admissionsGenerated ?? 0}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          campaign.status,
                        )}`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500">
        Total campaign budget: {money(totalBudget)}
      </div>
    </div>
  );
}