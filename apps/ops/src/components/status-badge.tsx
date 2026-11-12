const tones: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  SENT: "bg-blue-50 text-blue-700 ring-blue-200",
  PARTIALLY_PAID: "bg-amber-50 text-amber-800 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CONVERTED: "bg-violet-50 text-violet-700 ring-violet-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
  OVERDUE: "bg-rose-50 text-rose-700 ring-rose-200",
  VOID: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${tones[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {label}
    </span>
  );
}
