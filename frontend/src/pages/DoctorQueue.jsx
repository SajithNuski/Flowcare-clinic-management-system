import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { getLiveQueue, callNextPatient, completeConsultation, markQueueNoShow } from "../api/queue";
import { getPatientMedicalHistory } from "../api/consultations";

export default function DoctorQueue() {
  const { user } = useAuth();

  // Queue state
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Modal states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSkipConfirmModal, setShowSkipConfirmModal] = useState(false);

  // Selected patient data for modals
  const [activePatient, setActivePatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Consultation form fields
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [referral, setReferral] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Secondary section toggle
  const [showHistorySection, setShowHistorySection] = useState(false);

  const showToastMsg = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  };

  // Helper to parse time string to minutes for accurate effective-time sorting
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 99999;
    const match = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    if (!match) return 99999;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3] ? match[3].toUpperCase() : null;

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const parseCheckInToMinutes = (checkInTimeStr) => {
    if (!checkInTimeStr) return 99999;
    try {
      const d = new Date(checkInTimeStr.replace(/-/g, "/"));
      return d.getHours() * 60 + d.getMinutes();
    } catch (e) {
      return 99999;
    }
  };

  // Sort waiting patients using effective-time logic
  const getSortedWaitingPatients = (items) => {
    const waiting = items.filter((item) => item.status === "waiting");
    return waiting.sort((a, b) => {
      const timeA = a.appointment_time
        ? parseTimeToMinutes(a.appointment_time)
        : parseCheckInToMinutes(a.check_in_time);
      const timeB = b.appointment_time
        ? parseTimeToMinutes(b.appointment_time)
        : parseCheckInToMinutes(b.check_in_time);

      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return (a.queue_number || 0) - (b.queue_number || 0);
    });
  };

  const fetchQueueData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      // Pass all=true to fetch live waiting, in_consultation, completed, and skipped entries
      const res = await getLiveQueue(true);
      if (Array.isArray(res)) {
        setQueue(res);
        setError("");
      } else if (res?.error) {
        setError(res.error);
      } else {
        setQueue([]);
      }
    } catch (err) {
      setError("Failed to fetch queue data.");
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData(true);
    // Poll for live queue updates every 8 seconds
    const interval = setInterval(() => {
      fetchQueueData(false);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter queue into status groups
  const inProgressPatient = queue.find((item) => item.status === "in_consultation");
  const sortedWaitingList = getSortedWaitingPatients(queue);
  const completedPatients = queue.filter((item) => item.status === "completed");
  const skippedPatients = queue.filter((item) => item.status === "no_show");

  // Format check-in time helper
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      const d = new Date(timeStr.replace(/-/g, "/"));
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch (e) {
      return timeStr;
    }
  };

  // Helper for effective time details
  const getEffectiveTimeInfo = (patient) => {
    if (patient.appointment_time) {
      return {
        label: "Appointment",
        time: patient.appointment_time,
        badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
        icon: "ti ti-calendar-event"
      };
    }
    return {
      label: "Walk-in",
      time: formatTime(patient.check_in_time),
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
      icon: "ti ti-walk"
    };
  };

  // Start consultation with next patient (manual call if no active patient)
  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const res = await callNextPatient();
      if (res?.success) {
        showToastMsg(`Now calling ${res.patient?.patient_name || 'next patient'}.`, "success");
        await fetchQueueData(false);
      } else {
        showToastMsg(res?.error || "No waiting patients in queue.", "error");
      }
    } catch (err) {
      showToastMsg("Error advancing queue.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Complete modal
  const handleOpenCompleteModal = (patient) => {
    setActivePatient(patient);
    setDiagnosis("General Consultation");
    setNotes("Patient examined. Consultation completed.");
    setReferral("");
    setShowCompleteModal(true);
  };

  // Submit complete consultation
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!activePatient) return;
    setActionLoading(true);

    try {
      const res = await completeConsultation({
        queue_id: activePatient.queue_id,
        patient_id: activePatient.patient_id,
        appointment_id: activePatient.appointment_id || 0,
        diagnosis: diagnosis.trim() || "General Consultation",
        notes: notes.trim() || "Consultation completed.",
        referral: referral.trim()
      });

      if (res?.success) {
        setShowCompleteModal(false);
        showToastMsg(
          `Completed consultation for ${activePatient.patient_name}.${
            res.next_patient ? ` Now seeing ${res.next_patient.patient_name}.` : ""
          }`,
          "success"
        );
        await fetchQueueData(false);
      } else {
        showToastMsg(res?.error || "Failed to complete consultation.", "error");
      }
    } catch (err) {
      showToastMsg("An error occurred while completing consultation.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Skip action
  const handleSkipPatient = async () => {
    if (!inProgressPatient) return;
    setActionLoading(true);

    try {
      const res = await markQueueNoShow(inProgressPatient.queue_id);
      if (res?.success) {
        setShowSkipConfirmModal(false);
        showToastMsg(
          `Skipped patient ${inProgressPatient.patient_name}.${
            res.next_patient ? ` Now seeing ${res.next_patient.patient_name}.` : ""
          }`,
          "info"
        );
        await fetchQueueData(false);
      } else {
        showToastMsg(res?.error || "Failed to skip patient.", "error");
      }
    } catch (err) {
      showToastMsg("An error occurred while skipping patient.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch and show medical history
  const handleOpenHistory = async (patient) => {
    setActivePatient(patient);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await getPatientMedicalHistory(patient.patient_id);
      if (res?.success) {
        setPatientHistory(res.consultations || []);
      } else {
        setPatientHistory([]);
      }
    } catch (err) {
      setPatientHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar role="doctor" activePage="My Queue" />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Toast Notification */}
        {toast.message && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all transform animate-bounce ${
              toast.type === "error"
                ? "bg-rose-600"
                : toast.type === "info"
                ? "bg-amber-600"
                : "bg-emerald-600"
            }`}
          >
            <i className={`ti ${toast.type === "error" ? "ti-alert-circle" : "ti-check"}`} />
            <span>{toast.message}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <i className="ti ti-list-numbers text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Consultation Queue</h1>
                <p className="text-slate-500 text-sm">
                  Logged in as <span className="font-semibold text-slate-700">{user?.full_name || "Doctor"}</span> • Exclusive Queue Scope
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchQueueData(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm text-sm font-medium transition"
            >
              <i className={`ti ti-refresh ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm">
            <i className="ti ti-alert-circle text-lg" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading your queue...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SECTION 1: CURRENT ACTIVE PATIENT */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <i className="ti ti-user-check text-blue-600" />
                  <span>Current Active Patient</span>
                </h2>
                {inProgressPatient && (
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold uppercase tracking-wider">
                    In Consultation
                  </span>
                )}
              </div>

              {inProgressPatient ? (
                (() => {
                  const effInfo = getEffectiveTimeInfo(inProgressPatient);
                  return (
                    <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-blue-800">
                      {/* Decorative background circle */}
                      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                        {/* Patient info column */}
                        <div className="space-y-4 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3.5 py-1.5 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-lg text-sm font-bold tracking-wide">
                              Ticket #{inProgressPatient.queue_number ? String(inProgressPatient.queue_number).padStart(2, '0') : "00"}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${effInfo.badgeClass}`}>
                              <i className={effInfo.icon} />
                              {effInfo.label}: {effInfo.time}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                              {inProgressPatient.patient_name}
                            </h3>
                            <p className="text-slate-300 text-sm mt-1 flex flex-wrap items-center gap-4">
                              <span><strong className="text-slate-400">Phone:</strong> {inProgressPatient.patient_phone || "N/A"}</span>
                              {inProgressPatient.patient_nic && <span><strong className="text-slate-400">NIC:</strong> {inProgressPatient.patient_nic}</span>}
                              {inProgressPatient.gender && <span><strong className="text-slate-400">Gender:</strong> {inProgressPatient.gender}</span>}
                            </p>
                          </div>

                          <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                              <i className="ti ti-clock-check text-blue-400" />
                              <span>Checked in: {formatTime(inProgressPatient.check_in_time)}</span>
                            </div>
                            <button
                              onClick={() => handleOpenHistory(inProgressPatient)}
                              className="flex items-center gap-1.5 bg-blue-600/40 hover:bg-blue-600/60 text-blue-100 border border-blue-400/40 px-3 py-1.5 rounded-lg backdrop-blur-sm transition font-medium cursor-pointer"
                            >
                              <i className="ti ti-file-text" />
                              <span>View Medical Record / History</span>
                            </button>
                          </div>
                        </div>

                        {/* Action buttons column */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px]">
                          <button
                            onClick={() => handleOpenCompleteModal(inProgressPatient)}
                            disabled={actionLoading}
                            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
                          >
                            <i className="ti ti-circle-check text-xl" />
                            <span>Complete Patient</span>
                          </button>

                          <button
                            onClick={() => setShowSkipConfirmModal(true)}
                            disabled={actionLoading}
                            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40 rounded-xl font-semibold transition disabled:opacity-50 cursor-pointer"
                          >
                            <i className="ti ti-player-skip-forward text-lg" />
                            <span>Skip Patient</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* No active patient in consultation */
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold shrink-0">
                      <i className="ti ti-chair-director" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">No Patient Currently In Consultation</h3>
                      <p className="text-slate-500 text-sm mt-0.5">
                        {sortedWaitingList.length > 0
                          ? `There are ${sortedWaitingList.length} patient(s) waiting in your queue.`
                          : "No patients waiting right now."}
                      </p>
                    </div>
                  </div>

                  {sortedWaitingList.length > 0 && (
                    <button
                      onClick={handleCallNext}
                      disabled={actionLoading}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer"
                    >
                      <i className="ti ti-[#3b82f6] ti-bell-ringing text-xl animate-bounce" />
                      <span>Start Consultation with Next Patient</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: WAITING LIST */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Waiting Patients List</h2>
                  <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">
                    {sortedWaitingList.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Ordered by Appointment Slot Time / Walk-in Check-in Time
                </p>
              </div>

              {sortedWaitingList.length === 0 ? (
                /* SECTION 6: EMPTY STATE WHEN NO WAITING AND NO ACTIVE */
                !inProgressPatient ? (
                  <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                      <i className="ti ti-user-check" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">No patients in queue</h3>
                    <p className="text-slate-500 max-w-md mx-auto text-sm">
                      Your queue is completely clear. Newly checked-in patients for your consultation will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-6 border border-slate-200 text-center text-slate-500 text-sm">
                    No remaining patients in the waiting list.
                  </div>
                )
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-3.5 px-4">Position</th>
                          <th className="py-3.5 px-4">Ticket</th>
                          <th className="py-3.5 px-4">Patient Name</th>
                          <th className="py-3.5 px-4">Queue Type</th>
                          <th className="py-3.5 px-4">Effective Slot / Time</th>
                          <th className="py-3.5 px-4">Check-in Time</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {sortedWaitingList.map((patient, index) => {
                          const effInfo = getEffectiveTimeInfo(patient);
                          return (
                            <tr key={patient.queue_id} className="hover:bg-slate-50/80 transition">
                              <td className="py-4 px-4 font-bold text-slate-500">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                                  #{index + 1}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-900">
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md font-mono text-xs">
                                  #{patient.queue_number ? String(patient.queue_number).padStart(2, '0') : "00"}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-semibold text-slate-900">{patient.patient_name}</div>
                                {patient.patient_phone && (
                                  <div className="text-xs text-slate-400">{patient.patient_phone}</div>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${effInfo.badgeClass}`}>
                                  <i className={effInfo.icon} />
                                  {effInfo.label}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-800">
                                {effInfo.time}
                              </td>
                              <td className="py-4 px-4 text-slate-500 text-xs">
                                {formatTime(patient.check_in_time)}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <button
                                  onClick={() => handleOpenHistory(patient)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                                >
                                  <i className="ti ti-file-text" />
                                  <span>History</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 5: SKIPPED & COMPLETED PATIENTS (SECONDARY SECTION) */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowHistorySection(!showHistorySection)}
                className="flex items-center justify-between w-full p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                    <i className="ti ti-history text-lg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Today&apos;s Completed & Skipped Patients</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {completedPatients.length} seen today • {skippedPatients.length} skipped
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-xs font-semibold">{showHistorySection ? "Hide" : "Show"}</span>
                  <i className={`ti ${showHistorySection ? "ti-chevron-up" : "ti-chevron-down"} text-base`} />
                </div>
              </button>

              {showHistorySection && (
                <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4 divide-y divide-slate-100">
                  {completedPatients.length === 0 && skippedPatients.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No consultations completed or skipped today yet.</p>
                  ) : (
                    <>
                      {completedPatients.map((pt) => (
                        <div key={`comp-${pt.queue_id}`} className="py-3 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <div>
                              <span className="font-semibold text-slate-800">{pt.patient_name}</span>
                              <span className="text-xs text-slate-400 ml-2">Ticket #{pt.queue_number}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">
                              Completed: {formatTime(pt.completed_time || pt.check_in_time)}
                            </span>
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                              Completed
                            </span>
                          </div>
                        </div>
                      ))}

                      {skippedPatients.map((pt) => (
                        <div key={`skip-${pt.queue_id}`} className="py-3 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <div>
                              <span className="font-semibold text-slate-800">{pt.patient_name}</span>
                              <span className="text-xs text-slate-400 ml-2">Ticket #{pt.queue_number}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">
                              Skipped
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: COMPLETE CONSULTATION */}
      {showCompleteModal && activePatient && (
        <Modal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          title={`Complete Consultation — ${activePatient.patient_name}`}
        >
          <form onSubmit={handleCompleteSubmit} className="space-y-4 pt-2">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between">
              <span>Ticket #{activePatient.queue_number}</span>
              <span>Patient ID: #{activePatient.patient_id}</span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnosis</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Upper Respiratory Tract Infection"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Prescription & Clinical Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Enter doctor notes, prescribed medication, dosage..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Referral / Follow-up (Optional)</label>
              <input
                type="text"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                placeholder="e.g. Follow up in 1 week or refer to ENT"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? "Completing..." : "Complete & Call Next"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: CONFIRM SKIP PATIENT */}
      {showSkipConfirmModal && inProgressPatient && (
        <Modal
          isOpen={showSkipConfirmModal}
          onClose={() => setShowSkipConfirmModal(false)}
          title="Confirm Skip Patient"
        >
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-600">
              Are you sure you want to skip <strong className="text-slate-900">{inProgressPatient.patient_name}</strong> (Ticket #{inProgressPatient.queue_number})?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <i className="ti ti-info-circle mr-1" />
              Skipping will mark this entry as skipped/no-show and automatically call the next waiting patient in line.
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowSkipConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSkipPatient}
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? "Skipping..." : "Confirm Skip"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: MEDICAL HISTORY */}
      {showHistoryModal && activePatient && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title={`Medical Record — ${activePatient.patient_name}`}
        >
          <div className="space-y-4 pt-2">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 flex flex-wrap justify-between gap-2">
              <span>Patient: <strong>{activePatient.patient_name}</strong></span>
              {activePatient.patient_nic && <span>NIC: {activePatient.patient_nic}</span>}
              {activePatient.patient_phone && <span>Phone: {activePatient.patient_phone}</span>}
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <i className="ti ti-loader animate-spin text-2xl text-blue-600 mb-2 block mx-auto" />
                Loading medical records...
              </div>
            ) : patientHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No past medical history or consultation records found for this patient.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {patientHistory.map((item) => (
                  <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-sm shadow-sm">
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                      <span className="font-semibold text-slate-700">Doctor: {item.doctor_name || "Doctor"}</span>
                      <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase">Diagnosis</div>
                      <div className="font-bold text-slate-900">{item.diagnosis || "N/A"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase">Prescription / Clinical Notes</div>
                      <p className="text-slate-700 whitespace-pre-line text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                        {item.notes || "None"}
                      </p>
                    </div>
                    {item.referral && (
                      <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded-md">
                        <strong>Referral:</strong> {item.referral}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 flex justify-end border-t border-slate-200">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
