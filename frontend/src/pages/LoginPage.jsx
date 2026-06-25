import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api/auth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccess(location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await loginUser(identifier, password);

      if (res?.success) {
        // Backend may return user object at res.user or res.data
        const user = res.user ?? res.data ?? null;
        if (user) login(user);
        if (user?.role === "admin") {
          navigate("/admin/dashboard");
        } else if (user?.role === "doctor") {
          navigate("/doctor/dashboard");
        } else if (user?.role === "receptionist") {
          navigate("/receptionist/dashboard");
        } else if (user?.role === "patient") {
          navigate("/patient/dashboard");
        } else {
          navigate("/");
        }
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
    <div className="min-h-screen bg-[#E8F1FC] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-[24px] bg-white border border-blue-100/60 shadow-[0_20px_50px_rgba(15,23,42,0.06)] min-h-[600px]">
        
        {/* Left Hero Panel */}
        <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#1A73E8] to-[#1557B0] p-12 text-white sm:flex overflow-hidden">
          {/* Subtle grid backdrop pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 mb-8 backdrop-blur-sm">
              <i className="ti ti-lock" /> FlowCare Portal
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Welcome Back
            </h2>
            <p className="mt-4 max-w-sm text-sm text-[#E8F0FE] leading-relaxed">
              Access your medical dashboard and queue status in just a few
              clicks.
            </p>
          </div>

          <div className="relative z-10 space-y-4 my-auto pt-8">
            <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <i className="ti ti-eye-check text-base" />
              </div>
              <div className="text-xs font-semibold text-white/95">View records securely</div>
            </div>
            <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <i className="ti ti-calendar text-base" />
              </div>
              <div className="text-xs font-semibold text-white/95">Manage appointments</div>
            </div>
            <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <i className="ti ti-device-mobile-check text-base" />
              </div>
              <div className="text-xs font-semibold text-white/95">Quick check-in</div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-white/60 pt-6">
            &copy; {new Date().getFullYear()} ASHINI Family Clinic Center. All rights reserved.
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full sm:w-1/2 p-8 sm:p-12 lg:p-16 flex items-center bg-white">
          <div className="w-full max-w-md mx-auto">
            <h3 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Login
            </h3>
            <div className="mt-2.5 text-sm text-[#6B7280]">
              New here?{" "}
              <Link to="/register" className="font-bold text-[#1A73E8] hover:text-[#1557B0] transition-colors">
                Create an account
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {success && (
                <div className="rounded-xl bg-[#EAFAF1] border border-[#2ECC71]/25 px-4 py-3 text-xs font-semibold text-[#16A34A]">
                  {success}
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 px-4 py-3 text-xs font-semibold text-[#DC2626]">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#4B5563] uppercase tracking-wider">
                  Email Address / NIC Number
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. name@example.com or 123456789V"
                  className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider">
                    Password
                  </label>
                  <a className="text-xs font-semibold text-[#1A73E8] hover:text-[#1557B0] cursor-pointer hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-4 pr-10 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-3 flex items-center text-[#9CA3AF] hover:text-[#4B5563] transition-colors"
                  >
                    <i
                      className={showPassword ? "ti ti-eye text-base" : "ti ti-eye-off text-base"}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-[#4B5563] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4.5 w-4.5 rounded border-slate-300 text-[#1A73E8] focus:ring-[#1A73E8]/20 transition-all cursor-pointer"
                  />
                  Remember me
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer w-full rounded-xl bg-[#1A73E8] px-4 py-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(26,115,232,0.3)] transition-all duration-300 hover:bg-[#1557B0] hover:shadow-[0_6px_20px_rgba(26,115,232,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loading ? "Signing in…" : "Login to Account"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="cursor-pointer w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-[#4B5563] transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>

            <p className="mt-8 text-[11px] leading-relaxed text-[#9CA3AF] text-center border-t border-slate-100 pt-5">
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
