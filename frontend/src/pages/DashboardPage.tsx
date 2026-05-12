import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../api/client";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import type { TestRequest } from "../types";
import { formatDate } from "../utils/format";

export default function DashboardPage() {
  const [requests, setRequests] = useState<TestRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ items: TestRequest[] }>("/test-requests")
      .then((response) => setRequests(response.data.items))
      .finally(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const count = (status: string) =>
      requests.filter((request) => request.status === status).length;

    return [
      { label: "Total requests", value: requests.length },
      { label: "Submitted", value: count("SUBMITTED") },
      { label: "Approved", value: count("APPROVED") },
      { label: "Scheduled", value: count("SCHEDULED") },
      { label: "Completed", value: count("COMPLETED") },
    ];
  }, [requests]);

  const recentRequests = requests.slice(0, 6);

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

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-md border border-slate-200 bg-white p-4"
              >
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {stat.value}
                </p>
              </div>
            ))}
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
