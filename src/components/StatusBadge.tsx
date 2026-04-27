"use client";

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-gray-50 border-gray-200", text: "text-gray-600", dot: "bg-gray-400" },
  sent: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  paid: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  overdue: { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500" },
  partial: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  received: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  completed: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  cancelled: { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500" },
  in_progress: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium capitalize ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status.replace("_", " ")}
    </span>
  );
}
