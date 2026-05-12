import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiClient } from "../api/client";
import BackButton from "../components/BackButton";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import type { TestRequest, TestSuite } from "../types";
import { formatDate, getErrorMessage } from "../utils/format";

export default function RequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState<TestRequest | null>(null);
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [jobId, setJobId] = useState<number | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    testSuiteId: "",
    labStation: "LAB-STATION-03",
    operatorName: "test_engineer_1",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    const [requestResponse, suitesResponse] = await Promise.all([
      apiClient.get<TestRequest>(`/test-requests/${id}`),
      apiClient.get<{ items: TestSuite[] }>("/test-suites"),
    ]);

    setRequest(requestResponse.data);
    setSuites(suitesResponse.data.items);
    setScheduleForm((current) => ({
      ...current,
      testSuiteId: current.testSuiteId || String(suitesResponse.data.items[0]?.id || ""),
    }));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData().catch((err) => {
      setError(getErrorMessage(err));
      setIsLoading(false);
    });
  }, [id]);

  const approveRequest = async () => {
    if (!request) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await apiClient.post(`/test-requests/${request.id}/approve`);
      const response = await apiClient.get<TestRequest>(
        `/test-requests/${request.id}`,
      );
      setRequest(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const scheduleRequest = async (event: FormEvent) => {
    event.preventDefault();

    if (!request) {
      return;
    }

    if (
      !scheduleForm.testSuiteId ||
      !scheduleForm.labStation.trim() ||
      !scheduleForm.operatorName.trim()
    ) {
      setError("Please fill in all schedule fields.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const response = await apiClient.post<{ id: number }>(
        `/test-requests/${request.id}/schedule`,
        {
          testSuiteId: Number(scheduleForm.testSuiteId),
          labStation: scheduleForm.labStation,
          operatorName: scheduleForm.operatorName,
        },
      );
      setJobId(response.data.id);
      const refreshed = await apiClient.get<TestRequest>(
        `/test-requests/${request.id}`,
      );
      setRequest(refreshed.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!request) {
    return <p className="text-sm text-rose-700">{error || "Request not found."}</p>;
  }

  const canApprove = ["SUBMITTED", "UNDER_REVIEW"].includes(request.status);
  const canSchedule = request.status === "APPROVED";

  return (
    <div className="space-y-6">
      <BackButton fallback="/requests" />

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {request.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Request #{request.id} submitted by {request.requesterName}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 md:grid-cols-2">
        <Detail label="Component" value={request.componentName} />
        <Detail label="Component Type" value={request.componentType} />
        <Detail label="Target Serial" value={request.targetSerial} />
        <Detail label="Priority" value={request.priority} />
        <Detail label="Created" value={formatDate(request.createdAt)} />
        <Detail label="Updated" value={formatDate(request.updatedAt)} />
        <div className="md:col-span-2">
          <Detail label="Description" value={request.description || "-"} />
        </div>
      </section>

      {canApprove && (
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Review action</h2>
          <p className="mt-1 text-sm text-slate-500">
            Approve this request so it can be scheduled on a lab station.
          </p>
          <button
            onClick={approveRequest}
            disabled={isSaving}
            className="mt-4 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-slate-400"
          >
            {isSaving ? "Approving..." : "Approve Request"}
          </button>
        </section>
      )}

      {canSchedule && (
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Schedule test job</h2>
          <form onSubmit={scheduleRequest} className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Test Suite</span>
              <select
                value={scheduleForm.testSuiteId}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    testSuiteId: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
              >
                {suites.map((suite) => (
                  <option key={suite.id} value={suite.id}>
                    {suite.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Lab Station</span>
              <input
                value={scheduleForm.labStation}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    labStation: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Operator</span>
              <input
                value={scheduleForm.operatorName}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    operatorName: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-400"
              >
                {isSaving ? "Scheduling..." : "Schedule Job"}
              </button>
            </div>
          </form>
        </section>
      )}

      {jobId && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Job scheduled successfully.{" "}
          <Link to={`/jobs/${jobId}`} className="font-semibold underline">
            Open job #{jobId}
          </Link>
        </div>
      )}

      {["SCHEDULED", "COMPLETED"].includes(request.status) && !jobId && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          This request is {request.status.toLowerCase()}.
        </div>
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
