import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api/auth";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser(identifier, password);

      if (res?.success) {
        // Backend may return user object at res.user or res.data
        const user = res.user ?? res.data ?? null;
        if (user) login(user);
        navigate(user?.role === "doctor" ? "/doctor" : "/");
        return;
      }

      setError(res?.error || res?.message || "Invalid credentials");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="mx-auto flex min-h-screen max-w-6xl overflow-hidden rounded-lg bg-white shadow-lg">
        {/* Left hero panel */}
        <div className="hidden w-1/2 flex-col gap-6 bg-gradient-to-b from-[#1372E6] to-[#0B63D1] p-10 text-white sm:flex">
          <div>
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="mt-4 max-w-md text-sm text-white/90">
              Access your medical dashboard and queue status in just a few
              clicks.
            </p>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-white/10 p-2 text-white" />
              <div className="text-sm">View records securely</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-white/10 p-2 text-white" />
              <div className="text-sm">Manage appointments</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-white/10 p-2 text-white" />
              <div className="text-sm">Quick check-in</div>
            </div>

            <div className="pt-6 text-xs text-white/70">
              © 2024 Badulla Medical Centre. Leading digital healthcare
              solutions.
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="w-full sm:w-1/2 p-8 sm:p-12">
          <div className="mx-auto max-w-md">
            <h3 className="text-xl font-semibold text-[#0F172A]">
              Patient Login
            </h3>
            <div className="mt-2 text-sm text-[#6B7280]">
              New here?{" "}
              <Link to="/register" className="text-[#1A73E8]">
                Create an account
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-[#374151]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1A73E8] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    Password
                  </label>
                  <a className="text-xs text-[#6B7280] hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#1A73E8] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-[#374151]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#E5E7EB]"
                  />{" "}
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-md bg-[#0B63D1] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Login to Account"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-2 w-full rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
            </form>

            <p className="mt-6 text-xs text-[#9CA3AF]">
              Secure connection via 256-bit encryption. Your data privacy is our
              priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
