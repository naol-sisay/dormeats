import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const dashboardPath = {
  student: "/student",
  vendor: "/vendor",
  admin: "/admin",
  carrier: "/carrier",
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    location: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await register(form);
      navigate(dashboardPath[user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-sm animate-fade-in-up">
      <div className="card p-7">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
            🍽️
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Create your account</h2>
          <p className="mt-1 text-sm text-slate-500">Join DormEats in a few seconds</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              name="name"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">I am a…</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="input"
            >
              <option value="student">Student</option>
              <option value="vendor">Vendor</option>
              <option value="carrier">Delivery Carrier</option>
            </select>
          </div>

          {/* Vendors give a shop location */}
          {form.role === "vendor" && (
            <div>
              <label className="label">Shop location</label>
              <input
                name="location"
                placeholder="e.g. Near Block 101"
                value={form.location}
                onChange={handleChange}
                className="input"
              />
            </div>
          )}

          <button className="btn-primary w-full">Register</button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
