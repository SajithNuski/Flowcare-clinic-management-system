import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { getDoctorDashboardData } from "../api/doctors";
import { callNextPatient, completeConsultation } from "../api/queue";
import { useAuth } from "../context/AuthContext";

function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal state
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedQueueEntry, setSelectedQueueEntry] = useState(null);
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [referral, setReferral] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  };

  const fetchDashboardData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    try {
      const res = await getDoctorDashboardData();
      if (res?.success) {
        setDashboardData(res);
      } else {
        setError(res?.error || "Failed to load dashboard data");
      }
    } catch (err) {
      setError("An error occurred while fetching dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);

    // Auto-refresh queue and stats every 10 seconds
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleCallPatient = async () => {
    try {
      const res = await callNextPatient();
      if (res?.success) {
        showToast(`Called patient ${res.patient.patient_name} to consultation room.`, "success");
        fetchDashboardData(false);
      } else {
        showToast(res?.error || "No patients waiting in queue.", "error");
      }
    } catch (err) {
      showToast("An error occurred while calling the next patient.", "error");
    }
  };

  const handleOpenConsultation = (entry) => {
    setSelectedQueueEntry(entry);
    setNotes("");
    setDiagnosis("");
    setReferral("");
    setShowConsultationModal(true);
  };

  const handleCompleteConsultation = async (e) => {
    e.preventDefault();
    if (!selectedQueueEntry) return;
    if (!diagnosis.trim() || !notes.trim()) {
      showToast("Diagnosis and Prescription/Notes are required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await completeConsultation({
        queue_id: selectedQueueEntry.queue_id,
        patient_id: selectedQueueEntry.patient_id,
        diagnosis: diagnosis.trim(),
        notes: notes.trim(),
        referral: referral.trim()
      });

      if (res?.success) {
        showToast("Consultation completed and saved successfully!", "success");
        setShowConsultationModal(false);
        setSelectedQueueEntry(null);
        setNotes("");
        setDiagnosis("");
        setReferral("");
        fetchDashboardData(false);
      } else {
        showToast(res?.error || "Failed to complete consultation.", "error");
      }
    } catch (err) {
      showToast("An error occurred during submission.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format time slots or check-in times
  const formatTime = (timeString) => {
    if (!timeString) return "";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return timeString;
    }
  };

  // Helper to format check-in elapsed minutes
  const getElapsedMinutes = (checkInTime) => {
    if (!checkInTime) return "";
    try {
      const checkIn = new Date(checkInTime);
      const diffMs = new Date() - checkIn;
      const diffMins = Math.max(0, Math.floor(diffMs / 60000));
      return `${diffMins} mins in`;
    } catch (e) {
      return "";
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="doctor" activePage="Dashboard" />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </main>
      </div>
    );
  }

  const doctorName = dashboardData?.doctor?.full_name || user?.full_name || "Doctor";
  const specialisation = dashboardData?.doctor?.specialisation || "Medical Doctor";
  const stats = dashboardData?.stats || { total_patients: 0, appointments_today: 0, completed_today: 0 };
  const queue = dashboardData?.queue || [];
  const recentConsultations = dashboardData?.recent_consultations || [];
  const clinicInsights = dashboardData?.clinic_insights || { clinic_load: 0, patient_satisfaction: 4.8 };

  // Identify in_consultation entry and the first waiting entry
  const inConsultationEntry = queue.find(q => q.status === "in_consultation");
  const firstWaitingEntry = queue.find(q => q.status === "waiting");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="doctor" activePage="Dashboard" />

      {/* Toast Alert overlay */}
      {toast.message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 ${toast.type === "error" ? "bg-red-500 animate-bounce" : "bg-green-500 animate-pulse"}`}>
          <i className={toast.type === "error" ? "ti ti-alert-circle text-lg" : "ti ti-circle-check text-lg"} />
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col justify-between">
        <div>
          {/* Top Header */}
          <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Doctor Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800">{doctorName}</div>
                <div className="text-xs text-slate-500">{specialisation}</div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&h=150&q=80"
                alt="Doctor Profile"
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Total Patients Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 border-l-4 border-l-[#1372E6] flex flex-col justify-between">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</div>
              <div className="mt-2 text-4xl font-bold text-slate-900">{stats.total_patients}</div>
            </div>

            {/* Appointments Today Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Appointments Today</div>
                <div className="mt-2 text-4xl font-bold text-slate-900">{stats.appointments_today}</div>
              </div>
              <div className="mt-2 text-xs text-slate-400 font-medium">
                {stats.completed_today} completed
              </div>
            </div>
          </div>

          {/* Live Consultation Queue */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">Live Consultation Queue</h2>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
                <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
              </div>
            </div>

            <div className="space-y-4">
              {queue.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm font-medium">
                  No patients in queue currently.
                </div>
              ) : (
                queue.map((entry, index) => {
                  const isCurrent = entry.status === "in_consultation";
                  const isNext = !inConsultationEntry && entry.status === "waiting" && entry.queue_id === firstWaitingEntry?.queue_id;
                  
                  return (
                    <div
                      key={entry.queue_id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-blue-50/50 border-blue-200 shadow-sm"
                          : "bg-slate-50/50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Queue badge */}
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isCurrent
                              ? "bg-[#1372E6] text-white"
                              : "bg-blue-50 text-[#1372E6] border border-blue-100"
                          }`}
                        >
                          Q{entry.queue_number < 10 ? `0${entry.queue_number}` : entry.queue_number}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{entry.patient_name}</div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                            <span>Type: General Consultation</span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <i className="ti ti-clock" /> {getElapsedMinutes(entry.check_in_time)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 sm:mt-0 flex gap-2">
                        {isCurrent && (
                          <button
                            onClick={() => handleOpenConsultation(entry)}
                            className="px-4 py-2 bg-[#1372E6] text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-all shadow-sm shadow-blue-200"
                          >
                            Attend Patient
                          </button>
                        )}
                        {isNext && (
                          <button
                            onClick={handleCallPatient}
                            className="px-4 py-2 border border-[#1372E6] text-[#1372E6] hover:bg-blue-50 rounded-lg text-sm font-semibold transition-all"
                          >
                            Call Patient
                          </button>
                        )}
                        {!isCurrent && !isNext && (
                          <span className="text-xs text-slate-400 font-semibold px-3 py-1.5 bg-slate-100/80 rounded-lg">
                            Waiting
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Consultations Table */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Consultations</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Diagnosis</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prescription</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentConsultations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400 text-sm font-medium">
                        No recent consultations completed.
                      </td>
                    </tr>
                  ) : (
                    recentConsultations.map((consult) => (
                      <tr key={consult.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                          {formatTime(consult.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {consult.patient_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {consult.diagnosis}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 italic">
                          {consult.notes}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {consult.referral ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-50 text-pink-600 border border-pink-100">
                              Follow-up req
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clinic Insights & Wellness Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <h2 className="text-sm font-bold text-slate-800">Clinic Insights</h2>
              <div className="space-y-4 my-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Clinic Load</span>
                    <span>{clinicInsights.clinic_load}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1372E6] h-full rounded-full transition-all duration-500"
                      style={{ width: `${clinicInsights.clinic_load}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-semibold text-slate-500">Patient Satisfaction</span>
                  <span className="text-sm font-bold text-[#0B63D1]">{clinicInsights.patient_satisfaction}/5</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-gradient-to-r from-[#1372E6] to-[#0B63D1] rounded-xl p-6 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <i className="ti ti-heart-rate-monitor text-9xl text-white" />
              </div>
              <div>
                <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">FlowCare</span>
                <h3 className="text-xl font-bold mt-3">Wellness First Excellence</h3>
                <p className="mt-2 text-sm text-white/80 max-w-lg">
                  Providing state-of-the-art cardiovascular care at the heart of Badulla Medical Centre.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 pt-8 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <div className="font-bold text-[#1372E6] text-lg">FlowCare</div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Leading healthcare management system designed for medical professionals who prioritize precision and patient care.
              </p>
              <div className="text-xs text-slate-400 mt-4">
                © 2024 Badulla Medical Centre. All rights reserved.
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Legal</div>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:underline">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Support</div>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                <li><a href="#" className="hover:underline">FAQ</a></li>
                <li><a href="#" className="hover:underline">Contact Support</a></li>
              </ul>
            </div>
          </div>
        </footer>
      </main>

      {/* Consultation Diagnosis / Prescription Modal */}
      <Modal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        title={`Consultation: ${selectedQueueEntry?.patient_name}`}
      >
        <form onSubmit={handleCompleteConsultation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Diagnosis *
            </label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Mild Arrhythmia"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prescription / Treatment Notes *
            </label>
            <textarea
              required
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bisoprolol 2.5mg once daily. Rest for 3 days."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Referral / Follow-up Requirements (Optional)
            </label>
            <input
              type="text"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              placeholder="e.g. Cardiologist consult in 2 weeks"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowConsultationModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold transition-all disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Complete Consultation"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DoctorDashboard;
