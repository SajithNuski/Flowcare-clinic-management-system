import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";

function AdminAppointments() {
  const { user: currentUser } = useAuth();

  // State variables
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState("");

  // Modal State
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Fetch all appointments from backend
  const fetchAppointments = async () => {
    try {
      setError("");
      const res = await fetch("/api/admin/appointments.php", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments || []);
      } else {
        setError(data.error || "Failed to load appointments list.");
      }
    } catch (err) {
      setError("An error occurred while connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  // Helper: Format time slot
  const formatTimeSlot = (timeString) => {
    if (!timeString) return "—";
    // Check if slot format is HH:MM (e.g. 09:00)
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${parts[1]} ${ampm}`;
    }
    return timeString;
  };

  // Helper: Format status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5 border border-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Confirmed
          </span>
        );
      case "completed":
        return (
          <span className="bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5 border border-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-rose-50 text-rose-700 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5 border border-rose-100">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      case "no_show":
        return (
          <span className="bg-amber-50 text-amber-700 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5 border border-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            No Show
          </span>
        );
      case "rescheduled":
        return (
          <span className="bg-purple-50 text-purple-700 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5 border border-purple-100">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Rescheduled
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5 border border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            {status}
          </span>
        );
    }
  };

  // Calculate stats counters
  const getStats = () => {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === "confirmed" || a.status === "rescheduled").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    const noShow = appointments.filter((a) => a.status === "no_show").length;

    return { total, confirmed, completed, cancelled, noShow };
  };

  const stats = getStats();

  // Filter appointments based on active tab and search query
  const filteredAppointments = appointments.filter((appointment) => {
    // 1. Status Filter
    if (activeTab === "confirmed" && appointment.status !== "confirmed" && appointment.status !== "rescheduled") return false;
    if (activeTab === "completed" && appointment.status !== "completed") return false;
    if (activeTab === "cancelled" && appointment.status !== "cancelled") return false;
    if (activeTab === "no_show" && appointment.status !== "no_show") return false;

    // 2. Search Query Filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const patientMatch = appointment.patient_name
      ? appointment.patient_name.toLowerCase().includes(query)
      : false;
    const doctorMatch = appointment.doctor_name
      ? appointment.doctor_name.toLowerCase().includes(query)
      : false;

    return patientMatch || doctorMatch;
  });

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleOpenDetailModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar role="admin" activePage="Appointments" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Appointments Directory</h1>
              <p className="text-sm text-slate-500 font-medium">Read-only oversight of all clinic bookings</p>
            </div>

            {/* Error Alerts */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm flex items-center justify-between bg-red-50 text-red-700 border border-red-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <i className="ti ti-alert-circle text-lg"></i>
                  <span className="font-semibold">{error}</span>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-500 hover:text-red-700 font-bold focus:outline-none cursor-pointer"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Total Booked */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Booked</span>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                    {loading ? "..." : stats.total}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                  <i className="ti ti-calendar text-xl" />
                </div>
              </div>

              {/* Card 2: Confirmed/Rescheduled */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmed</span>
                  <h3 className="text-2xl font-extrabold text-blue-600 mt-1">
                    {loading ? "..." : stats.confirmed}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <i className="ti ti-calendar-event text-xl" />
                </div>
              </div>

              {/* Card 3: Completed */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                  <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {loading ? "..." : stats.completed}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <i className="ti ti-circle-check text-xl" />
                </div>
              </div>

              {/* Card 4: Cancelled */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cancelled</span>
                  <h3 className="text-2xl font-extrabold text-rose-600 mt-1">
                    {loading ? "..." : stats.cancelled}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <i className="ti ti-calendar-cancel text-xl" />
                </div>
              </div>

              {/* Card 5: No Show */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No Show</span>
                  <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
                    {loading ? "..." : stats.noShow}
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <i className="ti ti-user-exclamation text-xl" />
                </div>
              </div>
            </div>

            {/* Filter controls and search field */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-[#1A73E8] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setActiveTab("confirmed")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === "confirmed"
                      ? "bg-[#1A73E8] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Confirmed ({stats.confirmed})
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === "completed"
                      ? "bg-[#1A73E8] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Completed ({stats.completed})
                </button>
                <button
                  onClick={() => setActiveTab("cancelled")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === "cancelled"
                      ? "bg-[#1A73E8] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Cancelled ({stats.cancelled})
                </button>
                <button
                  onClick={() => setActiveTab("no_show")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === "no_show"
                      ? "bg-[#1A73E8] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  No Show ({stats.noShow})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <i className="ti ti-search text-base" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient or doctor..."
                  className="border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-sm w-full lg:w-80 outline-none transition-all focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <i className="ti ti-x text-sm" />
                  </button>
                )}
              </div>
            </div>

            {/* Appointments Table Container */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(15,23,42,0.02)] overflow-hidden">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A73E8]"></div>
                  <span className="text-sm font-semibold text-slate-500">Loading appointments list...</span>
                </div>
              ) : currentAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-slate-300 text-6xl mb-4">
                    <i className="ti ti-calendar-off" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    We couldn't find any appointment matching the filters or query.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Patient Name</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Doctor Name</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Time Slot</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {currentAppointments.map((appointment) => (
                          <tr key={appointment.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Patient Name */}
                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                              {appointment.patient_name}
                            </td>

                            {/* Doctor Name */}
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-slate-800">{appointment.doctor_name}</div>
                              <div className="text-[10px] text-[#1A73E8] font-bold">{appointment.doctor_specialisation || "General"}</div>
                            </td>

                            {/* Date */}
                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                              {formatDate(appointment.appointment_date)}
                            </td>

                            {/* Time Slot */}
                            <td className="px-6 py-4 text-sm text-slate-800 font-bold">
                              {formatTimeSlot(appointment.time_slot)}
                            </td>

                            {/* Reason */}
                            <td className="px-6 py-4 text-xs text-slate-500 font-medium max-w-[200px] truncate">
                              {appointment.visit_reason}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              {getStatusBadge(appointment.status)}
                            </td>

                            {/* Action Buttons */}
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleOpenDetailModal(appointment)}
                                className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-[#1A73E8] hover:text-white hover:border-[#1A73E8] transition-all px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer focus:outline-none"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="text-xs text-slate-500 font-semibold">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredAppointments.length)} of{" "}
                      {filteredAppointments.length} appointments
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        <i className="ti ti-chevron-left mr-1" /> Previous
                      </button>
                      <span className="text-xs font-bold text-slate-700 px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        Next <i className="ti ti-chevron-right ml-1" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedAppointment(null);
        }}
        title="Appointment Overview"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            
            {/* Header / Status */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Appointment ID</h3>
                <span className="text-lg font-extrabold text-slate-800">#APT-{selectedAppointment.id}</span>
              </div>
              <div>
                {getStatusBadge(selectedAppointment.status)}
              </div>
            </div>

            {/* Content Details */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              {/* Patient Info */}
              <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h4 className="text-[10px] font-extrabold text-[#1A73E8] uppercase tracking-wider">Patient Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Full Name</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.patient_name}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">NIC Number</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.patient_nic || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Phone Number</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.patient_phone || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Email Address</span>
                    <span className="font-semibold text-slate-800 truncate block">{selectedAppointment.patient_email || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h4 className="text-[10px] font-extrabold text-[#1A73E8] uppercase tracking-wider">Assigned Doctor</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Doctor Name</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.doctor_name}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Specialisation</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.doctor_specialisation || "General Consultation"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Contact Phone</span>
                    <span className="font-semibold text-slate-800">{selectedAppointment.doctor_phone || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Date</span>
                <span className="font-bold text-slate-800">{formatDate(selectedAppointment.appointment_date)}</span>
              </div>
              
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Slot Session</span>
                <span className="font-bold text-slate-800">{formatTimeSlot(selectedAppointment.time_slot)}</span>
              </div>

              <div className="col-span-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Visit</span>
                <span className="font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 block mt-1 text-xs">
                  {selectedAppointment.visit_reason || "General Consultation"}
                </span>
              </div>

              <div className="col-span-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Additional Booking Notes</span>
                <span className="font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 block mt-1 leading-relaxed text-xs max-h-24 overflow-y-auto">
                  {selectedAppointment.notes || "No booking notes provided by the patient."}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booked On</span>
                <span className="font-medium text-slate-500 text-xs">{formatDate(selectedAppointment.created_at)}</span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAppointment(null);
                }}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Oversight View
              </button>
            </div>
            
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminAppointments;
