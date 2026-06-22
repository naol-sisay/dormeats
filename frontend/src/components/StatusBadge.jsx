// Color-coded badge for an order/batch status
const colors = {
  pending: "bg-slate-100 text-slate-700 ring-slate-200",
  accepted: "bg-blue-50 text-blue-700 ring-blue-200",
  preparing: "bg-amber-50 text-amber-700 ring-amber-200",
  ready: "bg-purple-50 text-purple-700 ring-purple-200",
  batched: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  assigned: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  picked_up: "bg-orange-50 text-orange-700 ring-orange-200",
  out_for_delivery: "bg-orange-50 text-orange-700 ring-orange-200",
  delivered: "bg-brand-50 text-brand-700 ring-brand-200",
  finished: "bg-brand-50 text-brand-700 ring-brand-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

export default function StatusBadge({ status }) {
  const label = (status || "").replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${
        colors[status] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {label}
    </span>
  );
}
