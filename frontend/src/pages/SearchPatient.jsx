import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { searchPatients } from "../api/patients";
import { getDoctors } from "../api/doctors";
import { checkinPatient } from "../api/queue";
import { formatDate, calculateAge, getInitials } from "../utils/helpers";

export default function SearchPatient() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Doctors list for check-in modal
  const [doctors, setDoctors] = useState([]);

  // Selected Patient for Detail Modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Check-In Modal State
  const [checkinTarget, setCheckinTarget] = useState(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinDoctorId, setCheckinDoctorId] = useState("");
  const [checkinAmount, setCheckinAmount] = useState("1500.00");
  const [checkinPaymentMethod, setCheckinPaymentMethod] = useState("cash");
  const [checkinLoading, setCheckinLoading] = useState(false);

  const showToastMsg = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  };

  useEffect(() => {
    async function loadDoctors() {
      const res = await getDoctors();
      if (res?.success && Array.isArray(res.doctors)) {
        setDoctors(res.doctors);
        if (res.doctors.length > 0) {
          setCheckinDoctorId(res.doctors[0].id);
        }
      }
    }
    loadDoctors();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) {
      showToastMsg("Please enter a name, NIC, or phone number to search.", "error");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchPatients(q);
      if (res?.success && Array.isArray(res.patients)) {
        setPatients(res.patients);
      } else {
        setPatients([]);
      }
    } catch (err) {
      showToastMsg("Failed to execute search. Please check network connection.", "error");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckin = (patient) => {
    setCheckinTarget(patient);
    setShowCheckinModal(true);
  };

  const handleExecuteCheckin = async (e) => {
    e.preventDefault();
    if (!checkinTarget || !checkinDoctorId) {
      showToastMsg("Please select a doctor for queue check-in.", "error");
      return;
    }

    setCheckinLoading(true);
    try {
      const res = await checkinPatient(
        checkinTarget.id,
        parseInt(checkinDoctorId, 10),
        0, // walk-in, no appointment ID
        parseFloat(checkinAmount) || 0,
        checkinPaymentMethod
      );

      if (res?.success) {
        setShowCheckinModal(false);
        showToastMsg(
          `Patient ${checkinTarget.full_name} checked in successfully as Queue #${res.queue_number || res.queue_id}!`,
          "success"
        );
      } else {
        showToastMsg(res?.error || "Failed to check in patient.", "error");
      }
    } catch (err) {
      showToastMsg("An error occurred during queue check-in.", "error");
    } finally {
      setCheckinLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar role="receptionist" activePage="Search Patient" />

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* Toast Notification */}
        {toast.message && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
              toast.type === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            <i
              className={`ti ${
                toast.type === "error" ? "ti-alert-circle" : "ti-circle-check"
              } text-lg`}
            />
            {toast.message}
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <i className="ti ti-search text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Patient Search & Directory
                </h1>
                <p className="text-sm text-slate-500">
                  Quickly look up patient records, clinical history, and perform instant walk-in check-in.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <i className="ti ti-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                placeholder="Search by Patient Name, NIC, or Phone Number (e.g., 2001..., 077...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <i className="ti ti-x text-sm" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <i className="ti ti-loader-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <i className="ti ti-search" />
                  Search Patients
                </>
              )}
            </button>
          </form>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <i className="ti ti-info-circle text-sm" />
            <span>Tip: Enter partial or full National Identity Card (NIC) number, contact number, or full patient name.</span>
          </div>
        </div>

        {/* Search Results */}
        {loading ? (
          <LoadingSpinner message="Searching patient database..." />
        ) : hasSearched && patients.length === 0 ? (
          <EmptyState
            icon="ti ti-user-x"
            title="No matching patients found"
            description={`No registered patients found matching "${query}". Double check the spelling or NIC.`}
            actionLabel="Register New Patient"
            onAction={() => navigate("/receptionist/dashboard")}
          />
        ) : !hasSearched ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm">
              <i className="ti ti-address-book text-3xl" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Ready to Search Patient Directory
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Use the search bar above to look up any patient by their National Identity Card (NIC), full name, or phone number.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              <span>Matching Patients ({patients.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patients.map((patient) => {
                const age = calculateAge(patient.date_of_birth);
                return (
                  <div
                    key={patient.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Patient Top Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                            {getInitials(patient.full_name)}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 leading-tight">
                              {patient.full_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-medium text-slate-500">
                                NIC: <strong className="text-slate-700">{patient.nic}</strong>
                              </span>
                              <span className="text-slate-300">•</span>
                              <Badge
                                variant={patient.status === "active" ? "success" : "neutral"}
                              >
                                {patient.status || "active"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {patient.blood_group && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-200">
                            {patient.blood_group}
                          </span>
                        )}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <i className="ti ti-cake text-slate-400 text-sm" />
                          <span>
                            {formatDate(patient.date_of_birth)}{" "}
                            {age > 0 ? `(${age} yrs)` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <i className="ti ti-gender-intergender text-slate-400 text-sm" />
                          <span className="capitalize">{patient.gender || "Not specified"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <i className="ti ti-phone text-slate-400 text-sm" />
                          <span>{patient.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <i className="ti ti-mail text-slate-400 text-sm" />
                          <span className="truncate">{patient.email || "No email"}</span>
                        </div>
                      </div>

                      {/* Clinical Alerts / Tags */}
                      {(patient.allergies || patient.medical_history) && (
                        <div className="mt-3 p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs">
                          {patient.allergies && (
                            <div className="text-amber-800">
                              <strong className="font-semibold">Allergies:</strong> {patient.allergies}
                            </div>
                          )}
                          {patient.medical_history && (
                            <div className="text-slate-600 mt-1 line-clamp-1">
                              <strong className="font-semibold">History:</strong> {patient.medical_history}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowDetailModal(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        View Full Info
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenCheckin(patient)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                        >
                          <i className="ti ti-list-check" />
                          Check-in to Queue
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Patient Detail Modal */}
        {showDetailModal && selectedPatient && (
          <Modal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            title="Patient Clinical Profile"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  {getInitials(selectedPatient.full_name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedPatient.full_name}</h3>
                  <p className="text-xs text-slate-500">NIC: {selectedPatient.nic}</p>
                  <p className="text-xs text-slate-500">Phone: {selectedPatient.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 block">Date of Birth</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(selectedPatient.date_of_birth)} ({calculateAge(selectedPatient.date_of_birth)} years)
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 block">Gender</span>
                  <span className="font-semibold text-slate-800 capitalize">{selectedPatient.gender || "—"}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 block">Blood Group</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.blood_group || "Not recorded"}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 block">Emergency Contact</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.emergency_contact || "None"}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-1">
                  Allergies & Drug Reactions
                </span>
                <p className="text-slate-700">{selectedPatient.allergies || "No known allergies recorded."}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Chronic Medical History
                </span>
                <p className="text-slate-700">{selectedPatient.medical_history || "No medical history recorded."}</p>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Walk-in Queue Check-In Modal */}
        {showCheckinModal && checkinTarget && (
          <Modal
            isOpen={showCheckinModal}
            onClose={() => setShowCheckinModal(false)}
            title={`Walk-in Queue Check-In`}
          >
            <form onSubmit={handleExecuteCheckin} className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-sm">
                <span className="text-xs text-blue-600 font-medium block">Checking in:</span>
                <span className="font-bold text-blue-950 text-base">{checkinTarget.full_name}</span>
                <span className="text-xs text-blue-700 block mt-0.5">NIC: {checkinTarget.nic} • Phone: {checkinTarget.phone}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assign to Doctor *
                </label>
                <select
                  value={checkinDoctorId}
                  onChange={(e) => setCheckinDoctorId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.full_name} ({d.specialisation || "General Practitioner"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Consultation Fee (LKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={checkinAmount}
                    onChange={(e) => setCheckinAmount(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={checkinPaymentMethod}
                    onChange={(e) => setCheckinPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Credit / Debit Card</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkinLoading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {checkinLoading ? (
                    <>
                      <i className="ti ti-loader-2 animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check" />
                      Confirm & Issue Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}
