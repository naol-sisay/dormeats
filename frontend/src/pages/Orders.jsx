import { useEffect, useState } from "react";
import {
  Package,
  MapPin,
  CheckCircle2,
  Star,
  PartyPopper,
  XCircle,
  Ban,
} from "lucide-react";
import api from "../api/axios.js";
import Card from "../components/Card.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

// A customer may cancel only while the order is still before "ready"
const CANCELLABLE = ["pending", "accepted", "preparing"];

// Customer-facing delivery tracking steps
const STEPS = [
  { key: "received", label: "Order Received" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "assigned", label: "Carrier Assigned" },
  { key: "picked_up", label: "Picked Up" },
  { key: "delivered", label: "Delivered" },
];

// Map an order status onto the tracking step index
const stepIndex = (status) => {
  switch (status) {
    case "pending":
    case "accepted":
      return 0;
    case "preparing":
      return 1;
    case "ready":
      return 2;
    case "batched":
    case "assigned":
      return 3;
    case "out_for_delivery":
    case "picked_up":
      return 4;
    case "delivered":
    case "finished":
      return 5;
    default:
      return 0;
  }
};

const isDelivered = (status) => ["delivered", "finished"].includes(status);

// Horizontal tracking timeline for a single order
function Tracking({ status }) {
  const current = stepIndex(status);
  return (
    <div className="mt-3 flex items-center">
      {STEPS.map((step, idx) => {
        const done = idx <= current;
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div
                className={`h-0.5 flex-1 ${
                  idx === 0 ? "opacity-0" : done ? "bg-brand-500" : "bg-slate-200"
                }`}
              />
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-400"
                }`}
              >
                {done && <CheckCircle2 size={12} />}
              </div>
              <div
                className={`h-0.5 flex-1 ${
                  idx === STEPS.length - 1
                    ? "opacity-0"
                    : idx < current
                    ? "bg-brand-500"
                    : "bg-slate-200"
                }`}
              />
            </div>
            <span
              className={`mt-1 text-center text-[10px] leading-tight ${
                done ? "font-semibold text-brand-700" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Star rating + feedback form, shown once an order is delivered
function RatingForm({ order, onSubmitted }) {
  const [rating, setRating] = useState(order.rating || 0);
  const [feedback, setFeedback] = useState(order.feedback || "");
  const [saved, setSaved] = useState(!!order.rating);

  const submit = async () => {
    if (!rating) return;
    await api.put(`/orders/${order._id}/feedback`, { rating, feedback });
    setSaved(true);
    onSubmitted?.();
  };

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-sm font-medium text-slate-700">
        {saved ? "Thanks for your feedback!" : "Rate your order"}
      </p>
      <div className="mb-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => !saved && setRating(n)}
            disabled={saved}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={saved ? "cursor-default" : "cursor-pointer"}
          >
            <Star
              size={20}
              className={
                n <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }
            />
          </button>
        ))}
      </div>
      {!saved && (
        <>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Leave a comment (optional)"
            rows={2}
            className="input mb-2 text-sm"
          />
          <button onClick={submit} disabled={!rating} className="btn-primary btn-sm">
            Submit rating
          </button>
        </>
      )}
      {saved && feedback && (
        <p className="text-sm italic text-slate-500">“{feedback}”</p>
      )}
    </div>
  );
}

// Confirmation popup shown before cancelling an order
function CancelConfirm({ onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Ban size={22} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Are you sure you want to cancel this order?
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          This will cancel every vendor in this order. It can't be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <button onClick={onConfirm} className="btn-danger flex-1">
            Yes, Cancel Order
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            No, Keep Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null); // order id to cancel
  const [notice, setNotice] = useState(null); // { type: "success"|"error", text }

  const load = () =>
    api.get("/orders/mine").then(({ data }) => setOrders(data));

  useEffect(() => {
    load()
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // Poll so status changes (carrier assigned, delivered, …) appear live
    const id = setInterval(() => load().catch(() => {}), 5000);
    return () => clearInterval(id);
  }, []);

  const confirmCancel = async () => {
    const id = pendingCancel;
    setPendingCancel(null);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setNotice({ type: "success", text: data.message });
      await load();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Could not cancel order",
      });
    }
  };

  if (loading) {
    return <p className="py-10 text-center text-slate-500">Loading orders…</p>;
  }

  // Group the per-vendor orders that belong to one checkout
  const groups = {};
  for (const o of orders) {
    const key = o.groupId || o._id;
    (groups[key] ||= []).push(o);
  }
  const groupList = Object.entries(groups);

  return (
    <div className="animate-fade-in-up">
      <h2 className="mb-6 text-2xl font-bold text-slate-900">My Orders</h2>

      {notice && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm font-semibold ${
            notice.type === "success"
              ? "border-brand-200 bg-brand-50 text-brand-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <XCircle size={18} />
          )}
          {notice.text}
        </div>
      )}

      {pendingCancel && (
        <CancelConfirm
          onConfirm={confirmCancel}
          onClose={() => setPendingCancel(null)}
        />
      )}

      {orders.length === 0 ? (
        <Card className="flex flex-col items-center py-12 text-center">
          <Package size={32} className="mb-3 text-slate-300" />
          <p className="text-slate-500">You haven't placed any orders yet.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {groupList.map(([key, groupOrders]) => {
            const allDelivered = groupOrders.every((o) => isDelivered(o.status));
            const allCancelled = groupOrders.every(
              (o) => o.status === "cancelled"
            );
            const cancellable = groupOrders.every((o) =>
              CANCELLABLE.includes(o.status)
            );
            const groupTotal = groupOrders.reduce((s, o) => s + o.total, 0);
            return (
              <Card key={key}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-500">
                    {groupOrders.length > 1
                      ? `Order from ${groupOrders.length} vendors`
                      : "Order"}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm text-slate-400">
                      <MapPin size={14} /> {groupOrders[0].pickupPoint}
                    </span>
                    {cancellable && (
                      <button
                        onClick={() => setPendingCancel(groupOrders[0]._id)}
                        className="btn-danger btn-sm"
                      >
                        <XCircle size={15} /> Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                {allDelivered && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm font-semibold text-brand-700">
                    <PartyPopper size={18} />
                    Your order has been delivered successfully
                  </div>
                )}

                {allCancelled && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    <Ban size={18} />
                    Your order has been cancelled successfully
                  </div>
                )}

                <div className="space-y-4">
                  {groupOrders.map((order) => (
                    <div
                      key={order._id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <h4 className="font-semibold text-slate-800">
                          {order.vendorId?.name || "Vendor"}
                        </h4>
                        <StatusBadge status={order.status} />
                      </div>

                      <ul className="mb-1 space-y-1 text-sm text-slate-600">
                        {order.items.map((i, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>
                              {i.name}{" "}
                              <span className="text-slate-400">× {i.quantity}</span>
                            </span>
                            <span className="text-slate-500">
                              {i.price * i.quantity} Birr
                            </span>
                          </li>
                        ))}
                      </ul>

                      {order.status === "cancelled" ? (
                        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
                          <Ban size={14} /> Cancelled
                        </p>
                      ) : (
                        <Tracking status={order.status} />
                      )}

                      {isDelivered(order.status) && (
                        <RatingForm order={order} onSubmitted={load} />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 text-sm font-bold text-slate-800">
                  Total: {groupTotal} Birr
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
