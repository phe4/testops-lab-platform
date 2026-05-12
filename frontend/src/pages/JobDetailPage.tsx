import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiClient } from "../api/client";
import BackButton from "../components/BackButton";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import type { TestJob, TestLog, TestResult } from "../types";
import { formatDate, getErrorMessage } from "../utils/format";

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<TestJob | null>(null);
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");

  const loadJob = async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    const response = await apiClient.get<TestJob>(`/test-jobs/${id}`);
    setJob(response.data);

    if (!["PENDING", "RUNNING"].includes(response.data.status)) {
      await loadLogsAndResult(response.data.id);
    }

    setIsLoading(false);
  };

  const loadLogsAndResult = async (jobId: number) => {
    const logsResponse = await apiClient.get<{ items: TestLog[] }>(
      `/test-jobs/${jobId}/logs`,
    );
    setLogs(logsResponse.data.items);

    try {
      const resultResponse = await apiClient.get<TestResult>(
        `/test-jobs/${jobId}/result`,
      );
      setResult(resultResponse.data);
    } catch {
      setResult(null);
    }
  };

  useEffect(() => {
    loadJob().catch((err) => {
      setError(getErrorMessage(err));
      setIsLoading(false);
    });
  }, [id]);

  const runJob = async () => {
    if (!job) {
      return;
    }

    try {
      setIsRunning(true);
      setError("");
      const response = await apiClient.post<TestJob & { message: string }>(
        `/test-jobs/${job.id}/run`,
      );
      setJob(response.data);
      setLogs(response.data.logs || []);
      setResult(response.data.result || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!job) {
    return <p className="text-sm text-rose-700">{error || "Job not found."}</p>;
  }

  return (
    <div className="space-y-6">
      <BackButton fallback="/jobs" />

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Test Job #{job.id}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {job.testSuite?.name || "Diagnostic suite"} assigned to{" "}
            {job.labStation || "unassigned station"}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 md:grid-cols-2">
        <Detail label="Request" value={job.request?.title || `#${job.requestId}`} />
        <Detail label="Test Suite" value={job.testSuite?.name || "-"} />
        <Detail label="Lab Station" value={job.labStation || "-"} />
        <Detail label="Operator" value={job.operatorName || "-"} />
        <Detail label="Started" value={formatDate(job.startedAt)} />
        <Detail label="Finished" value={formatDate(job.finishedAt)} />
        <Detail
          label="Duration"
          value={
            job.durationSeconds === null ? "-" : `${job.durationSeconds} seconds`
          }
        />
      </section>

      {job.status === "PENDING" && (
        <button
          onClick={runJob}
          disabled={isRunning}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
        >
          {isRunning ? "Running..." : "Run Job"}
        </button>
      )}

      {job.requestId && (
        <Link
          to={`/reports/${job.requestId}`}
          className="inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          View request report
        </Link>
      )}

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-950">Execution logs</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-4">
            <EmptyState message="No logs are available for this job yet." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.logLevel} />
                    </td>
                    <td className="px-4 py-3">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Result</h2>
        {!result ? (
          <p className="mt-3 text-sm text-slate-500">
            Result not available for this job yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Detail label="Status" value={result.resultStatus} />
            <Detail label="Summary" value={result.summary || "-"} />
            <Detail label="Failed Step" value={result.failedStep || "-"} />
            <Detail label="Error Code" value={result.errorCode || "-"} />
            <div className="md:col-span-2">
              <Detail
                label="Recommendation"
                value={result.recommendation || "-"}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}
