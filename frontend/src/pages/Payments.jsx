import { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import { getPaymentsHistory } from "../api/payments";
import { formatDate, formatTime } from "../utils/helpers";

function Payments() {
  const todayStr = (() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  })();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMethodFilter, setSelectedMethodFilter] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  };

  const fetchPayments = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await getPaymentsHistory(selectedDate);
      if (res?.success && Array.isArray(res.payments)) {
        setPayments(res.payments);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error("Error fetching payments history", err);
      showToast("Failed to load payments history.", "error");
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(true);
  }, [selectedDate]);

  const changeDateByDays = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    setSelectedDate(localDate.toISOString().split("T")[0]);
  };

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const patientMatch =
        p.patient_name?.toLowerCase().includes(q) ||
        p.patient_nic?.toLowerCase().includes(q) ||
        p.patient_phone?.includes(q);
      const doctorMatch = p.doctor_name?.toLowerCase().includes(q);
      const textMatch = q ? (patientMatch || doctorMatch) : true;

      const methodMatch = selectedMethodFilter
        ? p.payment_method?.toLowerCase() === selectedMethodFilter.toLowerCase()
        : true;

      return textMatch && methodMatch;
    });
  }, [payments, searchTerm, selectedMethodFilter]);

  // Calculate Stats
  const stats = useMemo(() => {
    let total = 0;
    let cash = 0;
    let card = 0;

    payments.forEach((p) => {
      const amt = parseFloat(p.amount) || 0;
      total += amt;
      if (p.payment_method?.toLowerCase() === "card") {
        card += amt;
      } else {
        cash += amt;
      }
    });

    return {
      total,
      cash,
      card,
      count: payments.length,
    };
  }, [payments]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar role="receptionist" activePage="Payments" />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Toast Alerts */}
        {toast.message && (
          <div
            className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white transition-all duration-300 ${
              toast.type === "error" ? "bg-red-500 animate-bounce" : "bg-green-500 animate-pulse"
            }`}
          >
            <i className={toast.type === "error" ? "ti ti-alert-circle text-lg" : "ti ti-circle-check text-lg"} />
            <span className="font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight text-[#1A73E8]">Billing & Payments</h1>
            <p className="text-slate-500 text-xs mt-1">Review transaction history, filter payments, and audit collected fees</p>
          </div>
        </div>

        {/* Date Navigation Widget */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 mb-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <i className="ti ti-chevron-left text-sm font-bold" />
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer ${
                selectedDate === todayStr ? "bg-blue-50 border-blue-200 text-[#1A73E8]" : ""
              }`}
            >
              Today
            </button>
            <button
              onClick={() => changeDateByDays(1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Next Day"
            >
              <i className="ti ti-chevron-right text-sm font-bold" />
            </button>
          </div>

          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="ti ti-calendar-event text-blue-600 text-lg" />
            <span>{formatDate(selectedDate)}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Go to Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Collected"
            value={`LKR ${stats.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            icon="ti ti-report-money text-blue-600 text-lg"
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Cash Transactions"
            value={`LKR ${stats.cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            icon="ti ti-cash text-[#10B981] text-lg"
            color="bg-emerald-50 text-[#10B981]"
          />
          <StatCard
            label="Card Transactions"
            value={`LKR ${stats.card.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            icon="ti ti-credit-card text-purple-600 text-lg"
            color="bg-purple-50 text-purple-600"
          />
          <StatCard
            label="Total Transactions"
            value={stats.count}
            icon="ti ti-receipt text-amber-600 text-lg"
            color="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Table Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ti ti-search text-slate-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient name, NIC, phone, doctor..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedMethodFilter}
                onChange={(e) => setSelectedMethodFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Payment Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>

              {(searchTerm || selectedMethodFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedMethodFilter("");
                  }}
                  className="px-3 py-2 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-slate-500 text-xs font-semibold">Loading payments history...</span>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3 text-lg">
                  <i className="ti ti-cash-off" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">No Payments Recorded</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                  {payments.length === 0
                    ? `No payments collected on ${formatDate(selectedDate)}.`
                    : "No records match your search or filter settings."}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Details</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Amount Paid</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Method</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Reference/Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredPayments.map((p) => {
                    const avatarInitials = p.patient_name
                      ? p.patient_name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase()
                      : "PT";
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
                              {avatarInitials}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{p.patient_name}</div>
                              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                NIC: {p.patient_nic} | Phone: {p.patient_phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-800">{p.doctor_name}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                          LKR {(parseFloat(p.amount) || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Badge
                            text={p.payment_method?.toUpperCase()}
                            color={p.payment_method?.toLowerCase() === "card" ? "purple" : "green"}
                          />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-xs font-semibold text-slate-700">
                            {formatDate(p.payment_date)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {formatTime(new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-500">
                          {p.notes || "N/A"}
                          {p.appointment_id && (
                            <span className="block text-[9px] text-[#1A73E8] font-bold mt-0.5">
                              Linked Appt: #{p.appointment_id}
                            </span>
                          )}
                          {p.queue_id && (
                            <span className="block text-[9px] text-emerald-600 font-bold">
                              Linked Queue: #{p.queue_id}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Payments;
