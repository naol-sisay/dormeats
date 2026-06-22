import { useEffect, useState } from "react";
import {
  Truck,
  MapPin,
  PackageCheck,
  CheckCircle2,
  Clock,
  Navigation,
  ListChecks,
  History,
  Lock,
  Store,
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Card from "../components/Card.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

// Compact list of an order's items
const itemLine = (o) =>
  o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ");

// One vendor row in a pickup checklist
function PickupRow({ order, onPickup, disabled }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-medium text-slate-800">
          <Store size={14} className="text-brand-600" />
          {order.vendorId?.name || "Vendor"}
          {order.pickedUp ? (
            <CheckCircle2 size={15} className="text-brand-600" />
          ) : (
            <Clock size={15} className="text-amber-500" />
          )}
        </p>
        <p className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin size={12} /> {order.vendorId?.location || "—"}
        </p>
        <p className="mt-1 text-sm text-slate-600">{itemLine(order)}</p>
      </div>
      {order.pickedUp ? (
        <span className="shrink-0 text-sm font-semibold text-brand-700">
          Collected ✅
        </span>
      ) : (
        <button
          onClick={onPickup}
          disabled={disabled}
          className="btn-secondary btn-sm shrink-0"
        >
          Mark collected
        </button>
      )}
    </div>
  );
}

export default function CarrierDashboard() {
  const { user } = useAuth();
  const approved = user?.status === "approved";

  const [availableOrders, setAvailableOrders] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [active, setActive] = useState({ orders: [], batches: [] });
  const [history, setHistory] = useState({ orders: [], batches: [] });
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [ao, ab, act, hist] = await Promise.all([
      api.get("/deliveries/available/orders"),
      api.get("/deliveries/available/batches"),
      api.get("/deliveries/active"),
      api.get("/deliveries/history"),
    ]);
    setAvailableOrders(ao.data);
    setAvailableBatches(ab.data);
    setActive(act.data);
    setHistory(hist.data);
  };

  useEffect(() => {
    if (!approved) {
      setLoading(false);
      return;
    }
    load()
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
    const id = setInterval(() => load().catch(() => {}), 5000);
    return () => clearInterval(id);
  }, [approved]);

  const run = async (fn, doneMsg) => {
    setError("");
    try {
      await fn();
      if (doneMsg) {
        setBanner(doneMsg);
        setTimeout(() => setBanner(""), 4000);
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  // --- Approval gate ---
  if (!approved) {
    const label = user?.status || "pending";
    return (
      <div className="mx-auto max-w-md animate-fade-in-up py-10 text-center">
        <Card className="flex flex-col items-center py-12">
          <Lock size={32} className="mb-3 text-slate-300" />
          <h2 className="text-lg font-bold text-slate-800">
            Carrier account {label}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {label === "pending"
              ? "An admin needs to approve your account before you can take deliveries."
              : `Your account is ${label}. Please contact an admin.`}
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <p className="py-10 text-center text-slate-500">Loading deliveries…</p>;
  }

  const hasActive = active.orders.length > 0 || active.batches.length > 0;

  return (
    <div className="animate-fade-in-up space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">My Deliveries</h2>

      {banner && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm font-semibold text-brand-700">
          <PackageCheck size={18} /> {banner}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* --- Active Deliveries --- */}
      <section>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <ListChecks size={18} className="text-brand-600" /> Active Deliveries
        </h3>
        {!hasActive ? (
          <Card className="py-8 text-center text-sm text-slate-500">
            No active delivery. Accept one below.
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Single active deliveries */}
            {active.orders.map((o) => (
              <Card key={o._id}>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 font-semibold text-slate-800">
                    <MapPin size={16} className="text-brand-600" /> {o.pickupPoint}
                  </h4>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mb-4 space-y-2">
                  <PickupRow
                    order={o}
                    onPickup={() =>
                      run(() => api.put(`/deliveries/orders/${o._id}/pickup`))
                    }
                  />
                </div>
                <button
                  onClick={() =>
                    run(
                      () => api.put(`/deliveries/orders/${o._id}/deliver`),
                      "Delivery Completed"
                    )
                  }
                  disabled={o.status !== "picked_up"}
                  className="btn-primary btn-sm"
                >
                  <PackageCheck size={15} /> Mark delivered
                </button>
              </Card>
            ))}

            {/* Active batches */}
            {active.batches.map((b) => {
              const allPicked = b.orders.every((o) => o.pickedUp);
              return (
                <Card key={b._id}>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 font-semibold text-slate-800">
                      <MapPin size={16} className="text-brand-600" /> {b.pickupPoint}
                      <span className="text-xs font-normal text-slate-400">
                        • {b.orders.length} vendors
                      </span>
                    </h4>
                    <StatusBadge status={b.status} />
                  </div>

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Pickup checklist
                  </p>
                  <div className="mb-4 space-y-2">
                    {b.orders.map((o) => (
                      <PickupRow
                        key={o._id}
                        order={o}
                        onPickup={() =>
                          run(() =>
                            api.put(
                              `/deliveries/batches/${b._id}/orders/${o._id}/pickup`
                            )
                          )
                        }
                      />
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      run(
                        () => api.put(`/deliveries/batches/${b._id}/deliver`),
                        "Delivery Completed"
                      )
                    }
                    disabled={!allPicked}
                    className="btn-primary btn-sm"
                  >
                    <PackageCheck size={15} />{" "}
                    {allPicked ? "Mark delivered" : "Collect all items first"}
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* --- Available Single Deliveries --- */}
      <section>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <Truck size={18} className="text-brand-600" /> Available Single Deliveries
        </h3>
        {availableOrders.length === 0 ? (
          <Card className="py-8 text-center text-sm text-slate-500">
            No single deliveries available right now.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {availableOrders.map((o) => (
              <Card key={o._id}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Store size={14} className="text-brand-600" />
                    {o.vendorId?.name || "Vendor"}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={12} /> {o.pickupPoint}
                  </span>
                </div>
                <p className="mb-3 text-sm text-slate-600">{itemLine(o)}</p>
                <button
                  onClick={() =>
                    run(() => api.post(`/deliveries/orders/${o._id}/accept`))
                  }
                  disabled={hasActive}
                  className="btn-primary btn-sm"
                  title={hasActive ? "Finish your active delivery first" : ""}
                >
                  Accept Delivery
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* --- Available Delivery Batches --- */}
      <section>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <Navigation size={18} className="text-brand-600" /> Available Delivery Batches
        </h3>
        {availableBatches.length === 0 ? (
          <Card className="py-8 text-center text-sm text-slate-500">
            No batches available right now.
          </Card>
        ) : (
          <div className="space-y-3">
            {availableBatches.map((b) => (
              <Card key={b._id}>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 font-semibold text-slate-800">
                    <MapPin size={16} className="text-brand-600" /> {b.pickupPoint}
                    <span className="text-xs font-normal text-slate-400">
                      • {b.orders.length} vendors
                    </span>
                  </h4>
                </div>
                <ul className="mb-3 space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  {b.orders.map((o) => (
                    <li key={o._id}>
                      <span className="font-medium text-slate-700">
                        {o.vendorId?.name || "Vendor"}
                      </span>{" "}
                      — {itemLine(o)}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    run(() => api.post(`/deliveries/batches/${b._id}/accept`))
                  }
                  disabled={hasActive}
                  className="btn-primary btn-sm"
                  title={hasActive ? "Finish your active delivery first" : ""}
                >
                  Accept Batch
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* --- Delivery History --- */}
      <section>
        <h3 className="section-title mb-3 flex items-center gap-2">
          <History size={18} className="text-slate-500" /> Delivery History
        </h3>
        {history.orders.length === 0 && history.batches.length === 0 ? (
          <Card className="py-8 text-center text-sm text-slate-500">
            No completed deliveries yet.
          </Card>
        ) : (
          <div className="space-y-2">
            {history.batches.map((b) => (
              <div
                key={b._id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <span className="text-slate-700">
                  Batch • {b.pickupPoint} • {b.orders.length} vendors
                </span>
                <StatusBadge status={b.status} />
              </div>
            ))}
            {history.orders.map((o) => (
              <div
                key={o._id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <span className="text-slate-700">
                  {o.vendorId?.name || "Vendor"} • {o.pickupPoint}
                </span>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
