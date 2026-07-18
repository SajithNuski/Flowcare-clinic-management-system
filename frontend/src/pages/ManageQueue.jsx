import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Badge from "../components/Badge";
import { formatTime } from "../utils/helpers";
import { getLiveQueue, markQueueNoShow } from "../api/queue";
import { getDoctors } from "../api/doctors";

function ManageQueue() {
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoctorTab, setSelectedDoctorTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  };

  const fetchData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    try {
      const [queueRes, doctorsRes] = await Promise.all([
        getLiveQueue(true), // Fetch all statuses
        getDoctors(),
      ]);

      if (Array.isArray(queueRes)) {
        setQueue(queueRes);
      } else {
        setError("Failed to load queue data");
      }

      if (Array.isArray(doctorsRes)) {
        setDoctors(doctorsRes);
      } else if (doctorsRes?.success && Array.isArray(doctorsRes.doctors)) {
        setDoctors(doctorsRes.doctors);
      }
    } catch (err) {
      console.error("Error fetching queue management data", err);
      setError("An error occurred while loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    const interval = setInterval(() => {
      fetchData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleSkipPatient = async (queueId, patientName) => {
    if (!window.confirm(`Are you sure you want to skip/mark ${patientName} as No-Show?`)) {
      return;
    }

    try {
      const res = await markQueueNoShow(queueId);
      if (res?.success) {
        showToast(`${patientName} marked as skipped (No-Show).`, "success");
        fetchData(false);
      } else {
        showToast(res?.error || "Failed to skip patient.", "error");
      }
    } catch (err) {
      showToast("An error occurred while skipping the patient.", "error");
    }
  };

  // Status mapping
  const statusLabels = {
    waiting: "Waiting",
    in_consultation: "In Progress",
    completed: "Completed",
    no_show: "Skipped / No-Show",
  };

  const statusColors = {
    waiting: "amber",
    in_consultation: "blue",
    completed: "green",
    no_show: "red",
  };

  // Group queue by doctor helper
  const getDoctorQueue = (docId) => {
    return queue.filter((entry) => entry.doctor_id === docId);
  };

  // Calculate waiting position for a patient in a doctor's queue
  const getWaitingPosition = (entry, doctorEntries) => {
    if (entry.status !== "waiting") return null;
    const waitingEntries = doctorEntries
      .filter((e) => e.status === "waiting")
      .sort((a, b) => a.queue_number - b.queue_number);
    const index = waitingEntries.findIndex((e) => e.queue_id === entry.queue_id);
    if (index === -1) return null;

    const suffixes = ["th", "st", "nd", "rd"];
    const val = index + 1;
    const rule = val % 100;
    const suffix = suffixes[(rule - 20) % 10] || suffixes[rule] || suffixes[0];
    return `${val}${suffix} in line`;
  };

  // Filter queue entries
  const filteredQueue = queue.filter((entry) => {
    // 1. Doctor filter
    if (selectedDoctorTab !== "all" && String(entry.doctor_id) !== selectedDoctorTab) {
      return false;
    }

    // 2. Status filter
    if (statusFilter !== "all" && entry.status !== statusFilter) {
      return false;
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = entry.patient_name?.toLowerCase().includes(query);
      const phoneMatch = entry.patient_phone?.includes(query);
      const docMatch = entry.doctor_name?.toLowerCase().includes(query);
      const qNumMatch = String(entry.queue_number) === query || `q${entry.queue_number}`.includes(query);
      return nameMatch || phoneMatch || docMatch || qNumMatch;
    }

    return true;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar role="receptionist" activePage="Queue" />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight text-[#1A73E8]">Queue Management</h1>
            <p className="text-slate-500 text-xs mt-0.5">Monitor and organize patient queue positions for all active doctors</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-all"
            >
              <i className="ti ti-refresh" /> Refresh
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toast.message && (
          <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 ${toast.type === "error" ? "bg-red-500 animate-bounce" : "bg-green-500"}`}>
            <i className={toast.type === "error" ? "ti ti-alert-circle text-lg" : "ti ti-circle-check text-lg"} />
            <span className="font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Filters Panel */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ti ti-search text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, phone, or doctor..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-750 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="waiting">Waiting</option>
              <option value="in_consultation">In Progress</option>
              <option value="completed">Completed</option>
              <option value="no_show">Skipped / No-Show</option>
            </select>
          </div>
        </div>

        {/* Doctor Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-6 border-b border-slate-200 pb-3">
          <button
            onClick={() => setSelectedDoctorTab("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedDoctorTab === "all"
                ? "bg-[#1A73E8] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-650 hover:bg-slate-50"
            }`}
          >
            All Doctors ({queue.length})
          </button>
          {doctors.map((doc) => {
            const docQueueCount = getDoctorQueue(doc.doctor_id).length;
            return (
              <button
                key={doc.doctor_id}
                onClick={() => setSelectedDoctorTab(String(doc.doctor_id))}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedDoctorTab === String(doc.doctor_id)
                    ? "bg-[#1A73E8] text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-650 hover:bg-slate-50"
                }`}
              >
                {doc.full_name} ({docQueueCount})
              </button>
            );
          })}
        </div>

        {/* Error or Loading */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center font-medium">
            {error}
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
            <i className="ti ti-users text-4xl text-slate-300 block mb-3" />
            <p className="text-slate-400 text-sm font-semibold">No queue entries found matching the criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pos / Ticket</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Appointment Slot</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Check-in Time</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredQueue.map((entry) => {
                    const doctorEntries = getDoctorQueue(entry.doctor_id);
                    const waitingPos = getWaitingPosition(entry, doctorEntries);
                    
                    return (
                      <tr key={entry.queue_id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Queue Position and Sequence */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span className="text-[#1A73E8]">Q{entry.queue_number < 10 ? `0${entry.queue_number}` : entry.queue_number}</span>
                            {waitingPos && (
                              <span className="text-[10px] text-slate-400 font-semibold">{waitingPos}</span>
                            )}
                          </div>
                        </td>
                        
                        {/* Patient Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900">{entry.patient_name}</div>
                          <div className="text-xs text-slate-400 font-semibold">{entry.patient_phone}</div>
                        </td>

                        {/* Doctor Name */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-semibold">
                          <div>{entry.doctor_name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{entry.specialisation}</div>
                        </td>

                        {/* Appointment Time / Walk-in */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {entry.appointment_time ? (
                            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs">
                              {entry.appointment_time}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-bold text-xs">
                              Walk-in
                            </span>
                          )}
                        </td>

                        {/* Check-in Time */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                          {formatTime(entry.check_in_time)}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            text={statusLabels[entry.status] || entry.status}
                            color={statusColors[entry.status] || "gray"}
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {(entry.status === "waiting" || entry.status === "in_consultation") ? (
                              <button
                                onClick={() => handleSkipPatient(entry.queue_id, entry.patient_name)}
                                className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md text-xs font-bold transition-all flex items-center gap-1 border border-red-100"
                              >
                                <i className="ti ti-user-x" /> Skip Patient
                              </button>
                            ) : (
                              <span className="text-xs text-slate-450 italic font-medium">
                                {entry.status === "completed" ? "Consultation Done" : "No actions"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-150 text-xs text-slate-450 font-semibold flex items-center justify-between">
              <span>Showing {filteredQueue.length} of {queue.length} total entries</span>
              <span className="flex items-center gap-1">
                <i className="ti ti-refresh animate-spin-slow" /> Auto-refreshing every 10s
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ManageQueue;
