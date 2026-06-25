import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

function RegisterPage() {
  const navigate = useNavigate();
  const todayStr = (() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  })();

  const [form, setForm] = useState({
    full_name: "",
    nic: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function update(field, value) {
    setForm((s) => ({ ...s, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (
      !form.full_name ||
      !form.nic ||
      !form.dob ||
      !form.gender ||
      !form.phone ||
      !form.password
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (form.dob && form.dob > todayStr) {
      setError("Date of Birth cannot be in the future.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    // Client-side password strength validation
    const pwd = form.password;
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#\$%\^&\*\(\)\-_=+\[\]{};:'"\\|,.<>\/?]/.test(pwd);

    if (
      pwd.length < minLength ||
      !hasUpper ||
      !hasLower ||
      !hasDigit ||
      !hasSpecial
    ) {
      setError(
        `Password must be at least ${minLength} characters and include uppercase, lowercase, a number, and a special character.`,
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: form.full_name,
        nic: form.nic,
        date_of_birth: form.dob,
        gender: form.gender,
        phone: form.phone,
        email: form.email,
        password: form.password,
      };

      const res = await registerUser(payload);
      // Debug: log full response for troubleshooting
      // eslint-disable-next-line no-console
      console.log("registerUser response:", res);

      if (res?.success) {
        navigate("/login", {
          state: { successMessage: "Account created successfully! Please log in below." },
        });
        return;
      }

      // Prefer server-provided detail or error, otherwise stringify the whole response
      const rawServer =
        res && typeof res === "object"
          ? res.detail || res.error || res.message
          : res;
      const serverError = (rawServer || "Registration failed").toString();

      function friendlyMessage(raw) {
        const s = raw.toLowerCase();
        if (
          s.includes("nic") &&
          (s.includes("exist") || s.includes("already"))
        ) {
          return "Your NIC is already registered — please try a different NIC or log in.";
        }
        if (
          s.includes("email") &&
          (s.includes("exist") || s.includes("already") || s.includes("in use"))
        ) {
          return "The email address is already in use — try logging in or use a different email.";
        }
        if (s.includes("phone") && s.includes("07")) {
          return "Phone number must start with 07 and contain 10 digits (e.g. 0771234567).";
        }
        if (s.includes("required") || s.includes("all required")) {
          return "Please fill all required fields before continuing.";
        }
        if (s.includes("invalid") && s.includes("nic")) {
          return "Invalid NIC format — please enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits).";
        }
        // Fallback: show server message or full response JSON
        if (serverError && serverError !== "Registration failed")
          return serverError;
        try {
          return JSON.stringify(res);
        } catch (e) {
          return "Registration failed";
        }
      }

      setError(friendlyMessage(serverError));
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#E8F1FC] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-[24px] bg-white border border-blue-100/60 shadow-[0_20px_50px_rgba(15,23,42,0.06)] min-h-[640px]">
        
        {/* Left Info Panel */}
        <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#1A73E8] to-[#1557B0] p-12 text-white sm:flex overflow-hidden">
          {/* Subtle grid backdrop pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 mb-8 backdrop-blur-sm">
              <i className="ti ti-user-plus" /> Patient Registration
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Create Your Account
            </h2>
            <p className="mt-4 max-w-sm text-sm text-[#E8F0FE] leading-relaxed">
              Join ASHINI Family Clinic Center's digital health system and experience
              seamless healthcare management at your fingertips.
            </p>
          </div>

          <div className="relative z-10 space-y-4 my-auto pt-8">
            <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <i className="ti ti-calendar-plus text-base" />
              </div>
              <div className="text-xs font-semibold text-white/95">Book online appointments instantly</div>
            </div>
            <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <i className="ti ti-list-numbers text-base" />
              </div>
              <div className="text-xs font-semibold text-white/95">Track your queue position in real-time</div>
            </div>
            <div className="flex items-center gap-3.5 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                <i className="ti ti-shield-lock text-base" />
              </div>
              <div className="text-xs font-semibold text-white/95">Access your medical history securely</div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-white/60 pt-6">
            &copy; {new Date().getFullYear()} ASHINI Family Clinic Center. Trusted by thousands of patients.
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full sm:w-1/2 p-8 sm:p-12 lg:p-14 flex items-center bg-white">
          <div className="w-full max-w-md mx-auto">
            <h3 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Create Account
            </h3>
            <div className="mt-2 text-sm text-[#6B7280]">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-[#1A73E8] hover:text-[#1557B0] transition-colors">
                Login here
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 px-4 py-3 text-xs font-semibold text-[#DC2626]">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                  placeholder="Enter your full legal name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">
                    NIC Number
                  </label>
                  <input
                    value={form.nic}
                    onChange={(e) => update("nic", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                    placeholder="e.g. 199012345678"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    max={todayStr}
                    onChange={(e) => update("dob", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => update("gender", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                    placeholder="07X XXX XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                  placeholder="name@example.com (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
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
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirm}
                      onChange={(e) => update("confirm", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-4 pr-10 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      aria-label={
                        showConfirm ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-3 flex items-center text-[#9CA3AF] hover:text-[#4B5563] transition-colors"
                    >
                      <i
                        className={showConfirm ? "ti ti-eye text-base" : "ti ti-eye-off text-base"}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="cursor-pointer w-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-[#4B5563] transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer w-1/2 rounded-xl bg-[#1A73E8] px-4 py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(26,115,232,0.3)] transition-all duration-300 hover:bg-[#1557B0] hover:shadow-[0_6px_20px_rgba(26,115,232,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loading ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>

            <p className="mt-6 text-[10px] leading-relaxed text-[#9CA3AF] text-center border-t border-slate-100 pt-4">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
