import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, MapPin, Store } from "lucide-react";
import api from "../api/axios.js";
import { useCart } from "../context/CartContext.jsx";
import Card from "../components/Card.jsx";

export default function Cart() {
  const navigate = useNavigate();
  const { items, itemsByVendor, removeItem, clearCart, total } = useCart();
  const [pickupPoints, setPickupPoints] = useState([]);
  const [pickupPoint, setPickupPoint] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/pickup-points")
      .then(({ data }) => {
        setPickupPoints(data);
        if (data.length) setPickupPoint(data[0].name);
      })
      .catch((err) => console.error(err));
  }, []);

  const placeOrder = async () => {
    setMessage("");
    if (items.length === 0) return;
    if (!pickupPoint) {
      setMessage("Please choose a pickup point before placing your order.");
      return;
    }
    try {
      // One checkout -> one order per vendor (linked by groupId on the server)
      await api.post("/orders", {
        carts: itemsByVendor.map((g) => ({
          vendorId: g.vendorId,
          items: g.items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
        })),
        pickupPoint,
      });
      clearCart();
      navigate("/orders");
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not place order");
    }
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in-up">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-slate-900">
        <ShoppingCart size={22} className="text-brand-600" /> Your Cart
      </h2>

      {message && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <p className="text-slate-600">
            Your cart is empty.{" "}
            <button
              onClick={() => navigate("/menu")}
              className="font-semibold text-brand-700 hover:underline"
            >
              Browse vendors
            </button>
          </p>
        </Card>
      ) : (
        <Card>
          {/* Items grouped by vendor */}
          <div className="space-y-5">
            {itemsByVendor.map((group) => (
              <div key={group.vendorId}>
                <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Store size={14} className="text-brand-600" />
                  {group.vendorName || "Vendor"}
                  <span className="ml-auto text-xs font-medium text-slate-400">
                    {group.subtotal} Birr
                  </span>
                </div>
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {group.items.map((i) => (
                    <div
                      key={i.menuItemId}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{i.name}</p>
                        <p className="text-sm text-slate-500">
                          {i.price} Birr × {i.quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(i.menuItemId)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-red-600"
                        aria-label={`Remove ${i.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-bold text-slate-800">
            <span>Total</span>
            <span>{total} Birr</span>
          </div>

          <div className="mt-4">
            <label className="label flex items-center gap-1.5">
              <MapPin size={14} /> Pickup point
            </label>
            {pickupPoints.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                No pickup points are set up yet. Please contact an admin before
                ordering.
              </p>
            ) : (
              <select
                value={pickupPoint}
                onChange={(e) => setPickupPoint(e.target.value)}
                className="input"
              >
                {pickupPoints.map((p) => (
                  <option key={p._id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={placeOrder}
            disabled={pickupPoints.length === 0}
            className="btn-primary mt-5 w-full"
          >
            Place Order
          </button>
        </Card>
      )}
    </div>
  );
}
