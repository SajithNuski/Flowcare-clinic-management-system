import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import QueueRow from "../components/QueueRow";
import Modal from "../components/Modal";
import Badge from "../components/Badge";

import { getLiveQueue, checkinPatient } from "../api/queue";
import { getTodayAppointments, markNoShow } from "../api/appointments";
import { getDoctors } from "../api/doctors";
import { getReceptionistStats } from "../api/receptionist";
import { searchPatientByNic, searchPatients } from "../api/patients";
import { registerUser } from "../api/auth";

function ReceptionistDashboard() {
  const [stats, setStats] = useState({
    inQueue: 0,
    checkedInToday: 0,
    pendingArrival: 0,
    noShowsToday: 0,
  });
  const [liveQueue, setLiveQueue] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const todayStr = (() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  })();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Walk-in modal state
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinSearch, setWalkinSearch] = useState("");
  const [walkinResult, setWalkinResult] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [submittingWalkin, setSubmittingWalkin] = useState(false);

  // Patient Search states
  const [generalSearch, setGeneralSearch] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [searchDoctorIdMap, setSearchDoctorIdMap] = useState({});
  const [checkingInPatientId, setCheckingInPatientId] = useState(null);

  // Register Patient states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    full_name: "",
    nic: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
    password: "Password@123",
    confirm: "Password@123",
  });
  const [registeringPatient, setRegisteringPatient] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  };

  // Fetch all dashboard data
  const fetchDashboardData = async (showLoadingSpinner = false, date = null) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    const targetDate = date !== null ? date : selectedDate;
    try {
      const [statsRes, queueRes, appointmentsRes] = await Promise.all([
        getReceptionistStats(),
        getLiveQueue(),
        getTodayAppointments(targetDate),
      ]);

      if (statsRes?.success) {
        setStats(statsRes.stats);
      }

      if (Array.isArray(queueRes)) {
        setLiveQueue(queueRes);
      }

      if (appointmentsRes?.success) {
        console.log("TODAY APPOINTMENTS:", appointmentsRes.appointments);
        setTodayAppointments(appointmentsRes.appointments);
      }
    } catch (err) {
      console.error("Error fetching receptionist dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors (needed for the dropdown in walk-in modal)
  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      if (Array.isArray(res)) {
        setDoctors(res);
      } else if (res?.success && Array.isArray(res.doctors)) {
        setDoctors(res.doctors);
      }
    } catch (err) {
      console.error("Error fetching doctors", err);
    }
  };

  // Load doctors once on mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Fetch dashboard data on date change or interval
  useEffect(() => {
    fetchDashboardData(true, selectedDate);

    // Auto-refresh liveQueue and stats every 10 seconds
    const interval = setInterval(() => {
      fetchDashboardData(false, selectedDate);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  // Handle appointment check-in action
  const handleCheckin = async (patientId, doctorId, appointmentId) => {
    try {
      const res = await checkinPatient(patientId, doctorId, appointmentId);
      if (res?.success) {
        showToast("Patient checked in successfully!", "success");
        fetchDashboardData(false);
      } else {
        showToast(res?.error || "Failed to check-in patient.", "error");
      }
    } catch (err) {
      showToast("An error occurred during check-in.", "error");
    }
  };

  // Handle appointment no-show action
  const handleNoShow = async (appointmentId) => {
    try {
      const res = await markNoShow(appointmentId);
      if (res?.success) {
        showToast("Appointment marked as No-Show.", "success");
        fetchDashboardData(false);
      } else {
        showToast(res?.error || "Failed to mark as No-Show.", "error");
      }
    } catch (err) {
      showToast("An error occurred.", "error");
    }
  };

  // Search patient by NIC in walk-in modal
  const handleSearchPatient = async (e) => {
    e.preventDefault();
    if (!walkinSearch.trim()) {
      showToast("Please enter an NIC number.", "error");
      return;
    }

    setSearchingPatient(true);
    setWalkinResult(null);

    try {
      const res = await searchPatientByNic(walkinSearch.trim());
      if (res?.success && res.patient) {
        setWalkinResult(res.patient);
        showToast("Patient found!", "success");
      } else {
        setWalkinResult({ notFound: true });
        showToast("Patient not found.", "error");
      }
    } catch (err) {
      setWalkinResult({ notFound: true });
      showToast("Patient search failed.", "error");
    } finally {
      setSearchingPatient(false);
    }
  };

  // Add walk-in patient to queue
  const handleAddWalkinToQueue = async (e) => {
    e.preventDefault();
    if (!walkinResult || walkinResult.notFound) {
      showToast("No valid patient selected.", "error");
      return;
    }
    if (!selectedDoctorId) {
      showToast("Please select a doctor.", "error");
      return;
    }

    setSubmittingWalkin(true);
    try {
      const res = await checkinPatient(walkinResult.id, parseInt(selectedDoctorId), 0);
      if (res?.success) {
        showToast("Walk-in patient checked in successfully!", "success");
        // Reset and close modal
        setShowWalkinModal(false);
        setWalkinSearch("");
        setWalkinResult(null);
        setSelectedDoctorId("");
        // Refresh dashboard
        fetchDashboardData(false);
      } else {
        showToast(res?.error || "Failed to add walk-in to queue.", "error");
      }
    } catch (err) {
      showToast("An error occurred during queue check-in.", "error");
    } finally {
      setSubmittingWalkin(false);
    }
  };

  // Handle General Patient Search (top bar)
  const handleSearchGeneral = async (e) => {
    e.preventDefault();
    if (!generalSearch.trim()) {
      showToast("Please enter a name or NIC to search.", "error");
      return;
    }

    setSearchingPatients(true);
    try {
      const res = await searchPatients(generalSearch.trim());
      if (res?.success && res.patients) {
        setSearchResults(res.patients);
        setShowSearchModal(true);
        if (res.patients.length === 0) {
          showToast("No patients found.", "error");
        } else {
          showToast(`Found ${res.patients.length} patient(s).`, "success");
        }
      } else {
        showToast(res?.error || "Search failed.", "error");
      }
    } catch (err) {
      showToast("An error occurred during search.", "error");
    } finally {
      setSearchingPatients(false);
    }
  };

  // Handle checking in a patient from the search results modal
  const handleSearchCheckIn = async (patientId) => {
    const docId = searchDoctorIdMap[patientId];
    if (!docId) {
      showToast("Please select a doctor.", "error");
      return;
    }

    setCheckingInPatientId(patientId);
    try {
      const res = await checkinPatient(patientId, parseInt(docId), 0);
      if (res?.success) {
        showToast("Patient checked in successfully!", "success");
        setSearchDoctorIdMap((prev) => ({ ...prev, [patientId]: "" }));
        setShowSearchModal(false);
        setGeneralSearch("");
        fetchDashboardData(false);
      } else {
        showToast(res?.error || "Failed to check in patient.", "error");
      }
    } catch (err) {
      showToast("An error occurred during check-in.", "error");
    } finally {
      setCheckingInPatientId(null);
    }
  };

  // Handle registering new patient from modal
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (
      !registerForm.full_name ||
      !registerForm.nic ||
      !registerForm.dob ||
      !registerForm.gender ||
      !registerForm.phone ||
      !registerForm.email
    ) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    if (registerForm.dob && registerForm.dob > todayStr) {
      showToast("Date of Birth cannot be in the future.", "error");
      return;
    }

    setRegisteringPatient(true);
    try {
      const res = await registerUser({
        full_name: registerForm.full_name,
        nic: registerForm.nic,
        date_of_birth: registerForm.dob,
        gender: registerForm.gender,
        phone: registerForm.phone,
        email: registerForm.email,
        password: registerForm.password,
      });

      if (res?.success) {
        showToast("Patient registered successfully!", "success");
        setShowRegisterModal(false);
        
        // Auto check-in the registered patient
        const newPatientId = res.id || res.patient_id;
        
        // Pre-fill NIC and open walk-in check-in modal
        setWalkinSearch(registerForm.nic);
        setShowWalkinModal(true);
        setSearchingPatient(true);
        const searchRes = await searchPatientByNic(registerForm.nic);
        if (searchRes?.success && searchRes.patient) {
          setWalkinResult(searchRes.patient);
        } else if (newPatientId) {
          setWalkinResult({
            id: newPatientId,
            full_name: registerForm.full_name,
            nic: registerForm.nic,
          });
        }
        setSearchingPatient(false);
        
        // Reset register form
        setRegisterForm({
          full_name: "",
          nic: "",
          dob: "",
          gender: "",
          phone: "",
          email: "",
          password: "Password@123",
          confirm: "Password@123",
        });
      } else {
        showToast(res?.error || "Registration failed.", "error");
      }
    } catch (err) {
      showToast(err.message || "An error occurred during registration.", "error");
    } finally {
      setRegisteringPatient(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="receptionist" activePage="Dashboard" />
      
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header and Title */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight text-[#1A73E8]">Receptionist Desk</h1>
            <p className="text-slate-500 text-xs mt-0.5">Manage daily appointments, patient check-ins, and live waiting room queue</p>
          </div>

          {/* Middle: Patient Search Bar */}
          <div className="flex-1 max-w-md mx-0 lg:mx-4">
            <form onSubmit={handleSearchGeneral} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ti ti-search text-slate-400" />
              </div>
              <input
                type="text"
                value={generalSearch}
                onChange={(e) => setGeneralSearch(e.target.value)}
                placeholder="Search patient by Name or NIC..."
                className="w-full pl-9 pr-20 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800"
              />
              <button
                type="submit"
                disabled={searchingPatients}
                className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:bg-blue-400"
              >
                {searchingPatients ? "..." : "Search"}
              </button>
            </form>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWalkinModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <i className="ti ti-circle-plus text-base" /> Walk-in Patient
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <i className="ti ti-user-plus text-base" /> Register Patient
            </button>
          </div>
        </div>

        {/* Toast Alert overlay */}
        {toast.message && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 ${toast.type === "error" ? "bg-red-500 animate-bounce" : "bg-green-500 animate-pulse"}`}>
            <i className={toast.type === "error" ? "ti ti-alert-circle text-lg" : "ti ti-circle-check text-lg"} />
            <span className="font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Loading state indicator */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* 1. STAT CARDS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="In queue now"
                value={stats.inQueue}
                icon="ti ti-users text-blue-600 text-lg"
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                label="Checked in today"
                value={stats.checkedInToday}
                icon="ti ti-user-check text-green-600 text-lg"
                color="bg-green-50 text-green-600"
              />
              <StatCard
                label="Pending arrival"
                value={stats.pendingArrival}
                icon="ti ti-clock text-amber-600 text-lg"
                color="bg-amber-50 text-amber-600"
              />
              <StatCard
                label="No-shows today"
                value={stats.noShowsToday}
                icon="ti ti-user-x text-red-600 text-lg"
                color="bg-red-50 text-red-600"
              />
            </div>

            {/* 2. TWO COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT — Live Queue card */}
              <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Live queue</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue#</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Check-in</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {liveQueue.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-8 text-slate-400 text-sm font-medium">
                            No patients in queue currently.
                          </td>
                        </tr>
                      ) : (
                        liveQueue.map((entry) => (
                          <QueueRow key={entry.queue_id} entry={entry} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <i className="ti ti-refresh animate-spin-slow" /> Refreshing every 10s
                </p>
              </div>

              {/* RIGHT — Today's appointments card */}
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Appointments</h2>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <Link
                    to="/receptionist/appointments"
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-xs font-semibold tracking-wide transition-all self-start sm:self-auto"
                  >
                    Book new
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {todayAppointments.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-slate-400 text-sm font-medium">
                            {selectedDate === (() => {
                              const today = new Date();
                              const offset = today.getTimezoneOffset();
                              const localDate = new Date(today.getTime() - (offset * 60 * 1000));
                              return localDate.toISOString().split('T')[0];
                            })()
                              ? "No appointments scheduled for today." 
                              : `No appointments scheduled for ${selectedDate}.`}
                          </td>
                        </tr>
                      ) : (
                        todayAppointments.map((appointment) => {
                          const isConfirmed = appointment.status === "confirmed" || appointment.status === "rescheduled";
                          const isCompleted = appointment.status === "completed";
                          const isNoShow = appointment.status === "no_show";
                          const isCancelled = appointment.status === "cancelled";

                          return (
                            <tr key={appointment.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm">
                                <div className="font-semibold text-slate-900">{appointment.patient_name}</div>
                                <div className="text-slate-400 text-xs">{appointment.patient_phone}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 font-semibold">
                                {appointment.time_slot}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="text-slate-800 font-semibold">{appointment.doctor_name}</div>
                                <div className="text-slate-400 text-xs">{appointment.specialisation}</div>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {isCompleted ? (
                                  <Badge text="Done" color="gray" />
                                ) : isNoShow ? (
                                  <Badge text="No Show" color="red" />
                                ) : isCancelled ? (
                                  <Badge text="Cancelled" color="red" />
                                ) : (
                                  <Badge text={appointment.status} color="blue" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {isConfirmed && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleCheckin(appointment.patient_id, appointment.doctor_id, appointment.id)}
                                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-semibold transition-colors"
                                    >
                                      Check in
                                    </button>
                                    <button
                                      onClick={() => handleNoShow(appointment.id)}
                                      className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold transition-colors"
                                    >
                                      No-show
                                    </button>
                                  </div>
                                )}
                                {(isNoShow || isCancelled) && (
                                  <span className="text-xs text-slate-400 italic font-medium">No actions</span>
                                )}
                                {isCompleted && (
                                  <span className="text-xs text-slate-400 italic font-medium">No actions</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </>
        )}
      </main>

      {/* 3. WALK-IN MODAL */}
      <Modal
        isOpen={showWalkinModal}
        onClose={() => {
          setShowWalkinModal(false);
          setWalkinSearch("");
          setWalkinResult(null);
          setSelectedDoctorId("");
        }}
        title="Walk-in Check-in"
      >
        <form onSubmit={handleSearchPatient} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Search Patient by NIC
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={walkinSearch}
                onChange={(e) => setWalkinSearch(e.target.value)}
                placeholder="e.g. 891234567V or 198912345678"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={searchingPatient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors disabled:bg-blue-400"
              >
                {searchingPatient ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </form>

        {walkinResult && !walkinResult.notFound && (
          <div className="mt-6 space-y-4 border-t border-slate-100 pt-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500 uppercase font-semibold">Selected Patient</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {walkinResult.full_name} — NIC {walkinResult.nic}
              </div>
            </div>

            <form onSubmit={handleAddWalkinToQueue} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Select Doctor
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc.doctor_id} value={doc.doctor_id}>
                      {doc.full_name} ({doc.specialisation || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingWalkin}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors disabled:bg-blue-400"
              >
                {submittingWalkin ? "Adding to Queue..." : "Add to queue"}
              </button>
            </form>
          </div>
        )}

        {walkinResult && walkinResult.notFound && (
          <div className="mt-6 text-center py-4 border-t border-slate-100 pt-4">
            <p className="text-sm text-red-600 mb-2 font-semibold">Patient not found.</p>
            <button
              type="button"
              onClick={() => {
                setShowWalkinModal(false);
                setShowRegisterModal(true);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-bold underline transition-colors cursor-pointer"
            >
              Register new patient
            </button>
          </div>
        )}
      </Modal>

      {/* 4. GENERAL PATIENT SEARCH RESULTS MODAL */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => {
          setShowSearchModal(false);
          setSearchResults([]);
        }}
        title="Patient Search Results"
      >
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {searchResults.length === 0 ? (
            <div className="text-center py-6 text-slate-400 font-medium">
              No patients found matching "{generalSearch}".
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {searchResults.map((pat) => (
                <div key={pat.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{pat.full_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">NIC: {pat.nic} | Phone: {pat.phone || 'N/A'}</p>
                      <p className="text-xs text-slate-400">Email: {pat.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row items-end gap-3 justify-between">
                    <div className="w-full sm:flex-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Select Doctor for Queue Check-In
                      </label>
                      <select
                        value={searchDoctorIdMap[pat.id] || ""}
                        onChange={(e) => setSearchDoctorIdMap(prev => ({ ...prev, [pat.id]: e.target.value }))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800"
                      >
                        <option value="">-- Select Doctor --</option>
                        {doctors.map((doc) => (
                          <option key={doc.doctor_id} value={doc.doctor_id}>
                            {doc.full_name} ({doc.specialisation || "General"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleSearchCheckIn(pat.id)}
                      disabled={checkingInPatientId === pat.id}
                      className="w-full sm:w-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors disabled:bg-blue-400 shrink-0 cursor-pointer"
                    >
                      {checkingInPatientId === pat.id ? "Checking in..." : "Check-in Patient"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* 5. REGISTER PATIENT MODAL */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);
          setRegisterForm({
            full_name: "",
            nic: "",
            dob: "",
            gender: "",
            phone: "",
            email: "",
            password: "Password@123",
            confirm: "Password@123",
          });
        }}
        title="Register New Patient"
      >
        <form onSubmit={handleRegisterPatient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={registerForm.full_name}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter full legal name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIC Number *
              </label>
              <input
                type="text"
                required
                value={registerForm.nic}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, nic: e.target.value }))}
                placeholder="e.g. 199512345678 or 951234567V"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={registerForm.dob}
                max={todayStr}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, dob: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender *
              </label>
              <select
                required
                value={registerForm.gender}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={registerForm.phone}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. 0771234567"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={registerForm.email}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="name@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="text"
                required
                value={registerForm.password}
                onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800"
              />
            </div>
            <div className="flex items-end">
              <p className="text-[11px] text-slate-500 leading-normal mb-1">
                A default password is pre-filled for convenience. The patient can change it later.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowRegisterModal(false);
                setRegisterForm({
                  full_name: "",
                  nic: "",
                  dob: "",
                  gender: "",
                  phone: "",
                  email: "",
                  password: "Password@123",
                  confirm: "Password@123",
                });
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registeringPatient}
              className="px-4 py-2 bg-[#10B981] hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:bg-emerald-400 cursor-pointer"
            >
              {registeringPatient ? "Registering..." : "Register & Check-in"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ReceptionistDashboard;
