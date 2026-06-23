import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { getDoctors } from "../api/doctors";
import { createAppointment, getAvailableSlots } from "../api/appointments";
import { VISIT_REASONS } from "../utils/constants";
import { formatTime } from "../utils/helpers";
import clinicImg from "../assets/images/clinic image.png";

// Helper to get specialization-specific icons
const getSpecIcon = (spec) => {
  const s = (spec || "").toLowerCase();
  if (s.includes("cardio")) return "ti-heart-rate-monitor";
  if (s.includes("pedia") || s.includes("child")) return "ti-mood-smile";
  if (s.includes("surg")) return "ti-activity";
  if (s.includes("ortho")) return "ti-bone";
  if (s.includes("physi") || s.includes("general")) return "ti-stethoscope";
  return "ti-first-aid-kit";
};

// Helper for unique department card colors
const getSpecColors = (spec) => {
  const s = (spec || "").toLowerCase();
  if (s.includes("cardio")) return { bg: "bg-red-50", text: "text-red-600", border: "border-red-100/80" };
  if (s.includes("pedia") || s.includes("child")) return { bg: "bg-green-50", text: "text-green-600", border: "border-green-100/80" };
  if (s.includes("surg")) return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100/80" };
  if (s.includes("ortho")) return { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100/80" };
  return { bg: "bg-blue-50", text: "text-[#1A73E8]", border: "border-blue-100/80" };
};

function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Step manager: 1 = Choose Specialist, 2 = Date & Time, 3 = Patient Details
  const [step, setStep] = useState(1);

  // State variables for storing API data and user selections
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");

  const [specialisation, setSpecialisation] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

  // Personal details state initialized with logged-in user's details if available
  const [formFields, setFormFields] = useState({
    patient_name: user?.full_name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    visit_reason: VISIT_REASONS[0],
    notes: "",
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 1. Fetch active doctors from the backend on component mount
  useEffect(() => {
    let active = true;

    async function load() {
      setLoadingDoctors(true);
      setDoctorsError("");
      try {
        const res = await getDoctors();
        const list = Array.isArray(res) ? res : res?.doctors || [];
        if (active) setDoctors(list);
      } catch (e) {
        if (active) setDoctorsError(e?.message || "Unable to load doctors.");
      } finally {
        if (active) setLoadingDoctors(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  // 2. Get unique specializations from the fetched doctors list
  const specialisations = useMemo(() => {
    return [...new Set(doctors.map((d) => d.specialisation).filter(Boolean))];
  }, [doctors]);

  // 3. Filter doctors based on the selected specialization
  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => (specialisation ? d.specialisation === specialisation : true));
  }, [doctors, specialisation]);

  // 4. Get the full details of the currently selected doctor
  const selectedDoctor = useMemo(() => {
    return doctors.find((d) => String(d.doctor_id) === String(doctorId));
  }, [doctors, doctorId]);

  // 5. Retrieve the working days of the selected doctor
  const selectedDoctorWorkingDays = useMemo(() => {
    return selectedDoctor ? selectedDoctor.working_days : "";
  }, [selectedDoctor]);

  // 6. Check if selected date falls on doctor's scheduled working days
  const isWorkingDay = useMemo(() => {
    if (!appointmentDate || !selectedDoctorWorkingDays) return true;
    
    // Get short name of day (e.g. "Mon", "Tue", "Wed")
    const dayOfWeek = new Date(appointmentDate).toLocaleDateString("en-US", { weekday: "short" });
    const workingDaysList = selectedDoctorWorkingDays.split(",").map(d => d.trim());
    return workingDaysList.includes(dayOfWeek);
  }, [appointmentDate, selectedDoctorWorkingDays]);

  // Reset time slot selections whenever selected doctor changes
  useEffect(() => {
    setSelectedSlot("");
    setSlots([]);
  }, [doctorId]);

  // 7. Fetch available slots for the selected doctor on the selected date
  useEffect(() => {
    let active = true;

    async function loadSlots() {
      if (!doctorId || !appointmentDate) {
        setSlots([]);
        setSlotsLoading(false);
        return;
      }

      setSlotsLoading(true);
      setError("");
      try {
        const res = await getAvailableSlots(Number(doctorId), appointmentDate);
        const list = Array.isArray(res) ? res : res?.slots || [];
        if (active) setSlots(list);
      } catch (e) {
        if (active) setError(e?.message || "Unable to load slots.");
      } finally {
        if (active) setSlotsLoading(false);
      }
    }

    loadSlots();
    return () => {
      active = false;
    };
  }, [doctorId, appointmentDate]);

  // 8. Auto-assign the first available slot from the returned slots
  useEffect(() => {
    if (slots && slots.length > 0) {
      setSelectedSlot(slots[0]);
    } else {
      setSelectedSlot("");
    }
  }, [slots]);

  // Handler to update form input fields
  function updateField(key, value) {
    setFormFields((f) => ({ ...f, [key]: value }));
  }

  // Clear selections and inputs after a successful booking
  function resetFormAfterSuccess() {
    setSelectedSlot("");
    setAppointmentDate("");
    setDoctorId("");
    setSpecialisation("");
    setFormFields({
      patient_name: user?.full_name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      visit_reason: VISIT_REASONS[0],
      notes: "",
    });
    setSlots([]);
    setStep(1);
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!specialisation) return setError("Please choose a specialization.");
    if (!doctorId) return setError("Please select a doctor.");
    if (!appointmentDate) return setError("Please select a date.");
    if (!selectedSlot) return setError("No available session slots on this date. Please try another date.");

    setSubmitLoading(true);
    try {
      const payload = {
        doctor_id: Number(doctorId),
        appointment_date: appointmentDate,
        time_slot: selectedSlot,
        visit_reason: formFields.visit_reason,
        notes: formFields.notes,
        patient_name: formFields.patient_name,
        phone: formFields.phone,
        email: formFields.email,
      };

      const res = await createAppointment(payload);
      if (!res?.success) throw new Error(res?.error || res?.message || "Booking failed");

      setSuccessMessage("Appointment booked successfully! You can track this in your dashboard.");
    } catch (err) {
      setError(err?.message || "Booking failed. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  const todayString = new Date().toISOString().slice(0, 10);

  const getDoctorInitials = (name) => {
    if (!name) return "Dr";
    const clean = name.replace("Dr.", "").trim();
    const parts = clean.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Success Screen State */}
        {successMessage ? (
          <div className="max-w-2xl mx-auto my-12 bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-100/50 text-center animate-fadeIn">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#EAFAF1] text-[#2ECC71] text-4xl mb-6 shadow-sm border border-emerald-100/80">
              <i className="ti ti-circle-check"></i>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800">Booking Confirmed!</h2>
            <p className="mt-4 text-[#4B5563] text-base leading-relaxed">
              Your appointment has been successfully scheduled. We have reserved your time session and updated our clinic queue system.
            </p>

            <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-2xl text-left space-y-4 max-w-md mx-auto">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Specialist:</span>
                <span className="text-slate-800 font-bold">{selectedDoctor?.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="text-slate-800 font-bold">{specialisation}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Date &amp; Time:</span>
                <span className="text-[#1A73E8] font-bold">
                  {appointmentDate} at {formatTime(selectedSlot)}
                </span>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/patient/dashboard"
                className="rounded-xl bg-[#1A73E8] text-white px-8 py-3.5 font-bold shadow-md hover:bg-[#1557B0] transition-colors"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={resetFormAfterSuccess}
                className="rounded-xl border border-slate-200 bg-white text-slate-700 px-8 py-3.5 font-bold hover:bg-slate-50 transition-colors"
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-4">
            
            {/* Step & Details Tracker (4 cols on lg) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              
              {/* Sidebar Header & Info */}
              <div className="bg-[#1A73E8] text-white rounded-3xl p-6 shadow-xl shadow-blue-500/10 overflow-hidden relative">
                <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10">
                  <i className="ti ti-activity-heartbeat text-[180px] font-bold" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">Badulla Medical Centre</span>
                <h2 className="text-xl font-bold mt-1">Book an Appointment</h2>
                <p className="text-xs text-white/80 mt-2 leading-relaxed">
                  Secure your consultation slot in just three quick steps. We track doctor availability and clinic queue volume in real time.
                </p>
              </div>

              {/* Booking Progress Stepper */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Process Progress</h3>
                
                <nav className="flex flex-col gap-5">
                  {[
                    { id: 1, label: "Choose Specialist", desc: "Select department and physician" },
                    { id: 2, label: "Date & Time", desc: "Pick schedule session" },
                    { id: 3, label: "Patient Details", desc: "Provide symptoms & contacts" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={s.id > 1 && !specialisation}
                      onClick={() => setStep(s.id)}
                      className={`flex items-start gap-4 text-left cursor-pointer group transition-all duration-200 ${
                        s.id > 1 && !specialisation ? "opacity-40 pointer-events-none" : ""
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold border transition-all duration-200 ${
                          step === s.id
                            ? "bg-[#E8F0FE] text-[#1A73E8] border-[#1A73E8]/20 ring-4 ring-[#1A73E8]/5 scale-105"
                            : step > s.id
                            ? "bg-[#EAFAF1] text-[#2ECC71] border-[#2ECC71]/20"
                            : "bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-slate-100 group-hover:text-slate-600"
                        }`}
                      >
                        {step > s.id ? (
                          <i className="ti ti-check font-bold" />
                        ) : (
                          <span>{s.id}</span>
                        )}
                      </div>
                      <div>
                        <div
                          className={`text-sm font-bold transition-colors ${
                            step === s.id ? "text-[#1A73E8]" : "text-slate-800"
                          }`}
                        >
                          {s.label}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-none">
                          {s.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Dynamic Recap Card (Only visible once something is selected) */}
              {specialisation && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 animate-fadeIn">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Reservation Summary</h3>
                  
                  <div className="space-y-3.5">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                        <i className="ti ti-heart-rate-monitor text-base" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Department</div>
                        <div className="text-xs font-bold text-slate-700">{specialisation}</div>
                      </div>
                    </div>

                    {selectedDoctor && (
                      <div className="flex gap-3 border-t border-slate-50 pt-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#1A73E8] font-bold text-[11px]">
                          {getDoctorInitials(selectedDoctor.full_name)}
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Specialist</div>
                          <div className="text-xs font-bold text-slate-700">{selectedDoctor.full_name}</div>
                        </div>
                      </div>
                    )}

                    {appointmentDate && (
                      <div className="flex gap-3 border-t border-slate-50 pt-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#2ECC71]">
                          <i className="ti ti-calendar text-base" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Date Chosen</div>
                          <div className="text-xs font-bold text-slate-700">{appointmentDate}</div>
                        </div>
                      </div>
                    )}

                    {selectedSlot && (
                      <div className="flex gap-3 border-t border-slate-50 pt-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-amber-500">
                          <i className="ti ti-clock text-base" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Session</div>
                          <div className="text-xs font-bold text-slate-700">{formatTime(selectedSlot)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Form & Selection Content (8 cols on lg) */}
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-100/30">
              
              {error && (
                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/50 px-4 py-3.5 text-sm text-red-700 flex items-center gap-2.5 animate-fadeIn">
                  <i className="ti ti-alert-triangle text-lg"></i>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* STEP 1: CHOOSE SPECIALIST */}
              {step === 1 && (
                <div className="space-y-8 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Select Medical Department</h2>
                    <p className="mt-1 text-sm text-slate-500">Choose the field matching your symptoms or medical concern.</p>
                  </div>

                  {loadingDoctors ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin h-8 w-8 border-2 border-[#1A73E8] border-t-transparent rounded-full" />
                      <span className="text-sm text-slate-400">Loading specialist registry...</span>
                    </div>
                  ) : doctorsError ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-red-500 font-bold">{doctorsError}</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Department Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {specialisations.map((spec) => {
                          const isSel = specialisation === spec;
                          const count = doctors.filter((d) => d.specialisation === spec).length;
                          const theme = getSpecColors(spec);
                          return (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => {
                                setSpecialisation(spec);
                                setDoctorId(""); // Reset doctor selection
                              }}
                              className={`group text-left p-5 rounded-2xl border transition-all duration-300 relative ${
                                isSel
                                  ? "bg-white border-[#1A73E8] shadow-md shadow-blue-500/5 ring-2 ring-[#1A73E8]/5 -translate-y-0.5"
                                  : "bg-[#F9FAFB] border-slate-100 hover:bg-white hover:border-[#1A73E8]/20 hover:shadow-md hover:-translate-y-0.5"
                              }`}
                            >
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${theme.bg} ${theme.text} border ${theme.border} text-lg transition-transform duration-300 group-hover:scale-105`}>
                                <i className={`ti ${getSpecIcon(spec)}`} />
                              </div>
                              <h4 className="mt-4 text-sm font-bold text-slate-800 tracking-tight">{spec}</h4>
                              <p className="text-[11px] text-slate-400 mt-1 font-medium">{count} Active {count === 1 ? 'Doctor' : 'Doctors'}</p>
                              {isSel && (
                                <div className="absolute right-4 top-4 text-[#1A73E8] text-sm bg-blue-50 h-5 w-5 rounded-full flex items-center justify-center font-bold">
                                  <i className="ti ti-check" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Doctor Showcase Selection */}
                      {specialisation && (
                        <div className="space-y-5 animate-fadeIn">
                          <div>
                            <h3 className="text-base font-bold text-slate-800">Available Practitioners</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Select a specialist below to continue.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredDoctors.map((doc) => {
                              const isSel = String(doctorId) === String(doc.doctor_id);
                              return (
                                <button
                                  key={doc.doctor_id}
                                  type="button"
                                  onClick={() => setDoctorId(String(doc.doctor_id))}
                                  className={`text-left p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 relative group ${
                                    isSel
                                      ? "bg-white border-[#1A73E8] shadow-md shadow-blue-500/5 ring-2 ring-[#1A73E8]/5"
                                      : "bg-[#F9FAFB] border-slate-100 hover:bg-white hover:border-[#1A73E8]/20 hover:shadow-md"
                                  }`}
                                >
                                  {/* Doctor Initials Profile Box */}
                                  <div className={`h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-[#1A73E8]/10 to-[#115EC3]/10 text-[#1A73E8] border border-[#1A73E8]/10 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform duration-300`}>
                                    {getDoctorInitials(doc.full_name)}
                                  </div>
                                  <div className="space-y-1 pr-6">
                                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1A73E8] transition-colors">{doc.full_name}</h4>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1A73E8]">{doc.specialisation}</p>
                                    {doc.bio && (
                                      <p className="text-xs text-slate-400 leading-normal line-clamp-2 mt-1">{doc.bio}</p>
                                    )}
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 rounded-lg px-2 py-0.5 mt-2 max-w-fit">
                                      <i className="ti ti-calendar" />
                                      <span>Works: {doc.working_days}</span>
                                    </div>
                                  </div>
                                  {isSel && (
                                    <div className="absolute right-4 top-4 text-white text-xs bg-[#1A73E8] h-5 w-5 rounded-full flex items-center justify-center font-bold">
                                      <i className="ti ti-check" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Navigation */}
                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={!doctorId}
                          onClick={() => setStep(2)}
                          className="rounded-xl bg-[#1A73E8] text-white px-7 py-3 font-semibold hover:bg-[#1557B0] transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                        >
                          Select Schedule
                          <i className="ti ti-arrow-right text-base" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: CHOOSE DATE & TIME */}
              {step === 2 && (
                <div className="space-y-8 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Select Date &amp; Time</h2>
                    <p className="mt-1 text-sm text-slate-500">Pick a preferred day and select from the available clinic hours.</p>
                  </div>

                  {selectedDoctor && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100/50 text-[#1A73E8] flex items-center justify-center font-bold text-xs">
                        {getDoctorInitials(selectedDoctor.full_name)}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Booking With:</div>
                        <div className="text-sm font-bold text-slate-800">{selectedDoctor.full_name}</div>
                        <div className="text-xs text-slate-500">Scheduled days: {selectedDoctorWorkingDays}</div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Date Input */}
                    <div className="space-y-2.5">
                      <label className="block text-sm font-bold text-slate-600">Choose Consultation Date</label>
                      <input 
                        type="date" 
                        min={todayString} 
                        value={appointmentDate} 
                        onChange={(e) => setAppointmentDate(e.target.value)} 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-200" 
                      />
                      {appointmentDate && !isWorkingDay && (
                        <div className="text-xs text-[#D97706] font-semibold bg-amber-50 border border-amber-100/50 p-3 rounded-xl flex items-start gap-1.5 leading-relaxed mt-3">
                          <i className="ti ti-alert-triangle text-base mt-0.5" />
                          <span>Note: {selectedDoctor?.full_name} is typically not scheduled to consult on this day of the week.</span>
                        </div>
                      )}
                    </div>

                    {/* Time Slot Picker */}
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-600">Available Session Slots</label>
                      <div className="rounded-2xl border border-slate-100 bg-[#F9FAFB]/80 p-5 min-h-[140px] flex flex-col justify-center">
                        {!appointmentDate ? (
                          <div className="text-center text-xs text-slate-400 py-6">
                            <i className="ti ti-calendar text-2xl block mb-2 opacity-50" />
                            Please pick a consultation date first
                          </div>
                        ) : slotsLoading ? (
                          <div className="py-6 flex flex-col items-center justify-center gap-2">
                            <div className="animate-spin h-5 w-5 border-2 border-[#1A73E8] border-t-transparent rounded-full" />
                            <span className="text-xs text-slate-400">Loading session timeline...</span>
                          </div>
                        ) : slots.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>Clinic Hours:</span>
                              <span className="font-bold text-slate-600">8:00 AM - 4:30 PM</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {slots.map((slot) => {
                                const isSel = selectedSlot === slot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition-all text-center ${
                                      isSel
                                        ? "bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] shadow-sm font-black"
                                        : "bg-white border-slate-150 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                                    }`}
                                  >
                                    {formatTime(slot)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-[#E53935] font-semibold py-6">
                            <i className="ti ti-circle-x text-2xl block mb-2 opacity-60" />
                            <span className="text-xs">No slots available / Fully booked on this date.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-xl border border-slate-200 bg-white text-slate-700 px-6 py-3 font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <i className="ti ti-arrow-left text-base" />
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!appointmentDate || !selectedSlot}
                      onClick={() => setStep(3)}
                      className="rounded-xl bg-[#1A73E8] text-white px-7 py-3 font-semibold hover:bg-[#1557B0] transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      Fill Patient Info
                      <i className="ti ti-arrow-right text-base" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PATIENT DETAILS */}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Confirm Patient Details</h2>
                    <p className="mt-1 text-sm text-slate-500">Provide medical reasons and confirm contact credentials.</p>
                  </div>

                  {/* Patient Info Fields */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-600">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={formFields.patient_name} 
                        onChange={(e) => updateField('patient_name', e.target.value)} 
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-200" 
                        placeholder="Enter patient full name"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-600">Phone Number</label>
                        <input 
                          type="tel" 
                          required
                          value={formFields.phone} 
                          onChange={(e) => updateField('phone', e.target.value)} 
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-200" 
                          placeholder="e.g. 0771234567"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-600">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={formFields.email} 
                          onChange={(e) => updateField('email', e.target.value)} 
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-200" 
                          placeholder="e.g. patient@gmail.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-600">Reason for Visit</label>
                      <select
                        value={formFields.visit_reason}
                        onChange={(e) => updateField('visit_reason', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-200"
                      >
                        {VISIT_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-600">Symptoms &amp; Special Requests (Optional)</label>
                      <textarea 
                        rows={3} 
                        value={formFields.notes} 
                        onChange={(e) => updateField('notes', e.target.value)} 
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-200" 
                        placeholder="Briefly state symptoms, medical history or requests..." 
                      />
                    </div>
                  </div>

                  {/* Submission and Navigation */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-xl border border-slate-200 bg-white text-slate-700 px-6 py-3 font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 self-start sm:self-auto"
                    >
                      <i className="ti ti-arrow-left text-base" />
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitLoading} 
                      className="rounded-xl bg-[#1A73E8] text-white px-8 py-3.5 font-bold hover:bg-[#1557B0] transition-colors disabled:opacity-60 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          <span>Reserving Slot...</span>
                        </>
                      ) : (
                        <>
                          <i className="ti ti-calendar-plus text-base" />
                          <span>Confirm &amp; Book Appointment</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default BookAppointment;
