import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Boxes,
  MapPin,
  ArrowRight,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const steps = [
  {
    icon: ShoppingBag,
    title: "Order",
    text: "Browse campus vendors and add meals to your cart in seconds.",
  },
  {
    icon: Boxes,
    title: "Batch",
    text: "Orders are grouped together to keep delivery fast and cheap.",
  },
  {
    icon: MapPin,
    title: "Pickup",
    text: "Collect your food at a fixed pickup point right on campus.",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <section className="max-w-2xl py-8 lg:py-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Now serving your campus
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Campus meals,{" "}
            <span className="text-brand-600">delivered together.</span>
          </h1>

          <p className="mt-4 max-w-md text-lg text-slate-500">
            Order from local dorm vendors, share delivery in batches to split the
            cost, and pick up your food at fixed points around campus.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {!user ? (
              <>
                <Link to="/register" className="btn-primary px-6 py-2.5 text-base">
                  Get Started
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary px-6 py-2.5 text-base">
                  I have an account
                </Link>
              </>
            ) : (
              <Link
                to={`/${user.role === "student" ? "student" : user.role}`}
                className="btn-primary px-6 py-2.5 text-base"
              >
                Go to Dashboard
                <ArrowRight size={18} />
              </Link>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            {["Pay on pickup", "Student-run vendors"].map(
              (f) => (
                <span key={f} className="inline-flex items-center gap-1.5">
                  <Check size={16} className="text-brand-600" />
                  {f}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="card p-6 transition-shadow hover:shadow-card-hover"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <s.icon size={22} />
            </div>
            <h3 className="font-semibold text-slate-800">
              <span className="text-slate-400">{i + 1}.</span> {s.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{s.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
