import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Package,
  Truck,
  Utensils,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

// Role-based navigation. Each entry maps to a real route.
const NAV = {
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/menu", label: "Vendors", icon: Store },
    { to: "/cart", label: "Cart", icon: ShoppingCart, cart: true },
    { to: "/orders", label: "My Orders", icon: Package },
  ],
  vendor: [{ to: "/vendor", label: "Dashboard", icon: LayoutDashboard }],
  admin: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  carrier: [{ to: "/carrier", label: "Deliveries", icon: Truck }],
};

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const { items } = useCart();
  const links = NAV[user?.role] || [];

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Utensils size={18} />
        </span>
        <span className="text-lg font-extrabold tracking-tight text-slate-800">
          DormEats
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        {links.map(({ to, label, icon: Icon, end, cart }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className="flex-1">{label}</span>
            {cart && items.length > 0 && (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
                {items.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 text-xs text-slate-400">
        <p>Campus food, delivered together.</p>
      </div>
    </div>
  );
}
