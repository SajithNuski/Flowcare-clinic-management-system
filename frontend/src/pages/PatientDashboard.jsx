import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Badge from "../components/Badge";
import { getMyAppointments, cancelAppointment } from "../api/appointments";
import { getMyConsultations } from "../api/consultations";
import { getQueueStatus } from "../api/queue";
import { changePassword } from "../api/auth";
import { updatePatientProfile } from "../api/patients";
import axios from "axios";
import { API_BASE } from "../utils/constants";
import { formatTime } from "../utils/helpers";

function PatientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  // Navigation tab based on path
  const getActiveTab = () => {
    if (location.pathname.includes("/consultations")) return "Consultations";
    if (location.pathname.includes("/profile")) return "Profile";
    return "Dashboard";
  };

  const activeTab = getActiveTab();

  // State Management
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter state for consultations
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");

  // Profile forms state
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    blood_group: "",
    allergies: "",
    medical_history: "",
    emergency_contact: "",
  });

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Action feedback states
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 4000);
  };

  // Sync profile data state when user object changes
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
        date_of_birth: user.date_of_birth || "",
        blood_group: user.blood_group || "",
        allergies: user.allergies || "",
        medical_history: user.medical_history || "",
        emergency_contact: user.emergency_contact || "",
      });
    }
  }, [user]);

  // Load all dashboard data
  const loadDashboardData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError("");

    try {
      // Fetch appointments
      const apptsRes = await getMyAppointments();
      const apptsList = Array.isArray(apptsRes) ? apptsRes : apptsRes?.appointments || [];
      setAppointments(apptsList);

      // Fetch consultations
      const consRes = await getMyConsultations();
      const consList = Array.isArray(consRes) ? consRes : consRes?.consultations || [];
      setConsultations(consList);

      // Fetch Queue Status for today
      const qRes = await getQueueStatus();
      if (qRes && !qRes.error) {
        setQueueStatus(qRes);
      } else {
        setQueueStatus(null);
      }

      // Fetch Announcements
      const annRes = await axios.get(`${API_BASE}/admin/announcements.php`);
      if (annRes.data?.success) {
        setAnnouncements(annRes.data.announcements || []);
      }
    } catch (err) {
      setError("Unable to load dashboard details. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(true);

    // Auto refresh queue and dashboard details every 12 seconds
    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Handle Cancel Appointment
  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await cancelAppointment(apptId);
      if (res?.success) {
        showToast("Appointment cancelled successfully.", "success");
        loadDashboardData(false);
      } else {
        showToast(res?.error || "Failed to cancel appointment.", "error");
      }
    } catch (err) {
      showToast("An error occurred. Please try again.", "error");
    }
  };

  // Handle Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await updatePatientProfile(profileData);
      if (res?.success) {
        showToast("Profile and medical history updated successfully!", "success");
        // Refetch/sync user context data by refreshing session info
        const meRes = await axios.get(`${API_BASE}/auth/me.php`);
        if (meRes.data?.success) {
          // Re-update auth context state so navbar displays correct name
          login(meRes.data.user);
        }
      } else {
        showToast(res?.error || "Could not update profile details.", "error");
      }
    } catch (err) {
      showToast("Error updating profile details.", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast("New passwords do not match.", "error");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await changePassword(passwordData.old_password, passwordData.new_password);
      if (res?.success) {
        showToast("Password updated successfully!", "success");
        setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
      } else {
        showToast(res?.error || "Failed to change password.", "error");
      }
    } catch (err) {
      showToast("Error changing password. Ensure requirements are met.", "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Get unique doctors list from consultations for filter
  const uniqueDoctors = [...new Set(consultations.map((c) => c.doctor_name).filter(Boolean))];

  // Filter consultations based on search query and doctor selection
  const filteredConsultations = consultations.filter((c) => {
    const matchesSearch =
      (c.diagnosis && c.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.referral && c.referral.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDoctor = doctorFilter ? c.doctor_name === doctorFilter : true;

    return matchesSearch && matchesDoctor;
  });

  // Calculate dynamic welcome greeting
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning";
    if (hrs < 18) return "Good afternoon";
    return "Good evening";
  };

  // Next upcoming active appointment
  const nextAppointment = appointments
    .filter((a) => a.status === "confirmed" && new Date(a.appointment_date) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(`${a.appointment_date} ${a.time_slot}`) - new Date(`${b.appointment_date} ${b.time_slot}`))[0];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* App Sidebar */}
      <Sidebar role="patient" activePage={activeTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Floating Toast Notification */}
        {toast.message && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-2xl border px-4 py-3.5 shadow-xl transition-all duration-300 animate-slideIn ${
            toast.type === "success" 
              ? "border-[#B7E4C7] bg-[#F1FBF5] text-[#166534]" 
              : "border-[#F5C2C7] bg-[#FDEDED] text-[#991B1B]"
          }`}>
            <i className={`ti ${toast.type === "success" ? "ti-circle-check" : "ti-alert-triangle"} text-lg`}></i>
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Header Bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{activeTab}</h1>
            <p className="text-xs text-slate-400">FlowCare Patient Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full capitalize">
              Patient ID: #{user?.id}
            </span>
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
              <div className="animate-spin h-8 w-8 border-4 border-[#1A73E8] border-t-transparent rounded-full" />
              <span className="text-sm text-slate-400 font-medium">Fetching details...</span>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-[#F5C2C7] bg-[#FDEDED] p-6 text-center max-w-xl mx-auto my-12">
              <i className="ti ti-alert-circle text-4xl text-[#DC2626] mb-3 inline-block"></i>
              <h3 className="text-lg font-bold text-slate-800">Connection Issue</h3>
              <p className="text-sm text-slate-600 mt-1">{error}</p>
              <button 
                onClick={() => loadDashboardData(true)} 
                className="mt-4 px-5 py-2 bg-white border border-[#F5C2C7] rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Retry Request
              </button>
            </div>
          ) : (
            <>
              {/* PANEL 1: OVERVIEW / DASHBOARD */}
              {activeTab === "Dashboard" && (
                <div className="space-y-6">
                  {/* Welcome Greeting Banner */}
                  <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-[#1A73E8] to-[#115EC3] p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 max-w-2xl">
                      <span className="text-xs uppercase font-bold tracking-widest text-blue-200">Patient Dashboard</span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 leading-tight">
                        {getGreeting()}, {user?.full_name}!
                      </h2>
                      <p className="text-sm text-blue-100/90 mt-2 leading-relaxed">
                        Welcome to your personal health records dashboard. Here you can track active prescriptions, review your current queue standing, and request specialized appointments.
                      </p>
                    </div>
                  </div>

                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Live Queue Status Widget */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 flex flex-col justify-between min-h-[220px]">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <i className="ti ti-list-numbers text-base text-[#1A73E8]"></i>
                            Today's Live Queue standing
                          </h3>
                          {queueStatus && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>

                        {queueStatus ? (
                          <div className="mt-4 grid grid-cols-3 gap-4 text-center items-center">
                            <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your No.</span>
                              <span className="block text-2xl font-black text-slate-800 mt-1">#{queueStatus.queue_number}</span>
                            </div>
                            <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ahead of you</span>
                              <span className="block text-2xl font-black text-[#1A73E8] mt-1">{queueStatus.position}</span>
                            </div>
                            <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Est. Wait</span>
                              <span className="block text-lg font-black text-slate-800 mt-1">
                                {queueStatus.estimated_wait_minutes !== null ? `${queueStatus.estimated_wait_minutes} min` : "Calculating"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-6 text-center py-4">
                            <p className="text-sm text-slate-400 font-medium">You are not checked into the clinic queue today.</p>
                            <p className="text-xs text-slate-400/80 mt-1">Check-in at the reception desk to join the queue when you arrive.</p>
                          </div>
                        )}
                      </div>

                      {queueStatus && (
                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Status:</span>
                          <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                            queueStatus.status === "waiting" 
                              ? "bg-amber-50 text-amber-600 border border-amber-100" 
                              : queueStatus.status === "in_consultation"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {queueStatus.status === "in_consultation" ? "In Consultation" : queueStatus.status}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Next Appointment Card */}
                    <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 flex flex-col justify-between min-h-[220px]">
                      <div>
                        <div className="pb-3 border-b border-slate-50">
                          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <i className="ti ti-calendar text-base text-[#1A73E8]"></i>
                            Next Appointment
                          </h3>
                        </div>

                        {nextAppointment ? (
                          <div className="mt-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-bold text-slate-800">{nextAppointment.doctor_name}</h4>
                                <span className="text-[11px] font-semibold text-slate-400">{nextAppointment.specialisation}</span>
                              </div>
                              <span className="bg-[#E8F0FE] text-[#1A73E8] px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase">
                                {formatTime(nextAppointment.time_slot)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <i className="ti ti-calendar-time"></i>
                              <span>Scheduled for: <strong>{nextAppointment.appointment_date}</strong></span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-6 text-center py-4">
                            <p className="text-sm text-slate-400 font-medium">No upcoming appointments booked.</p>
                            <button 
                              onClick={() => navigate("/patient/book")} 
                              className="mt-3 text-xs bg-[#E8F0FE] text-[#1A73E8] px-3.5 py-1.5 rounded-xl font-bold hover:bg-blue-100 transition"
                            >
                              Book Appointment
                            </button>
                          </div>
                        )}
                      </div>

                      {nextAppointment && (
                        <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                          <button 
                            onClick={() => handleCancelAppointment(nextAppointment.id)} 
                            className="text-xs font-bold text-[#DC2626] hover:text-[#B91C1C] transition flex items-center gap-1"
                          >
                            <i className="ti ti-trash"></i> Cancel Booking
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Main Grid: Info Panels / Announcements */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    
                    {/* Clinical Summary info card */}
                    <div className="xl:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                        <i className="ti ti-clipboard-list text-base text-[#1A73E8]"></i>
                        Patient Clinical Info
                      </h3>
                      
                      <div className="space-y-3.5 text-xs">
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                          <span className="text-slate-400 font-semibold">Blood Group</span>
                          <span className="font-bold text-slate-700 bg-red-50 text-red-600 px-2.5 py-0.5 rounded-lg border border-red-100">
                            {user?.blood_group || "Not Specified"}
                          </span>
                        </div>
                        <div className="space-y-1.5 py-1.5 border-b border-slate-50">
                          <span className="text-slate-400 font-semibold block">Known Allergies</span>
                          <p className="text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 leading-relaxed">
                            {user?.allergies || "No recorded allergies."}
                          </p>
                        </div>
                        <div className="space-y-1.5 py-1.5">
                          <span className="text-slate-400 font-semibold block">Clinical Medical History</span>
                          <p className="text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 leading-relaxed">
                            {user?.medical_history || "No previous records added."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Announcements Board */}
                    <div className="xl:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-50 flex items-center gap-1.5">
                        <i className="ti ti-bell-ringing text-base text-[#1A73E8]"></i>
                        Clinic Announcements & News
                      </h3>

                      {announcements.length > 0 ? (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                          {announcements.map((ann) => (
                            <div key={ann.id} className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-1 hover:border-blue-100 hover:bg-slate-50 transition duration-200">
                              <div className="flex justify-between items-start gap-4">
                                <h4 className="text-xs font-bold text-slate-800 leading-tight">{ann.title}</h4>
                                <span className="text-[10px] text-slate-400 shrink-0 font-medium">{new Date(ann.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed pt-1 whitespace-pre-wrap">{ann.message}</p>
                              <span className="block text-[9px] text-[#1A73E8] font-semibold pt-1">
                                Posted by: {ann.created_by_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <i className="ti ti-bell text-3xl text-slate-300"></i>
                          <p className="text-xs text-slate-400 mt-2 font-medium">No announcements published yet.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* PANEL 2: MY CONSULTATIONS */}
              {activeTab === "Consultations" && (
                <div className="space-y-6">
                  {/* Search and Filters Bar */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <i className="ti ti-search text-base"></i>
                      </span>
                      <input 
                        type="text" 
                        placeholder="Search consultations by diagnosis, notes, prescription..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-150"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <select
                        value={doctorFilter}
                        onChange={(e) => setDoctorFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-semibold focus:border-[#1A73E8] outline-none transition"
                      >
                        <option value="">All Doctors</option>
                        {uniqueDoctors.map((doc) => (
                          <option key={doc} value={doc}>{doc}</option>
                        ))}
                      </select>

                      {(searchQuery || doctorFilter) && (
                        <button 
                          onClick={() => { setSearchQuery(""); setDoctorFilter(""); }}
                          className="text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] transition"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Consultation History List */}
                  {filteredConsultations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredConsultations.map((cons) => (
                        <div key={cons.id} className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
                          
                          <div className="space-y-4">
                            {/* Card Header: Doctor info */}
                            <div className="flex justify-between items-start pb-3 border-b border-slate-100/60">
                              <div>
                                <h3 className="text-sm font-bold text-slate-800">{cons.doctor_name}</h3>
                                <p className="text-[10px] text-slate-400 font-semibold">Specialist Doctor</p>
                              </div>
                              <span className="bg-blue-50 text-[#1A73E8] border border-blue-100 px-3 py-1 rounded-full text-[10px] font-bold">
                                {new Date(cons.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            {/* Diagnosis Badge */}
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Diagnosis</span>
                              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 inline-block">
                                {cons.diagnosis || "No primary diagnosis recorded"}
                              </div>
                            </div>

                            {/* Prescriptions & Doctor Advice */}
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Prescriptions & Medical Notes</span>
                              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/30 whitespace-pre-line">
                                {cons.notes || "No prescription notes entered."}
                              </p>
                            </div>

                            {/* Referral (if any) */}
                            {cons.referral && (
                              <div className="bg-[#FFF9E6] border border-[#FFEBA3] rounded-2xl p-3 text-xs">
                                <span className="font-bold text-[#8F6B00] flex items-center gap-1.5">
                                  <i className="ti ti-notes-medical"></i> Clinical Referral Recommendation
                                </span>
                                <p className="text-[#8F6B00]/90 mt-1 leading-normal font-medium">{cons.referral}</p>
                              </div>
                            )}
                          </div>

                          {/* Contact Info Footer */}
                          {cons.doctor_phone && (
                            <div className="mt-6 pt-3 border-t border-slate-100/60 flex items-center justify-between text-[11px] text-slate-400">
                              <span>Inquiry Phone:</span>
                              <span className="font-bold text-slate-600 flex items-center gap-1">
                                <i className="ti ti-phone text-xs"></i> {cons.doctor_phone}
                              </span>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-md">
                      <i className="ti ti-heart-rate-monitor text-4xl text-slate-300"></i>
                      <p className="text-sm text-slate-400 mt-3 font-semibold">No medical consultations matching your criteria found.</p>
                      <p className="text-xs text-slate-400/80 mt-1">If this is incorrect, try modifying your keyword filters.</p>
                    </div>
                  )}
                </div>
              )}

              {/* PANEL 3: PROFILE & MEDICAL INFO */}
              {activeTab === "Profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Demographic & Clinical Profile Editor */}
                  <div className="lg:col-span-8 space-y-6">
                    <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 sm:p-8 space-y-6">
                      
                      {/* section: Demographics */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                          <i className="ti ti-id-badge text-base text-[#1A73E8]"></i>
                          Personal Information
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Full Name</label>
                            <input 
                              type="text" 
                              required
                              value={profileData.full_name}
                              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                              className="w-full rounded-xl border border-slate-250 px-4 py-2.5 text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">National Identity Card (NIC)</label>
                            <input 
                              type="text" 
                              disabled
                              value={user?.nic || ""}
                              className="w-full rounded-xl border border-slate-200 bg-slate-100/60 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed outline-none"
                              title="NIC cannot be modified directly"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Email Address</label>
                            <input 
                              type="email" 
                              required
                              value={profileData.email}
                              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                              className="w-full rounded-xl border border-slate-250 px-4 py-2.5 text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Phone Number</label>
                            <input 
                              type="tel" 
                              required
                              value={profileData.phone}
                              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                              className="w-full rounded-xl border border-slate-250 px-4 py-2.5 text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Gender</label>
                            <select
                              value={profileData.gender}
                              onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                              className="w-full rounded-xl border border-slate-250 px-4 py-2.5 text-sm focus:border-[#1A73E8] outline-none transition"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Date of Birth</label>
                            <input 
                              type="date" 
                              required
                              value={profileData.date_of_birth}
                              onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                              className="w-full rounded-xl border border-slate-250 px-4 py-2.5 text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* section: Clinical Info */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                          <i className="ti ti-report-medical text-base text-[#1A73E8]"></i>
                          Medical History & Critical Clinical Records
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Blood Group</label>
                            <select
                              value={profileData.blood_group}
                              onChange={(e) => setProfileData({ ...profileData, blood_group: e.target.value })}
                              className="w-full rounded-xl border border-slate-250 px-4 py-2.5 text-sm focus:border-[#1A73E8] outline-none transition"
                            >
                              <option value="">Not Specified</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Emergency Contact Number</label>
                            <input 
                              type="tel" 
                              placeholder="e.g. 0771234567"
                              value={profileData.emergency_contact}
                              onChange={(e) => setProfileData({ ...profileData, emergency_contact: e.target.value })}
                              className="w-full rounded-xl border border-slate-250 px-4 py-2.5 text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500">Allergies Description</label>
                          <textarea
                            rows={2}
                            placeholder="Detail all known drug, food or environmental allergies..."
                            value={profileData.allergies}
                            onChange={(e) => setProfileData({ ...profileData, allergies: e.target.value })}
                            className="w-full rounded-xl border border-slate-250 px-4 py-2.5 text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500">Medical History Summary</label>
                          <textarea
                            rows={3}
                            placeholder="Detail chronic illnesses, surgeries, regular medications, past treatments..."
                            value={profileData.medical_history}
                            onChange={(e) => setProfileData({ ...profileData, medical_history: e.target.value })}
                            className="w-full rounded-xl border border-slate-250 px-4 py-2.5 text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Submit Actions */}
                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="rounded-xl bg-[#1A73E8] text-white px-6 py-2.5 font-bold text-sm hover:bg-[#1557B0] transition disabled:opacity-60 shadow-lg shadow-blue-500/10"
                        >
                          {profileSaving ? "Saving changes..." : "Save Profile Details"}
                        </button>
                      </div>

                    </form>
                  </div>

                  {/* Right Column: Security/Password Change Settings */}
                  <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <i className="ti ti-lock text-base text-[#1A73E8]"></i>
                      Change Password
                    </h3>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500">Current Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.old_password}
                          onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                          className="w-full rounded-xl border border-slate-250 px-4 py-2 text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500">New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                          className="w-full rounded-xl border border-slate-250 px-4 py-2 text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                        />
                        <span className="block text-[10px] text-slate-400 leading-normal">
                          Requires min 8 characters, uppercase, lowercase, numbers, and symbols.
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                          className="w-full rounded-xl border border-slate-250 px-4 py-2 text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={passwordSaving}
                        className="w-full rounded-xl bg-slate-800 text-white py-2.5 text-xs font-bold hover:bg-slate-900 transition disabled:opacity-60"
                      >
                        {passwordSaving ? "Updating password..." : "Update Password"}
                      </button>
                    </form>
                  </div>

                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default PatientDashboard;
