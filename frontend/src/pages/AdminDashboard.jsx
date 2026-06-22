import { useEffect, useState } from "react";
import {
  Users,
  Store,
  Clock,
  Receipt,
  MapPin,
  BadgeCheck,
  Ban,
  Truck,
  Layers,
  X,
  Sparkles,
} from "lucide-react";
import api from "../api/axios.js";
import Card from "../components/Card.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

// Small summary tile shown at the top of the dashboard
function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-slate-800">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [batches, setBatches] = useState([]);

  // Batch builder state
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [carrierId, setCarrierId] = useState("");
  const [pickupPoint, setPickupPoint] = useState("");
  const [message, setMessage] = useState("");

  const loadAll = async () => {
    const [u, v, o, c, b] = await Promise.all([
      api.get("/admin/users"),
      api.get("/admin/vendors"),
      api.get("/admin/orders"),
      api.get("/admin/carriers"),
      api.get("/batches"),
    ]);
    setUsers(u.data);
    setVendors(v.data);
    setOrders(o.data);
    setCarriers(c.data);
    setBatches(b.data);
  };

  useEffect(() => {
    loadAll().catch(console.error);
  }, []);

  // --- Carrier approval actions ---
  const setCarrierStatus = async (id, status, name) => {
    if (
      (status === "disapproved" || status === "suspended") &&
      !window.confirm(`${status === "suspended" ? "Suspend" : "Disapprove"} "${name}"?`)
    )
      return;
    await api.put(`/admin/carriers/${id}/status`, { status });
    loadAll();
  };

  // --- Batch management actions ---
  const autoBatch = async () => {
    setMessage("");
    try {
      const { data } = await api.post("/batches/auto");
      setMessage(
        data.created > 0
          ? `Auto-created ${data.created} batch(es).`
          : "No ready orders could be grouped (need 2+ at the same pickup point)."
      );
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Auto-batch failed");
    }
  };

  const assignBatchCarrier = async (batchId, value) => {
    await api.put(`/batches/${batchId}/assign`, { carrierId: value || null });
    loadAll();
  };

  const removeOrderFromBatch = async (batch, orderId) => {
    const remaining = batch.orders
      .map((o) => o._id)
      .filter((id) => id !== orderId);
    await api.put(`/batches/${batch._id}`, { orderIds: remaining });
    loadAll();
  };

  const cancelBatch = async (batchId) => {
    if (!window.confirm("Cancel this batch? Its orders return to available."))
      return;
    await api.put(`/batches/${batchId}/cancel`);
    loadAll();
  };

  const approvedCarriers = carriers.filter((c) => c.status === "approved");
  const activeBatches = batches.filter((b) => b.status !== "cancelled");

  const approveVendor = async (id) => {
    await api.put(`/admin/vendors/${id}/approve`);
    loadAll();
  };

  const disapproveVendor = async (id, name) => {
    // Confirm before disapproving so it isn't done by accident
    if (!window.confirm(`Disapprove "${name}"? They will no longer receive orders.`))
      return;
    await api.put(`/admin/vendors/${id}/disapprove`);
    loadAll();
  };

  // Derive a vendor's approval status (older records may only have `approved`)
  const vendorStatus = (v) =>
    v.status || (v.approved ? "approved" : "pending");

  const toggleOrder = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createBatch = async () => {
    setMessage("");
    if (selectedOrders.length === 0 || !pickupPoint) {
      setMessage("Select at least one order and a pickup point.");
      return;
    }
    try {
      await api.post("/batches", {
        orderIds: selectedOrders,
        carrierId: carrierId || null,
        pickupPoint,
      });
      setSelectedOrders([]);
      setCarrierId("");
      setPickupPoint("");
      setMessage("Batch created!");
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not create batch");
    }
  };

  // Only ready orders that aren't already in a batch can be grouped
  const batchableOrders = orders.filter(
    (o) => o.status === "ready" && !o.batchId
  );

  const pendingVendors = vendors.filter(
    (v) => vendorStatus(v) === "pending"
  ).length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <p className="-mt-2 text-sm text-slate-500">
        Manage vendors, users and delivery batches.
      </p>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={users.length}
          icon={Users}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Vendors"
          value={vendors.length}
          icon={Store}
          accent="bg-brand-50 text-brand-600"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingVendors}
          icon={Clock}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Total Orders"
          value={orders.length}
          icon={Receipt}
          accent="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Vendors / approval */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Vendors</h2>
          {pendingVendors > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
              {pendingVendors} awaiting approval
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {vendors.map((v) => {
            const status = vendorStatus(v);
            const badge = {
              approved: {
                cls: "bg-brand-50 text-brand-700 ring-brand-200",
                Icon: BadgeCheck,
                label: "Approved",
              },
              pending: {
                cls: "bg-amber-50 text-amber-700 ring-amber-200",
                Icon: Clock,
                label: "Pending",
              },
              disapproved: {
                cls: "bg-red-50 text-red-700 ring-red-200",
                Icon: Ban,
                label: "Disapproved",
              },
            }[status];
            const BadgeIcon = badge.Icon;
            return (
              <Card key={v._id} className="transition-shadow hover:shadow-card-hover">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{v.name}</p>
                    <p className="flex items-center gap-1 truncate text-sm text-slate-500">
                      <MapPin size={13} /> {v.location}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {/* Current vendor status */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge.cls}`}
                    >
                      <BadgeIcon size={13} /> {badge.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {status !== "approved" && (
                        <button
                          onClick={() => approveVendor(v._id)}
                          className="btn-primary btn-sm"
                        >
                          Approve
                        </button>
                      )}
                      {status !== "disapproved" && (
                        <button
                          onClick={() => disapproveVendor(v._id, v.name)}
                          className="btn-danger btn-sm"
                        >
                          Disapprove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {vendors.length === 0 && (
            <p className="text-sm text-slate-500">No vendors yet.</p>
          )}
        </div>
      </section>

      {/* Carriers / approval */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Truck size={18} className="text-brand-600" />
          <h2 className="section-title">Carriers</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {carriers.map((c) => {
            const status = c.status || "approved";
            const badge = {
              approved: "bg-brand-50 text-brand-700 ring-brand-200",
              pending: "bg-amber-50 text-amber-700 ring-amber-200",
              disapproved: "bg-red-50 text-red-700 ring-red-200",
              suspended: "bg-slate-100 text-slate-600 ring-slate-300",
            }[status];
            return (
              <Card key={c._id} className="transition-shadow hover:shadow-card-hover">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{c.name}</p>
                    <p className="truncate text-sm text-slate-500">{c.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${badge}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {status !== "approved" && (
                    <button
                      onClick={() => setCarrierStatus(c._id, "approved", c.name)}
                      className="btn-primary btn-sm"
                    >
                      {status === "suspended" ? "Reactivate" : "Approve"}
                    </button>
                  )}
                  {status === "approved" && (
                    <button
                      onClick={() => setCarrierStatus(c._id, "suspended", c.name)}
                      className="btn-secondary btn-sm"
                    >
                      Suspend
                    </button>
                  )}
                  {status !== "disapproved" && (
                    <button
                      onClick={() => setCarrierStatus(c._id, "disapproved", c.name)}
                      className="btn-danger btn-sm"
                    >
                      Disapprove
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
          {carriers.length === 0 && (
            <p className="text-sm text-slate-500">No carriers yet.</p>
          )}
        </div>
      </section>

      {/* Batch builder */}
      <section>
        <h2 className="section-title mb-3">Create Delivery Batch</h2>
        {message && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            {message}
          </div>
        )}
        <Card>
          <p className="mb-3 text-sm text-slate-500">
            Select orders to group, pick a pickup point and assign a carrier.
          </p>

          <div className="mb-4 space-y-2">
            {batchableOrders.map((o) => (
              <label
                key={o._id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(o._id)}
                  onChange={() => toggleOrder(o._id)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                />
                <span className="flex-1 text-sm text-slate-700">
                  <span className="font-medium">{o.userId?.name}</span> →{" "}
                  {o.vendorId?.name} • {o.pickupPoint}
                </span>
                <StatusBadge status={o.status} />
              </label>
            ))}
            {batchableOrders.length === 0 && (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                No orders to batch right now.
              </p>
            )}
          </div>

          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Pickup point (e.g. Main Library)"
              value={pickupPoint}
              onChange={(e) => setPickupPoint(e.target.value)}
              className="input"
            />
            <select
              value={carrierId}
              onChange={(e) => setCarrierId(e.target.value)}
              className="input"
            >
              <option value="">Assign carrier (optional)</option>
              {approvedCarriers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={createBatch} className="btn-primary">
            Create Batch
          </button>
        </Card>
      </section>

      {/* Manage existing batches */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-brand-600" />
            <h2 className="section-title">Manage Batches</h2>
          </div>
          <button onClick={autoBatch} className="btn-secondary btn-sm">
            <Sparkles size={15} /> Auto-batch ready orders
          </button>
        </div>

        <div className="space-y-3">
          {activeBatches.map((b) => (
            <Card key={b._id}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                  <MapPin size={15} className="text-brand-600" /> {b.pickupPoint}
                  <span className="text-xs font-normal text-slate-400">
                    • {b.orders.length} order(s)
                  </span>
                </h3>
                <StatusBadge status={b.status} />
              </div>

              <ul className="mb-3 space-y-1.5">
                {b.orders.map((o) => (
                  <li
                    key={o._id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  >
                    <span>
                      <span className="font-medium text-slate-700">
                        {o.vendorId?.name || "Vendor"}
                      </span>{" "}
                      — {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                    </span>
                    {["batched", "assigned"].includes(b.status) && (
                      <button
                        onClick={() => removeOrderFromBatch(b, o._id)}
                        className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove order from batch"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={b.carrierId?._id || b.carrierId || ""}
                  onChange={(e) => assignBatchCarrier(b._id, e.target.value)}
                  disabled={["delivered"].includes(b.status)}
                  className="input max-w-[14rem]"
                >
                  <option value="">Unassigned</option>
                  {approvedCarriers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {b.status !== "delivered" && (
                  <button
                    onClick={() => cancelBatch(b._id)}
                    className="btn-danger btn-sm"
                  >
                    Cancel batch
                  </button>
                )}
              </div>
            </Card>
          ))}
          {activeBatches.length === 0 && (
            <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
              No active batches. Use auto-batch or create one above.
            </p>
          )}
        </div>
      </section>

      {/* Users */}
      <section>
        <h2 className="section-title mb-3">All Users</h2>
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u._id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-700">
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
