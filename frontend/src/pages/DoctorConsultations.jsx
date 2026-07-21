import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { getDoctorConsultations } from "../api/consultations";

export default function DoctorConsultations() {
  const { user } = useAuth();

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Selected Consultation for Detail Modal
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchConsultations = async (dateFilter = selectedDate) => {
    setLoading(true);
    try {
      const res = await getDoctorConsultations(dateFilter);
      if (res?.success) {
        setConsultations(res.consultations || []);
        setError("");
      } else {
        setError(res?.error || "Failed to load consultation history.");
        setConsultations([]);
      }
    } catch (err) {
      setError("Error connecting to server.");
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleClearDate = () => {
    setSelectedDate("");
  };

  // Filtered consultations
  const filteredConsultations = consultations.filter((c) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    const patientName = (c.patient_name || "").toLowerCase();
    const patientPhone = (c.patient_phone || "").toLowerCase();
    const patientNic = (c.patient_nic || "").toLowerCase();
    const diagnosis = (c.diagnosis || "").toLowerCase();
    const notes = (c.notes || "").toLowerCase();

    return (
      patientName.includes(search) ||
      patientPhone.includes(search) ||
      patientNic.includes(search) ||
      diagnosis.includes(search) ||
      notes.includes(search)
    );
  });

  // Calculate statistics
  const totalCount = consultations.length;
  const uniquePatientsCount = new Set(consultations.map((c) => c.patient_id)).size;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = consultations.filter(
    (c) => c.created_at && c.created_at.startsWith(todayStr)
  ).length;

  const handleOpenDetail = (consultation) => {
    setSelectedConsultation(consultation);
    setShowDetailModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr.replace(/-/g, "/"));
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar role="doctor" activePage="Consultations" />

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <i className="ti ti-notes text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Doctor Consultations & Records
                </h1>
                <p className="text-slate-500 text-sm">
                  Logged in as{" "}
                  <span className="font-semibold text-slate-700">
                    {user?.full_name || "Doctor"}
                  </span>{" "}
                  • View and search all historical patient visits & notes
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchConsultations(selectedDate)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm text-sm font-medium transition cursor-pointer"
            >
              <i className={`ti ti-refresh ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Records</span>
            </button>
          </div>
        </div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-2xl font-bold">
              <i className="ti ti-file-analytics" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Records
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-2xl font-bold">
              <i className="ti ti-users" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Unique Patients
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {uniquePatientsCount}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl text-2xl font-bold">
              <i className="ti ti-calendar-event" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Consultations Today
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{todayCount}</div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient name, NIC, phone, diagnosis, or notes..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                >
                  <i className="ti ti-x" />
                </button>
              )}
            </div>

            {/* Date Filter Input */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              {selectedDate && (
                <button
                  onClick={handleClearDate}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content List / Table */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm">
            <i className="ti ti-alert-circle text-lg" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading consultation records...</p>
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="ti ti-notes-off" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Consultations Found</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              {searchTerm || selectedDate
                ? "No consultation records match your active search filter or date."
                : "No completed consultation records found in the clinic database yet."}
            </p>
            {(searchTerm || selectedDate) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDate("");
                }}
                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredConsultations.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Patient & Diagnosis Header */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg text-xs tracking-wide">
                      {item.diagnosis || "General Consultation"}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <i className="ti ti-clock" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{item.patient_name}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                      {item.patient_phone && (
                        <span>
                          <strong className="text-slate-700">Phone:</strong> {item.patient_phone}
                        </span>
                      )}
                      {item.patient_nic && (
                        <span>
                          <strong className="text-slate-700">NIC:</strong> {item.patient_nic}
                        </span>
                      )}
                      {item.gender && (
                        <span>
                          <strong className="text-slate-700">Gender:</strong> {item.gender}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes Preview */}
                  {item.notes && (
                    <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                      <strong className="text-slate-700 font-semibold block mb-0.5">
                        Clinical Notes / Prescription:
                      </strong>
                      {item.notes}
                    </div>
                  )}

                  {item.referral && (
                    <div className="text-xs text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 font-medium">
                      <strong>Referral / Follow-up:</strong> {item.referral}
                    </div>
                  )}
                </div>

                {/* Right Action */}
                <div className="shrink-0 flex items-center md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
                  <button
                    onClick={() => handleOpenDetail(item)}
                    className="w-full md:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <i className="ti ti-eye text-sm" />
                    <span>View Full Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONSULTATION DETAIL MODAL */}
        {showDetailModal && selectedConsultation && (
          <Modal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            title={`Consultation Record — ${selectedConsultation.patient_name}`}
          >
            <div className="space-y-5 pt-2">
              {/* Header Box */}
              <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 rounded-xl shadow-md space-y-2">
                <div className="flex justify-between items-center text-xs text-blue-200 border-b border-blue-800 pb-2">
                  <span>Record ID: #{selectedConsultation.id}</span>
                  <span>{formatDate(selectedConsultation.created_at)}</span>
                </div>
                <h3 className="text-xl font-bold">{selectedConsultation.patient_name}</h3>
                <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                  {selectedConsultation.patient_phone && (
                    <span>Phone: {selectedConsultation.patient_phone}</span>
                  )}
                  {selectedConsultation.patient_nic && (
                    <span>NIC: {selectedConsultation.patient_nic}</span>
                  )}
                  {selectedConsultation.gender && (
                    <span>Gender: {selectedConsultation.gender}</span>
                  )}
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Diagnosis
                </label>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 font-bold text-sm">
                  {selectedConsultation.diagnosis || "General Consultation"}
                </div>
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Clinical Notes & Prescriptions
                </label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm whitespace-pre-line leading-relaxed">
                  {selectedConsultation.notes || "No notes recorded."}
                </div>
              </div>

              {/* Referral */}
              {selectedConsultation.referral && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Referral / Follow-up Notes
                  </label>
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-900 text-sm">
                    {selectedConsultation.referral}
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <i className="ti ti-printer" />
                  <span>Print Record</span>
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
