import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { getDoctors } from "../api/doctors";
import { createAppointment, getAvailableSlots } from "../api/appointments";
import { VISIT_REASONS } from "../utils/constants";
import { formatTime } from "../utils/helpers";
// Import the thematic image for the left side of the split layout
import clinicImg from "../assets/images/clinic image.png";

function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
      resetFormAfterSuccess();
    } catch (err) {
      setError(err?.message || "Booking failed. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  const todayString = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar />

      <main className="flex-1">
        {/* Split layout: Image on Left (5 cols on lg), Form on Right (7 cols on lg) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-80px)] items-stretch">
          
          {/* LEFT SIDE: Large Thematic Image Showcase */}
          <div className="hidden lg:flex lg:col-span-5 items-center justify-center p-8 bg-[#F1F5F9]/30 border-r border-slate-100">
            <div className="relative w-full max-w-md h-[480px] rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-900/10 hover:shadow-blue-900/15 transition-all duration-300">
              <img 
                src={clinicImg} 
                alt="Clinic Consulting Lobby" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Dark gradient overlay to ensure high readability of text */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1A73E8]/80 to-[#0F172A]/95 flex flex-col justify-end p-8 text-white">
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-200">Badulla Medical Centre</span>
                <h1 className="text-2xl font-bold mt-1.5 mb-2 leading-tight">Your Health, Our Priority</h1>
                <p className="text-white/80 text-xs leading-relaxed">
                  Experience seamless healthcare booking. Select a specialist, view their active working days, pick an available time slot, and manage your consultation details with ease.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Booking Form */}
          <div className="lg:col-span-7 p-4 sm:p-10 lg:p-14 flex items-center justify-center bg-[#F8FAFC]">
            <div className="w-full max-w-2xl">
              
              {/* Header Text */}
              <div className="mb-6">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1A73E8]">Book Appointment</div>
                <h2 className="mt-2 text-2xl font-bold text-slate-800">Clinic Appointment Request</h2>
                <p className="mt-2 text-sm text-[#6B7280]">Select your specialist, preferred date, and verify your details below.</p>
              </div>

              {/* Status Notifications */}
              {successMessage && (
                <div className="mb-6 rounded-2xl border border-[#B7E4C7] bg-[#F1FBF5] px-4 py-3.5 text-sm text-[#166534] flex items-center gap-2">
                  <i className="ti ti-circle-check text-lg"></i>
                  <span>{successMessage}</span>
                </div>
              )}
              {error && (
                <div className="mb-6 rounded-2xl border border-[#F5C2C7] bg-[#FDEDED] px-4 py-3.5 text-sm text-[#991B1B] flex items-center gap-2">
                  <i className="ti ti-alert-triangle text-lg"></i>
                  <span>{error}</span>
                </div>
              )}

              {/* Modern Booking Form Card */}
              <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
                
                {/* section: Doctor Schedule */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i className="ti ti-stethoscope text-base text-[#1A73E8]"></i>
                    1. Consultation Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Specialization Select */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-600">Specialization</label>
                      <select 
                        value={specialisation} 
                        onChange={(e) => { 
                          setSpecialisation(e.target.value); 
                          setDoctorId(""); // Reset doctor selection
                        }} 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-200"
                      >
                        <option value="">-- Choose Specialization --</option>
                        {specialisations.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Doctor Select (Disabled until Specialization is chosen) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-600">Medical Specialist</label>
                      <select 
                        value={doctorId} 
                        onChange={(e) => setDoctorId(e.target.value)} 
                        disabled={!specialisation}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-200 disabled:opacity-60 disabled:bg-slate-100/50"
                      >
                        <option value="">-- Select Specialist --</option>
                        {filteredDoctors.map((d) => (
                          <option key={d.doctor_id} value={d.doctor_id}>
                            {d.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Show doctor working days when selected */}
                  {doctorId && selectedDoctorWorkingDays && (
                    <div className="animate-fadeIn text-xs text-[#1A73E8] bg-[#E8F0FE] px-3 py-2 rounded-lg inline-flex items-center gap-1.5 font-medium">
                      <i className="ti ti-calendar-time"></i>
                      <span>Scheduled Working Days: <strong>{selectedDoctorWorkingDays}</strong></span>
                    </div>
                  )}
                </div>

                {/* section: Date & Slots */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i className="ti ti-calendar text-base text-[#1A73E8]"></i>
                    2. Date & Scheduling
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Date Picker */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-600">Select Date</label>
                      <input 
                        type="date" 
                        min={todayString} 
                        value={appointmentDate} 
                        onChange={(e) => setAppointmentDate(e.target.value)} 
                        disabled={!doctorId}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-200 disabled:opacity-60 disabled:bg-slate-100/50" 
                      />
                      {appointmentDate && !isWorkingDay && (
                        <div className="text-xs text-[#D97706] font-medium flex items-center gap-1">
                          <span>⚠️ Doctor is typically not scheduled to work on this day.</span>
                        </div>
                      )}
                    </div>

                    {/* Session Schedule Panel */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-600">Session Schedule</label>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 min-h-[72px] flex flex-col justify-center">
                        {!doctorId || !appointmentDate ? (
                          <div className="text-xs text-slate-400 flex items-center gap-1.5">
                            <i className="ti ti-info-circle text-sm"></i>
                            Select doctor and date to view session
                          </div>
                        ) : slotsLoading ? (
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <div className="animate-spin h-3.5 w-3.5 border border-slate-400 border-t-transparent rounded-full" />
                            <span>Loading session details...</span>
                          </div>
                        ) : slots.length > 0 && selectedSlot ? (
                          <div className="space-y-1.5 animate-fadeIn">
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>Clinic Hours:</span>
                              <span className="font-semibold text-slate-700">8:00 AM - 4:30 PM</span>
                            </div>
                            <div className="flex justify-between items-center pt-1.5 border-t border-slate-100/50 mt-1">
                              <span className="text-[11px] text-slate-500">Auto-Assigned Start:</span>
                              <span className="bg-[#E8F0FE] text-[#1A73E8] px-2.5 py-0.5 rounded-lg text-xs font-bold shadow-sm">
                                {formatTime(selectedSlot)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#E53935] font-semibold flex items-center gap-1.5">
                            <i className="ti ti-alert-circle text-sm"></i>
                            No slots available / Fully booked
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* section: Patient Information */}
                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i className="ti ti-user text-base text-[#1A73E8]"></i>
                    3. Patient Information
                  </h3>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600">Full Name</label>
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
                      <label className="block text-sm font-semibold text-slate-600">Phone Number</label>
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
                      <label className="block text-sm font-semibold text-slate-600">Email Address</label>
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
                    <label className="block text-sm font-semibold text-slate-600">Symptoms / Additional Notes (Optional)</label>
                    <textarea 
                      rows={3} 
                      value={formFields.notes} 
                      onChange={(e) => updateField('notes', e.target.value)} 
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition duration-200" 
                      placeholder="Briefly state symptoms, medical history or special requests..." 
                    />
                  </div>
                </div>

                {/* Submit button & guidelines */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 pt-6">
                  <p className="text-xs text-slate-400 leading-normal max-w-xs">
                    By confirming, you agree to attend within the clinic's scheduled time session. You can manage or cancel your appointment from your dashboard.
                  </p>
                  <button 
                    type="submit" 
                    disabled={submitLoading} 
                    className="rounded-xl bg-[#1A73E8] text-white px-8 py-3.5 font-semibold text-base hover:bg-[#1557B0] transition-colors disabled:opacity-60 shadow-lg shadow-blue-500/20 shrink-0"
                  >
                    {submitLoading ? 'Booking...' : 'Confirm Appointment Booking'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default BookAppointment;
