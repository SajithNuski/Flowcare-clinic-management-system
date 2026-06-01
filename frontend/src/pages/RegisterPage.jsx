import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

function RegisterPage() {
  const navigate = useNavigate();

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

  function update(field, value) {
    setForm((s) => ({ ...s, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.full_name || !form.email || !form.password) {
      setError("Please fill all required fields.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
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
      if (res?.success) {
        navigate("/login");
        return;
      }

      // Show specific backend error messages with friendly suggestions
      const serverError = res?.error || res?.message || "Registration failed";
      if ((res?.detail || "").toLowerCase().includes("nic")) {
        setError("NIC already registered. Try logging in instead.");
      } else if ((res?.detail || "").toLowerCase().includes("email")) {
        setError("Email already in use. Try logging in or use a different email.");
      } else {
        setError(serverError);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="mx-auto flex min-h-screen max-w-6xl overflow-hidden rounded-lg bg-white shadow-lg">
        {/* Left info panel */}
        <div className="hidden w-1/2 flex-col gap-6 bg-gradient-to-b from-[#1372E6] to-[#0B63D1] p-10 text-white sm:flex">
          <div>
            <h2 className="text-3xl font-bold">Create Your Account</h2>
            <p className="mt-4 max-w-md text-sm text-white/90">
              Join Badulla Medical Centre's digital health system and experience
              seamless healthcare management at your fingertips.
            </p>
          </div>

          <div className="mt-auto space-y-4">
            <div className="rounded-lg bg-white/10 p-4">
              <ul className="space-y-2 text-sm">
                <li>• Book online appointments instantly</li>
                <li>• Track your queue position in real-time</li>
                <li>• Access your medical history securely</li>
              </ul>
            </div>

            <div className="pt-6 text-xs text-white/70">
              © 2024 Badulla Medical Centre. Trusted by thousands of patients.
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="w-full sm:w-1/2 p-8 sm:p-12">
          <div className="mx-auto max-w-md">
            <h3 className="text-xl font-semibold text-[#0F172A]">
              Create Patient Account
            </h3>
            <div className="mt-2 text-sm text-[#6B7280]">
              Already have an account?{" "}
              <Link to="/login" className="text-[#1A73E8]">
                Login here
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-[#374151]">
                  Full Name
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm"
                  placeholder="Enter your full legal name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    NIC Number
                  </label>
                  <input
                    value={form.nic}
                    onChange={(e) => update("nic", e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm"
                    placeholder="e.g. 199012345678"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => update("dob", e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => update("gender", e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    Phone Number
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm"
                    placeholder="07X XXX XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#374151]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm"
                  placeholder="name@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => update("confirm", e.target.value)}
                    className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-1/2 rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 rounded-md bg-[#0B63D1] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>

            <p className="mt-4 text-xs text-[#9CA3AF]">
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
// Registration page for FlowCare.
