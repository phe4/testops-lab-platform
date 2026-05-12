import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../api/client";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import type { TestJob } from "../types";
import { formatDate, getErrorMessage } from "../utils/format";

export default function JobsPage() {
  const [jobs, setJobs] = useState<TestJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient
      .get<{ items: TestJob[] }>("/test-jobs")
      .then((response) => setJobs(response.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Test Jobs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scheduled and executed diagnostics across the request workflow.
        </p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState message="No test jobs have been scheduled yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Request</th>
                <th className="px-4 py-3 font-medium">Test Suite</th>
                <th className="px-4 py-3 font-medium">Lab Station</th>
                <th className="px-4 py-3 font-medium">Operator</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Finished</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
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
                  <td className="px-4 py-3">{job.labStation || "-"}</td>
                  <td className="px-4 py-3">{job.operatorName || "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3">{formatDate(job.startedAt)}</td>
                  <td className="px-4 py-3">{formatDate(job.finishedAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="font-medium text-blue-700 hover:text-blue-900"
                    >
                      View Job
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
