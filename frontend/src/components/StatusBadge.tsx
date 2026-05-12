const styles: Record<string, string> = {
  SUBMITTED: "bg-blue-50 text-blue-700 ring-blue-200",
  UNDER_REVIEW: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SCHEDULED: "bg-amber-50 text-amber-700 ring-amber-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  RUNNING: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  PASSED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-200",
  COMPLETED: "bg-slate-100 text-slate-700 ring-slate-200",
  READY: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded px-2 py-1 text-xs font-semibold ring-1",
        styles[status] || "bg-slate-100 text-slate-700 ring-slate-200",
      ].join(" ")}
    >
      {status}
    </span>
  );
}
