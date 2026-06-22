import { Link, NavLink } from "react-router-dom";
import { Utensils } from "lucide-react";

// Slim top header shown only on public pages (logged-out visitors).
// Authenticated users get the sidebar AppShell instead.
export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Utensils size={18} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-800">
            DormEats
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <NavLink
            to="/login"
            className="btn-ghost"
          >
            Login
          </NavLink>
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
