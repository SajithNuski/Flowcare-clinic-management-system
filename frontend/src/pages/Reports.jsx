import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { getReports } from "../api/admin";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [preset, setPreset] = useState("this_month");
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [doctorId, setDoctorId] = useState("0");

  const [reportsData, setReportsData] = useState(null);
  const [generatedAt, setGeneratedAt] = useState("");

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        preset,
        doctor_id: doctorId,
      };
      if (preset === "custom") {
        params.date_from = dateFrom;
        params.date_to = dateTo;
      }

      const res = await getReports(params);
      if (res?.success && res.reports) {
        setReportsData(res.reports);
        setGeneratedAt(new Date().toLocaleString());
        setError("");
      } else {
        setError(res?.error || "Failed to load report analytics.");
        setReportsData(null);
      }
    } catch (err) {
      setError("Error connecting to server.");
      setReportsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [preset, doctorId]);

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (preset === "custom") {
      fetchReportData();
    }
  };

  const apptStats = reportsData?.appointment_stats || {};
  const revStats = reportsData?.revenue_stats || {};
  const docPerf = reportsData?.doctor_performance || [];
  const demographics = reportsData?.demographics || {};
  const doctorsList = reportsData?.doctors_list || [];
  const clinicInfo = reportsData?.clinic_info || {};

  const selectedDoctorObj = doctorsList.find(
    (d) => String(d.id) === String(doctorId)
  );
  const activeDoctorName = selectedDoctorObj
    ? `${selectedDoctorObj.full_name} (${selectedDoctorObj.specialisation})`
    : "All Doctors";

  const formatCurrency = (value) =>
    `Rs. ${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatPresetLabel = (p) => {
    switch (p) {
      case "today":
        return "Today";
      case "this_week":
        return "This Week";
      case "this_month":
        return "This Month";
      case "last_30_days":
        return "Last 30 Days";
      case "this_year":
        return "This Year";
      case "custom":
        return "Custom Range";
      default:
        return "Selected Range";
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar hidden during print */}
      <div className="print:hidden">
        <Sidebar role="admin" activePage="Report" />
      </div>

      {/* ========================================================================= */}
      {/* 1. ON-SCREEN INTERACTIVE DASHBOARD (HIDDEN ON PRINT/PDF EXPORT) */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full print:hidden">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md">
                <i className="ti ti-chart-bar text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Admin Analytics & Executive Reports
                </h1>
                <p className="text-slate-500 text-sm">
                  Comprehensive clinic metrics: Appointment trends, Revenue analysis, Doctor performance & Demographics
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md text-xs font-bold transition cursor-pointer"
            >
              <i className="ti ti-file-download text-sm" />
              <span>Export PDF Report</span>
            </button>
            <button
              onClick={fetchReportData}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm text-xs font-semibold transition cursor-pointer"
            >
              <i className={`ti ti-refresh ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Timeframe Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider mr-1">
                Timeframe:
              </span>
              {[
                { id: "today", label: "Today" },
                { id: "this_week", label: "This Week" },
                { id: "this_month", label: "This Month" },
                { id: "last_30_days", label: "Last 30 Days" },
                { id: "this_year", label: "This Year" },
                { id: "custom", label: "Custom Range" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPreset(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    preset === item.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Doctor Filter Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Doctor:
              </span>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
              >
                <option value="0">All Doctors</option>
                {doctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.full_name} ({doc.specialisation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Date Pickers */}
          {preset === "custom" && (
            <form
              onSubmit={handleApplyCustomDates}
              className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs"
            >
              <div className="flex items-center gap-2">
                <label className="font-semibold text-slate-600">From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="font-semibold text-slate-600">To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition cursor-pointer"
              >
                Apply Range
              </button>
            </form>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm">
            <i className="ti ti-alert-circle text-lg" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Gathering report analytics & aggregations...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <i className="ti ti-cash text-xl" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(revStats.total_revenue)}
                </div>
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                    This Month: {formatCurrency(revStats.revenue_this_month)}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Appointments
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <i className="ti ti-calendar-stats text-xl" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {apptStats.total || 0}
                </div>
                <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                    {apptStats.completion_rate}% Completion Rate
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Patients Seen / Completed
                  </span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <i className="ti ti-user-check text-xl" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {apptStats.completed || 0}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Skipped / No-Shows: <strong className="text-amber-600">{apptStats.no_show || 0}</strong>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Registered Patients
                  </span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <i className="ti ti-users text-xl" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {demographics.total_registered_patients || 0}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Active patient accounts in FlowCare
                </div>
              </div>
            </div>

            {/* SECTION 1: APPOINTMENT TRENDS CHART */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <i className="ti ti-chart-line text-blue-600" />
                    Appointment Booking & Completion Trends
                  </h3>
                  <p className="text-xs text-slate-500">
                    Volume breakdown by status over selected timeframe
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span>Completed ({apptStats.completed || 0})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span>Booked ({apptStats.booked || 0})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-rose-500 rounded-full" />
                    <span>Cancelled ({apptStats.cancelled || 0})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-amber-500 rounded-full" />
                    <span>No-Show ({apptStats.no_show || 0})</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={apptStats.daily_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                    <Bar dataKey="booked" name="Booked" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#ef4444" />
                    <Bar dataKey="no_show" name="No-Show" stackId="a" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SECTION 2: REVENUE ANALYSIS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <i className="ti ti-cash-banknote text-emerald-600" />
                      Revenue Collections Trend
                    </h3>
                    <p className="text-xs text-slate-500">
                      Daily income gathered from consultation fees
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase font-bold">Total In Range</span>
                    <div className="text-lg font-black text-emerald-600">
                      {formatCurrency(revStats.total_revenue)}
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revStats.daily_trend || []}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRev)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <i className="ti ti-credit-card text-purple-600" />
                    Payment Method Split
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Income proportion by cash, card, or online methods
                  </p>

                  <div className="h-48 w-full flex items-center justify-center">
                    {revStats.by_payment_method?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revStats.by_payment_method}
                            dataKey="total_amount"
                            nameKey="payment_method"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={(entry) => `${entry.payment_method.toUpperCase()}`}
                          >
                            {revStats.by_payment_method.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => formatCurrency(val)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-xs text-slate-400 text-center">No payment data recorded in this period.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  {revStats.by_payment_method?.map((pm, idx) => (
                    <div key={pm.payment_method} className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-2 font-medium capitalize text-slate-700">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        {pm.payment_method} ({pm.count} txns)
                      </span>
                      <strong className="text-slate-900">{formatCurrency(pm.total_amount)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 3: DOCTOR PERFORMANCE TABLE */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <i className="ti ti-stethoscope text-indigo-600" />
                  Doctor Workload & Performance Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  Patient load, completed consultations, average turnaround duration, and skipped counts per doctor
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Doctor Name</th>
                      <th className="py-3 px-4">Specialization</th>
                      <th className="py-3 px-4 text-center">Patients Completed</th>
                      <th className="py-3 px-4 text-center">Avg Consult Duration</th>
                      <th className="py-3 px-4 text-center">Skipped / No-Shows</th>
                      <th className="py-3 px-4 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {docPerf.map((doc) => {
                      const docRev = revStats.by_doctor?.find((r) => Number(r.doctor_id) === Number(doc.doctor_id));
                      return (
                        <tr key={doc.doctor_id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {doc.doctor_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {doc.specialisation || "General Practitioner"}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                            {doc.completed_count}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold">
                              {doc.avg_duration_mins > 0 ? `${doc.avg_duration_mins} mins` : "N/A"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-amber-600">
                            {doc.no_show_count}
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                            {formatCurrency(docRev?.total_revenue || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 4: PATIENT DEMOGRAPHICS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <i className="ti ti-users-group text-blue-600" />
                  Patient Gender Distribution
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Breakdown of registered patients by gender
                </p>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographics.gender_distribution || []}
                        dataKey="total"
                        nameKey="gender"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.gender}: ${entry.total}`}
                      >
                        {demographics.gender_distribution?.map((entry, index) => (
                          <Cell key={`gender-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <i className="ti ti-chart-bar-popular text-indigo-600" />
                  Patient Age Demographics
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Registered patient distribution categorized into standard age brackets
                </p>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographics.age_distribution || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="age_group" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="total" name="Patients" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 2. DEDICATED CLEAN TEXT/TABLE PDF PRINT LAYOUT (ONLY VISIBLE ON PRINT/PDF) */}
      {/* ========================================================================= */}
      <div className="hidden print:block w-full p-8 bg-white text-slate-900 font-sans text-xs leading-relaxed">
        {/* DOCUMENT HEADER */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              {clinicInfo.clinic_name || "FLOWCARE CLINIC MANAGEMENT SYSTEM"}
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Official Executive Administrative Report
            </p>
            {clinicInfo.clinic_address && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Address: {clinicInfo.clinic_address} {clinicInfo.clinic_phone ? `| Phone: ${clinicInfo.clinic_phone}` : ""}
              </p>
            )}
          </div>

          <div className="text-right text-[11px] text-slate-600 space-y-1">
            <div>
              <strong>Report Date Range:</strong> {formatPresetLabel(preset)} (
              {reportsData?.date_from} to {reportsData?.date_to})
            </div>
            <div>
              <strong>Doctor Scope:</strong> {activeDoctorName}
            </div>
            <div>
              <strong>Generated On:</strong> {generatedAt || new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* SECTION 1: APPOINTMENT SUMMARY */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-3">
            1. Appointment Summary
          </h2>

          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="border border-slate-300 p-2 text-left">Appointment Status</th>
                <th className="border border-slate-300 p-2 text-center">Total Volume</th>
                <th className="border border-slate-300 p-2 text-right">Percentage / Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Booked / Confirmed</td>
                <td className="border border-slate-300 p-2 text-center">{apptStats.booked || 0}</td>
                <td className="border border-slate-300 p-2 text-right">
                  {apptStats.total > 0 ? ((apptStats.booked / apptStats.total) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Completed Consultations</td>
                <td className="border border-slate-300 p-2 text-center">{apptStats.completed || 0}</td>
                <td className="border border-slate-300 p-2 text-right">{apptStats.completion_rate || 0}%</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">Cancelled Appointments</td>
                <td className="border border-slate-300 p-2 text-center">{apptStats.cancelled || 0}</td>
                <td className="border border-slate-300 p-2 text-right">{apptStats.cancellation_rate || 0}%</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-medium">No-Show / Missed Visits</td>
                <td className="border border-slate-300 p-2 text-center">{apptStats.no_show || 0}</td>
                <td className="border border-slate-300 p-2 text-right">
                  {apptStats.total > 0 ? ((apptStats.no_show / apptStats.total) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-slate-300 p-2 text-slate-900">Total Scheduled Appointments</td>
                <td className="border border-slate-300 p-2 text-center text-slate-900">{apptStats.total || 0}</td>
                <td className="border border-slate-300 p-2 text-right text-slate-900">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 2: REVENUE SUMMARY */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-3">
            2. Revenue Summary
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="border border-slate-300 p-3 bg-slate-50">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Revenue (Selected Range)</div>
              <div className="text-base font-black text-slate-900 mt-0.5">{formatCurrency(revStats.total_revenue)}</div>
            </div>
            <div className="border border-slate-300 p-3 bg-slate-50">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Revenue Today</div>
              <div className="text-base font-black text-slate-900 mt-0.5">{formatCurrency(revStats.revenue_today)}</div>
            </div>
            <div className="border border-slate-300 p-3 bg-slate-50">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Revenue This Month</div>
              <div className="text-base font-black text-slate-900 mt-0.5">{formatCurrency(revStats.revenue_this_month)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Revenue by Doctor Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase">Revenue Breakdown by Doctor</h3>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-2 text-left">Doctor Name</th>
                    <th className="border border-slate-300 p-2 text-center">Txns</th>
                    <th className="border border-slate-300 p-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revStats.by_doctor?.map((doc) => (
                    <tr key={doc.doctor_id}>
                      <td className="border border-slate-300 p-2">{doc.doctor_name}</td>
                      <td className="border border-slate-300 p-2 text-center">{doc.transaction_count}</td>
                      <td className="border border-slate-300 p-2 text-right font-semibold">
                        {formatCurrency(doc.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Revenue by Payment Method Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase">Revenue Breakdown by Payment Method</h3>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-2 text-left">Payment Method</th>
                    <th className="border border-slate-300 p-2 text-center">Txns</th>
                    <th className="border border-slate-300 p-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {revStats.by_payment_method?.map((pm) => (
                    <tr key={pm.payment_method}>
                      <td className="border border-slate-300 p-2 capitalize font-medium">{pm.payment_method}</td>
                      <td className="border border-slate-300 p-2 text-center">{pm.count}</td>
                      <td className="border border-slate-300 p-2 text-right font-semibold">
                        {formatCurrency(pm.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 3: DOCTOR PERFORMANCE TABLE */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-3">
            3. Doctor Workload & Performance
          </h2>

          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="border border-slate-300 p-2 text-left">Doctor Name</th>
                <th className="border border-slate-300 p-2 text-left">Specialization</th>
                <th className="border border-slate-300 p-2 text-center">Patients Seen / Completed</th>
                <th className="border border-slate-300 p-2 text-center">Avg Consult Duration</th>
                <th className="border border-slate-300 p-2 text-center">Skipped / No-Shows</th>
                <th className="border border-slate-300 p-2 text-right">Total Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {docPerf.map((doc) => {
                const docRev = revStats.by_doctor?.find((r) => Number(r.doctor_id) === Number(doc.doctor_id));
                return (
                  <tr key={doc.doctor_id}>
                    <td className="border border-slate-300 p-2 font-bold">{doc.doctor_name}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">{doc.specialisation || "General"}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">{doc.completed_count}</td>
                    <td className="border border-slate-300 p-2 text-center">
                      {doc.avg_duration_mins > 0 ? `${doc.avg_duration_mins} mins` : "N/A"}
                    </td>
                    <td className="border border-slate-300 p-2 text-center">{doc.no_show_count}</td>
                    <td className="border border-slate-300 p-2 text-right font-bold">
                      {formatCurrency(docRev?.total_revenue || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SECTION 4: PATIENT DEMOGRAPHICS */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-1 mb-3">
            4. Patient Demographics Summary
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Gender Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase">Gender Breakdown</h3>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-2 text-left">Gender</th>
                    <th className="border border-slate-300 p-2 text-center">Patient Count</th>
                    <th className="border border-slate-300 p-2 text-right">Proportion</th>
                  </tr>
                </thead>
                <tbody>
                  {demographics.gender_distribution?.map((g) => {
                    const ratio = demographics.total_registered_patients > 0
                      ? ((g.total / demographics.total_registered_patients) * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={g.gender}>
                        <td className="border border-slate-300 p-2 font-medium">{g.gender}</td>
                        <td className="border border-slate-300 p-2 text-center">{g.total}</td>
                        <td className="border border-slate-300 p-2 text-right">{ratio}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Age Distribution Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase">Age Range Distribution</h3>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-300">
                    <th className="border border-slate-300 p-2 text-left">Age Bracket</th>
                    <th className="border border-slate-300 p-2 text-center">Patient Count</th>
                    <th className="border border-slate-300 p-2 text-right">Proportion</th>
                  </tr>
                </thead>
                <tbody>
                  {demographics.age_distribution?.map((a) => {
                    const ratio = demographics.total_registered_patients > 0
                      ? ((a.total / demographics.total_registered_patients) * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={a.age_group}>
                        <td className="border border-slate-300 p-2 font-medium">{a.age_group}</td>
                        <td className="border border-slate-300 p-2 text-center">{a.total}</td>
                        <td className="border border-slate-300 p-2 text-right">{ratio}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DOCUMENT FOOTER */}
        <div className="border-t border-slate-400 pt-3 text-center text-[10px] text-slate-500 font-medium">
          FlowCare Clinic Management System — Official Administrative Executive Report — Confidential & Proprietary
        </div>
      </div>
    </div>
  );
}
