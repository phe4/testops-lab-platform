import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { apiClient } from "../api/client";
import BackButton from "../components/BackButton";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import type { ReportResponse } from "../types";
import { formatDate, getErrorMessage } from "../utils/format";

export default function ReportPage() {
  const { requestId } = useParams();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!requestId) {
      return;
    }

    apiClient
      .get<ReportResponse>(`/reports/${requestId}`)
      .then((response) => setReport(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [requestId]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!report) {
    return <p className="text-sm text-rose-700">{error || "Report not found."}</p>;
  }

  return (
    <div className="space-y-6">
      <BackButton fallback={`/requests/${report.request.id}`} />

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-slate-500">
            Validation report
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            {report.request.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {report.request.componentName} · {report.request.targetSerial}
          </p>
        </div>
        <StatusBadge status={report.reportStatus} />
      </div>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 md:grid-cols-2">
        <Detail label="Request ID" value={String(report.request.id)} />
        <Detail label="Component Type" value={report.request.componentType} />
        <Detail label="Priority" value={report.request.priority} />
        <Detail label="Request Status" value={report.request.status} />
      </section>

      {report.jobs.length === 0 ? (
        <EmptyState message="No jobs are attached to this request yet." />
      ) : (
        report.jobs.map((job) => (
          <section
            key={job.id}
            className="rounded-md border border-slate-200 bg-white"
          >
            <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-slate-950">
                  Job #{job.id}: {job.testSuite?.name || "Diagnostic suite"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {job.labStation || "-"} · {job.operatorName || "-"}
                </p>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-3">
              <Detail label="Started" value={formatDate(job.startedAt)} />
              <Detail label="Finished" value={formatDate(job.finishedAt)} />
              <Detail
                label="Duration"
                value={
                  job.durationSeconds === null
                    ? "-"
                    : `${job.durationSeconds} seconds`
                }
              />
            </div>

            <div className="border-t border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-950">Result</h3>
              {job.result ? (
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <Detail label="Status" value={job.result.resultStatus} />
                  <Detail label="Summary" value={job.result.summary || "-"} />
                  <Detail label="Failed Step" value={job.result.failedStep || "-"} />
                  <Detail label="Error Code" value={job.result.errorCode || "-"} />
                  <div className="md:col-span-2">
                    <Detail
                      label="Recommendation"
                      value={job.result.recommendation || "-"}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No result yet.</p>
              )}
            </div>

            <div className="border-t border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-950">Logs</h3>
              {job.logs.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No logs yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Timestamp</th>
                        <th className="px-4 py-3 font-medium">Level</th>
                        <th className="px-4 py-3 font-medium">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {job.logs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-3">
                            {formatDate(log.createdAt)}
                          </td>
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
            </div>
          </section>
        ))
      )}
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
