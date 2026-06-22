import { Link } from "react-router-dom";
import { Store, ShoppingCart, Package, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const actions = [
  {
    to: "/menu",
    icon: Store,
    title: "Browse Vendors",
    text: "See campus vendors and their menus.",
    accent: "bg-brand-50 text-brand-600",
  },
  {
    to: "/cart",
    icon: ShoppingCart,
    title: "My Cart",
    text: "Review items and place your order.",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    to: "/orders",
    icon: Package,
    title: "My Orders",
    text: "Track the status of your orders.",
    accent: "bg-blue-50 text-blue-600",
  },
];

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Hi {user.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-slate-500">What would you like to do today?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="card group p-6 transition-shadow hover:shadow-card-hover"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${a.accent}`}
            >
              <a.icon size={22} />
            </div>
            <h3 className="flex items-center justify-between font-semibold text-slate-800">
              {a.title}
              <ArrowRight
                size={18}
                className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-600"
              />
            </h3>
            <p className="mt-1 text-sm text-slate-500">{a.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
