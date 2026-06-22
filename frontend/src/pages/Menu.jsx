import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Check, ShoppingCart, MapPin, Store } from "lucide-react";
import api from "../api/axios.js";
import { useCart } from "../context/CartContext.jsx";
import Card from "../components/Card.jsx";

function vendorInitials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Menu() {
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const [vendors, setVendors] = useState([]);
  const [menusByVendor, setMenusByVendor] = useState({});
  const [loading, setLoading] = useState(true);
  const [justAdded, setJustAdded] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: vendorList } = await api.get("/vendors");
        setVendors(vendorList);

        const menus = {};
        for (const v of vendorList) {
          const { data: vItems } = await api.get(`/menu?vendorId=${v._id}`);
          menus[v._id] = vItems;
        }
        setMenusByVendor(menus);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = (vendor, item) => {
    addItem(vendor, item);
    setJustAdded(item._id);
    setTimeout(() => setJustAdded((id) => (id === item._id ? null : id)), 1200);
  };

  if (loading) {
    return (
      <p className="py-10 text-center text-slate-500">Loading vendors…</p>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vendors & Menus</h2>
          <p className="text-slate-500">Add items, then head to your cart.</p>
        </div>
        <button onClick={() => navigate("/cart")} className="btn-primary">
          <ShoppingCart size={18} />
          Cart ({items.length})
        </button>
      </div>

      {vendors.length === 0 && (
        <Card className="flex flex-col items-center py-12 text-center">
          <Store size={32} className="mb-3 text-slate-300" />
          <p className="text-slate-500">No approved vendors yet.</p>
        </Card>
      )}

      <div className="space-y-5">
        {vendors.map((v) => (
          <Card key={v._id} className="p-0">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                {vendorInitials(v.name)}
              </span>
              <div>
                <h3 className="font-semibold text-slate-800">{v.name}</h3>
                <p className="flex items-center gap-1 text-sm text-slate-400">
                  <MapPin size={13} /> {v.location}
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {(menusByVendor[v._id] || []).map((item) => {
                const added = justAdded === item._id;
                return (
                  <div
                    key={item._id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 transition hover:border-brand-300"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.price} Birr</p>
                    </div>
                    <button
                      onClick={() => handleAdd(v, item)}
                      className={`btn btn-sm ${
                        added
                          ? "bg-brand-100 text-brand-700"
                          : "bg-brand-600 text-white hover:bg-brand-700"
                      }`}
                    >
                      {added ? <Check size={15} /> : <Plus size={15} />}
                      {added ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })}
              {(menusByVendor[v._id] || []).length === 0 && (
                <p className="text-sm text-slate-400">No items yet.</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
