import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getClinicSettings, updateClinicSettings } from "../api/admin";

function ClinicSettings() {
  const [settings, setSettings] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_phone: "",
    clinic_email: "",
    open_time: "08:00",
    close_time: "17:00",
    open_days: "Mon,Tue,Wed,Thu,Fri,Sat",
    consultation_fee: "1000",
    emergency_phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  const weekdays = [
    { label: "Monday", value: "Mon" },
    { label: "Tuesday", value: "Tue" },
    { label: "Wednesday", value: "Wed" },
    { label: "Thursday", value: "Thu" },
    { label: "Friday", value: "Fri" },
    { label: "Saturday", value: "Sat" },
    { label: "Sunday", value: "Sun" },
  ];

  // Load clinic settings on mount
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError("");
      try {
        const result = await getClinicSettings();
        if (result?.success && result?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...result.settings,
          }));
        } else {
          setError(result?.error || "Failed to load clinic settings.");
        }
      } catch (err) {
        setError("An error occurred while fetching settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDayToggle = (dayValue) => {
    const currentDays = settings.open_days ? settings.open_days.split(",").filter(Boolean) : [];
    let updatedDays;
    if (currentDays.includes(dayValue)) {
      updatedDays = currentDays.filter((d) => d !== dayValue);
    } else {
      updatedDays = [...currentDays, dayValue];
    }
    setSettings((prev) => ({
      ...prev,
      open_days: updatedDays.join(","),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // Simple validations
    if (!settings.clinic_name.trim()) {
      setError("Clinic name cannot be empty.");
      setSaving(false);
      return;
    }
    if (settings.clinic_email && !/\S+@\S+\.\S+/.test(settings.clinic_email)) {
      setError("Please enter a valid email address.");
      setSaving(false);
      return;
    }

    try {
      const result = await updateClinicSettings({ settings });
      if (result?.success) {
        setSuccess("Clinic settings updated successfully.");
        // If settings are returned in result, update local state
        if (result.settings) {
          setSettings((prev) => ({
            ...prev,
            ...result.settings,
          }));
        }
        // Auto clear success message after 4 seconds
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(result?.error || "Failed to save settings.");
      }
    } catch (err) {
      setError("An error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F5F7FB] text-[#0F172A]">
      <Sidebar role="admin" activePage="Settings" />

      <main className="min-w-0 flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-[#E6EEF3] bg-white/95 px-6 py-5 shadow-sm backdrop-blur-sm sm:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1A73E8]">
              System Configuration
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Clinic Settings
            </h1>
            <p className="max-w-2xl text-sm text-[#6B7280]">
              Manage your clinic's public identity, operating schedules, consultation fees, and system preferences.
            </p>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 p-6 sm:p-8 max-w-5xl w-full mx-auto">
          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
              <i className="ti ti-alert-circle text-lg mt-0.5" />
              <div>
                <p className="font-semibold">Failed to save settings</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700 flex items-start gap-3 animate-fadeIn">
              <i className="ti ti-circle-check text-lg mt-0.5" />
              <div>
                <p className="font-semibold">Changes saved</p>
                <p className="mt-0.5 text-green-600">{success}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E5EAF2] p-8 shadow-sm space-y-6">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                      <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
              {/* Settings Navigation Tabs */}
              <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl whitespace-nowrap transition ${
                    activeTab === "general"
                      ? "bg-white text-[#1A73E8] shadow-sm border border-[#E5EAF2]"
                      : "text-[#6B7280] hover:text-[#0F172A] hover:bg-[#E8F0FE]/35"
                  }`}
                >
                  <i className="ti ti-building-hospital text-lg" />
                  <span>Clinic Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("hours")}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl whitespace-nowrap transition ${
                    activeTab === "hours"
                      ? "bg-white text-[#1A73E8] shadow-sm border border-[#E5EAF2]"
                      : "text-[#6B7280] hover:text-[#0F172A] hover:bg-[#E8F0FE]/35"
                  }`}
                >
                  <i className="ti ti-clock text-lg" />
                  <span>Business Hours</span>
                </button>
              </nav>

              {/* Form Container */}
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5EAF2] shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 space-y-6">
                  {activeTab === "general" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-[#0F172A]">Clinic Profile</h2>
                        <p className="text-sm text-[#6B7280]">
                          This information will be visible to patients on reports, receipts, and search interfaces.
                        </p>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
                            Clinic Name
                          </label>
                          <input
                            type="text"
                            name="clinic_name"
                            value={settings.clinic_name}
                            onChange={handleChange}
                            placeholder="e.g. ASHINI Family Clinic Center"
                            className="w-full rounded-xl border border-[#E5EAF2] px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#9CA3AF] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-blue-100"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
                            Contact Phone
                          </label>
                          <input
                            type="text"
                            name="clinic_phone"
                            value={settings.clinic_phone}
                            onChange={handleChange}
                            placeholder="e.g. 055 222 4567"
                            className="w-full rounded-xl border border-[#E5EAF2] px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#9CA3AF] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
                            Contact Email
                          </label>
                          <input
                            type="email"
                            name="clinic_email"
                            value={settings.clinic_email}
                            onChange={handleChange}
                            placeholder="e.g. info@ashiniclinic.com"
                            className="w-full rounded-xl border border-[#E5EAF2] px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#9CA3AF] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-blue-100"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
                            Physical Address
                          </label>
                          <textarea
                            name="clinic_address"
                            value={settings.clinic_address}
                            onChange={handleChange}
                            placeholder="No. 14, Bandarawela Road, Badulla, Uva Province"
                            rows={3}
                            className="w-full rounded-xl border border-[#E5EAF2] px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#9CA3AF] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-blue-100 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
                            Default Consultation Fee (LKR)
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm text-[#6B7280] font-medium pointer-events-none">
                              Rs.
                            </span>
                            <input
                              type="number"
                              name="consultation_fee"
                              value={settings.consultation_fee}
                              onChange={handleChange}
                              placeholder="1000"
                              min="0"
                              step="50"
                              className="w-full rounded-xl border border-[#E5EAF2] pl-11 pr-4 py-2.5 text-sm text-[#0F172A] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-blue-100"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
                            Emergency Hotline
                          </label>
                          <input
                            type="text"
                            name="emergency_phone"
                            value={settings.emergency_phone || ""}
                            onChange={handleChange}
                            placeholder="e.g. 055 999 1111"
                            className="w-full rounded-xl border border-[#E5EAF2] px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#9CA3AF] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "hours" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-[#0F172A]">Business Hours</h2>
                        <p className="text-sm text-[#6B7280]">
                          Define standard operating hours and working days. Receptionists will use these guidelines to coordinate queue lists.
                        </p>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
                            Opening Time
                          </label>
                          <input
                            type="time"
                            name="open_time"
                            value={settings.open_time}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[#E5EAF2] px-4 py-2.5 text-sm text-[#0F172A] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-blue-100"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
                            Closing Time
                          </label>
                          <input
                            type="time"
                            name="close_time"
                            value={settings.close_time}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[#E5EAF2] px-4 py-2.5 text-sm text-[#0F172A] outline-none transition focus:border-[#1A73E8] focus:ring-4 focus:ring-blue-100"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-3">
                            Operational Weekdays
                          </label>
                          <div className="flex flex-wrap gap-2.5">
                            {weekdays.map((day) => {
                              const activeDays = settings.open_days
                                ? settings.open_days.split(",").filter(Boolean)
                                : [];
                              const isSelected = activeDays.includes(day.value);

                              return (
                                <button
                                  type="button"
                                  key={day.value}
                                  onClick={() => handleDayToggle(day.value)}
                                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition cursor-pointer ${
                                    isSelected
                                      ? "bg-[#1A73E8] border-[#1A73E8] text-white shadow-sm"
                                      : "bg-white border-[#E5EAF2] text-[#6B7280] hover:bg-[#FAFBFF] hover:text-[#0F172A]"
                                  }`}
                                >
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="bg-[#FAFBFF] border-t border-[#E5EAF2] px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1A73E8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 hover:shadow disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <i className="ti ti-loader-2 animate-spin text-lg" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-device-floppy text-lg" />
                        Save Settings
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ClinicSettings;
