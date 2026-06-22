import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  UtensilsCrossed,
  Receipt,
  MapPin,
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Card from "../components/Card.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function VendorDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ name: "", price: "" });
  const [editingId, setEditingId] = useState(null);

  const loadMenu = () =>
    api.get("/menu/mine").then(({ data }) => setItems(data));
  const loadOrders = () =>
    api.get("/orders/vendor").then(({ data }) => setOrders(data));

  useEffect(() => {
    loadMenu().catch(console.error);
    loadOrders().catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, price: Number(form.price) };
    if (editingId) {
      await api.put(`/menu/${editingId}`, payload);
    } else {
      await api.post("/menu", payload);
    }
    setForm({ name: "", price: "" });
    setEditingId(null);
    loadMenu();
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({ name: item.name, price: item.price });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", price: "" });
  };

  const deleteItem = async (id) => {
    await api.delete(`/menu/${id}`);
    loadMenu();
  };

  const setStatus = async (orderId, status) => {
    await api.put(`/orders/${orderId}/status`, { status });
    loadOrders();
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="animate-fade-in-up space-y-6">
      {!user.approved && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Clock size={18} className="mt-0.5 shrink-0" />
          <p>
            Your shop is pending admin approval. Students won't see it until it's
            approved.
          </p>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{items.length}</p>
            <p className="text-sm text-slate-500">Menu items</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Receipt size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{orders.length}</p>
            <p className="text-sm text-slate-500">Total orders</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
            <p className="text-sm text-slate-500">Pending orders</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Menu management */}
        <div>
          <h3 className="section-title mb-3">Menu Items</h3>

          <Card className="mb-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Item name</label>
                <input
                  placeholder="e.g. Shiro with Injera"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Price (Birr)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-primary">
                  <Plus size={16} />
                  {editingId ? "Update Item" : "Add Item"}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="btn-secondary">
                    <X size={16} /> Cancel
                  </button>
                )}
              </div>
            </form>
          </Card>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <span className="text-sm text-slate-700">
                  <span className="font-medium text-slate-800">{item.name}</span>{" "}
                  — {item.price} Birr
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(item)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                    aria-label="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => deleteItem(item._id)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                No menu items yet. Add your first dish above.
              </p>
            )}
          </div>
        </div>

        {/* Orders */}
        <div>
          <h3 className="section-title mb-3">Orders</h3>
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order._id}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    {order.userId?.name || "Student"}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <ul className="mb-2 space-y-0.5 text-sm text-slate-600">
                  {order.items.map((i, idx) => (
                    <li key={idx}>
                      {i.name} <span className="text-slate-400">× {i.quantity}</span>
                    </li>
                  ))}
                </ul>
                <p className="mb-3 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin size={12} /> {order.pickupPoint} • {order.total} Birr
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatus(order._id, "accepted")}
                    className="btn btn-sm bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setStatus(order._id, "preparing")}
                    className="btn btn-sm bg-amber-50 text-amber-700 hover:bg-amber-100"
                  >
                    Preparing
                  </button>
                  <button
                    onClick={() => setStatus(order._id, "ready")}
                    className="btn btn-sm bg-purple-50 text-purple-700 hover:bg-purple-100"
                  >
                    Ready
                  </button>
                </div>
              </Card>
            ))}
            {orders.length === 0 && (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                No orders yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
