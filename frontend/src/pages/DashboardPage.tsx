import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../api/client";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import type { DashboardSummary, TestJob, TestRequest } from "../types";
import { formatDate, getErrorMessage } from "../utils/format";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [requests, setRequests] = useState<TestRequest[]>([]);
  const [recentFailures, setRecentFailures] = useState<TestJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiClient.get<DashboardSummary>("/dashboard/summary"),
      apiClient.get<{ items: TestJob[] }>("/dashboard/recent-failures"),
      apiClient.get<{ items: TestRequest[] }>("/test-requests"),
    ])
      .then(([summaryResponse, failuresResponse, requestsResponse]) => {
        setSummary(summaryResponse.data);
        setRecentFailures(failuresResponse.data.items);
        setRequests(requestsResponse.data.items);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  const recentRequests = requests.slice(0, 6);
  const requestStats = summary
    ? [
        { label: "Total Requests", value: summary.totalRequests },
        { label: "Submitted", value: summary.submittedRequests },
        { label: "Approved", value: summary.approvedRequests },
        { label: "Scheduled", value: summary.scheduledRequests },
        { label: "Completed", value: summary.completedRequests },
      ]
    : [];
  const jobStats = summary
    ? [
        { label: "Total Jobs", value: summary.totalJobs },
        { label: "Pending", value: summary.pendingJobs },
        { label: "Running", value: summary.runningJobs },
        { label: "Passed", value: summary.passedJobs },
        { label: "Failed", value: summary.failedJobs },
        { label: "Pass Rate", value: `${summary.passRate}%` },
        {
          label: "Avg Duration",
          value: `${summary.averageDurationSeconds}s`,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Current validation intake and diagnostic workflow status.
          </p>
        </div>
        <Link
          to="/requests/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Create Request
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Request metrics
            </h2>
            <div className="grid gap-4 md:grid-cols-5">
              {requestStats.map((stat) => (
                <MetricCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Job metrics
            </h2>
            <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
              {jobStats.map((stat) => (
                <MetricCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="font-semibold text-slate-950">
                Recent failed jobs
              </h2>
            </div>
            {recentFailures.length === 0 ? (
              <div className="p-4">
                <EmptyState message="No recent failed jobs." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Job ID</th>
                      <th className="px-4 py-3 font-medium">Request</th>
                      <th className="px-4 py-3 font-medium">Test Suite</th>
                      <th className="px-4 py-3 font-medium">Error Code</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 font-medium">Finished</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentFailures.map((job) => (
                      <tr key={job.id}>
                        <td className="px-4 py-3">{job.id}</td>
                        <td className="px-4 py-3">
                          {job.request ? (
                            <Link
                              to={`/requests/${job.request.id}`}
                              className="font-medium text-slate-950 hover:text-blue-700"
                            >
                              #{job.request.id} {job.request.title}
                            </Link>
                          ) : (
                            `#${job.requestId}`
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {job.testSuite?.name || `#${job.testSuiteId}`}
                        </td>
                        <td className="px-4 py-3">
                          {job.result?.errorCode || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {job.durationSeconds === null
                            ? "-"
                            : `${job.durationSeconds}s`}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(job.finishedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="font-medium text-blue-700 hover:text-blue-900"
                            >
                              View Job
                            </Link>
                            {job.requestId ? (
                              <Link
                                to={`/reports/${job.requestId}`}
                                className="font-medium text-blue-700 hover:text-blue-900"
                              >
                                View Report
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="font-semibold text-slate-950">Recent requests</h2>
            </div>
            {recentRequests.length === 0 ? (
              <div className="p-4">
                <EmptyState message="No validation requests yet." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Component</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-4 py-3">{request.id}</td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/requests/${request.id}`}
                            className="font-medium text-slate-950 hover:text-blue-700"
                          >
                            {request.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{request.componentName}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(request.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
