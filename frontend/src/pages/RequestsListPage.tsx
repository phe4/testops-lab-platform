import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient } from "../api/client";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import StatusBadge from "../components/StatusBadge";
import type { TestRequest } from "../types";
import { formatDate } from "../utils/format";

export default function RequestsListPage() {
  const [requests, setRequests] = useState<TestRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ items: TestRequest[] }>("/test-requests")
      .then((response) => setRequests(response.data.items))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleRequests = useMemo(() => {
    if (!statusFilter) {
      return requests;
    }

    return requests.filter((request) => request.status === statusFilter);
  }, [requests, statusFilter]);

  const statuses = Array.from(new Set(requests.map((request) => request.status)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Test Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Validation intake records submitted by hardware engineers.
          </p>
        </div>
        <Link
          to="/requests/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Create Request
        </Link>
      </div>

      <div className="flex max-w-xs flex-col gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="status">
          Status filter
        </label>
        <select
          id="status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : visibleRequests.length === 0 ? (
        <EmptyState message="No test requests match this view." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Component</th>
                <th className="px-4 py-3 font-medium">Serial</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created At</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3">{request.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-950">
                    {request.title}
                  </td>
                  <td className="px-4 py-3">{request.componentName}</td>
                  <td className="px-4 py-3">{request.targetSerial}</td>
                  <td className="px-4 py-3">{request.priority}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3">{formatDate(request.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/requests/${request.id}`}
                      className="font-medium text-blue-700 hover:text-blue-900"
                    >
                      View detail
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
