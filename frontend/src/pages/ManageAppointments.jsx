import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import AppointmentRow from "../components/AppointmentRow";

import {
  getTodayAppointments,
  createAppointment,
  getAvailableSlots,
  cancelAppointment,
  rescheduleAppointment,
  markNoShow,
} from "../api/appointments";
import { getDoctors } from "../api/doctors";
import { checkinPatient } from "../api/queue";
import { searchPatients } from "../api/patients";
import { VISIT_REASONS } from "../utils/constants";
import { formatDate, formatTime } from "../utils/helpers";

function ManageAppointments() {
  const location = useLocation();
  const todayStr = (() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  })();

  // Main Page States
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Reschedule Modal States
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Book Appointment Modal States
  const [showBookModal, setShowBookModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  
  // Booking Form Fields
  const [bookingForm, setBookingForm] = useState({
    patient_name: "",
    phone: "",
    email: "",
    specialisation: "",
    doctor_id: "",
    appointment_date: "",
    time_slot: "",
    visit_reason: VISIT_REASONS[0],
    notes: "",
  });
  const [bookingSlots, setBookingSlots] = useState([]);
  const [bookingSlotsLoading, setBookingSlotsLoading] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  };

  // 1. Fetch appointments for selected date
  const fetchAppointments = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await getTodayAppointments(selectedDate);
      if (res?.success && Array.isArray(res.appointments)) {
        setAppointments(res.appointments);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error("Error fetching appointments", err);
      showToast("Failed to load appointments.", "error");
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // 2. Fetch active doctors list (runs once on mount)
  const fetchDoctorsList = async () => {
    try {
      const res = await getDoctors();
      const list = Array.isArray(res) ? res : res?.doctors || [];
      setDoctors(list);
    } catch (err) {
      console.error("Error fetching doctors", err);
    }
  };

  useEffect(() => {
    fetchDoctorsList();
  }, []);

  useEffect(() => {
    fetchAppointments(true);
  }, [selectedDate]);

  useEffect(() => {
    if (location.state?.selectPatient) {
      const pat = location.state.selectPatient;
      setSelectedPatient(pat);
      setBookingForm((prev) => ({
        ...prev,
        patient_name: pat.full_name,
        phone: pat.phone || "",
        email: pat.email || "",
      }));
      setIsNewPatient(false);
      setShowBookModal(true);
      
      // Clear location state from history so it doesn't reopen on manual page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Adjust date: previous/next/today
  const changeDateByDays = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    setSelectedDate(localDate.toISOString().split("T")[0]);
  };

  // 3. Actions on Appointments
  const handleCheckin = async (patientId, doctorId, appointmentId) => {
    try {
      const res = await checkinPatient(patientId, doctorId, appointmentId);
      if (res?.success) {
        showToast("Patient checked in and added to wait queue!", "success");
        fetchAppointments(false);
      } else {
        showToast(res?.error || "Check-in failed.", "error");
      }
    } catch (err) {
      showToast("An error occurred during check-in.", "error");
    }
  };

  const handleNoShow = async (appointmentId) => {
    try {
      const res = await markNoShow(appointmentId);
      if (res?.success) {
        showToast("Appointment marked as No-Show.", "success");
        fetchAppointments(false);
      } else {
        showToast(res?.error || "Failed to update status.", "error");
      }
    } catch (err) {
      showToast("An error occurred.", "error");
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const res = await cancelAppointment(appointmentId);
      if (res?.success) {
        showToast("Appointment cancelled successfully.", "success");
        fetchAppointments(false);
      } else {
        showToast(res?.error || "Failed to cancel appointment.", "error");
      }
    } catch (err) {
      showToast("An error occurred.", "error");
    }
  };

  // 4. Reschedule Mechanics
  const handleOpenReschedule = (appointment) => {
    setReschedulingAppointment(appointment);
    setRescheduleDate(appointment.appointment_date);
    setRescheduleSlot(appointment.time_slot);
    setShowRescheduleModal(true);
  };

  // Fetch slots for rescheduling doctor on rescheduleDate change
  useEffect(() => {
    let active = true;
    const loadSlots = async () => {
      if (!reschedulingAppointment || !rescheduleDate) return;
      setRescheduleSlotsLoading(true);
      try {
        const res = await getAvailableSlots(reschedulingAppointment.doctor_id, rescheduleDate);
        const list = Array.isArray(res) ? res : res?.slots || [];
        if (active) {
          // Include the current slot of the rescheduling appointment in the options
          if (rescheduleDate === reschedulingAppointment.appointment_date && !list.includes(reschedulingAppointment.time_slot)) {
            list.push(reschedulingAppointment.time_slot);
            list.sort();
          }
          setRescheduleSlots(list);
          if (!list.includes(rescheduleSlot)) {
            setRescheduleSlot(list[0] || "");
          }
        }
      } catch (err) {
        console.error("Error loading reschedule slots", err);
      } finally {
        if (active) setRescheduleSlotsLoading(false);
      }
    };

    loadSlots();
    return () => { active = false; };
  }, [reschedulingAppointment, rescheduleDate]);

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleSlot) {
      showToast("Please select a time slot.", "error");
      return;
    }
    setRescheduleSubmitting(true);
    try {
      const res = await rescheduleAppointment(reschedulingAppointment.id, rescheduleDate, rescheduleSlot);
      if (res?.success) {
        showToast("Appointment rescheduled successfully!", "success");
        setShowRescheduleModal(false);
        setReschedulingAppointment(null);
        fetchAppointments(false);
      } else {
        showToast(res?.error || "Rescheduling failed.", "error");
      }
    } catch (err) {
      showToast("An error occurred.", "error");
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // 5. Booking Modal Mechanics
  const uniqueSpecialisations = useMemo(() => {
    return [...new Set(doctors.map((d) => d.specialisation).filter(Boolean))];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) =>
      bookingForm.specialisation ? d.specialisation === bookingForm.specialisation : true
    );
  }, [doctors, bookingForm.specialisation]);

  const selectedDoctorObj = useMemo(() => {
    return doctors.find((d) => String(d.doctor_id) === String(bookingForm.doctor_id));
  }, [doctors, bookingForm.doctor_id]);

  const doctorWorkingDays = useMemo(() => {
    return selectedDoctorObj ? selectedDoctorObj.working_days : "";
  }, [selectedDoctorObj]);

  const isWorkingDay = useMemo(() => {
    if (!bookingForm.appointment_date || !doctorWorkingDays) return true;
    const dayOfWeek = new Date(bookingForm.appointment_date).toLocaleDateString("en-US", { weekday: "short" });
    const workingDaysList = doctorWorkingDays.split(",").map(d => d.trim());
    return workingDaysList.includes(dayOfWeek);
  }, [bookingForm.appointment_date, doctorWorkingDays]);

  // Fetch slots for booking form
  useEffect(() => {
    let active = true;
    const loadBookingSlots = async () => {
      const { doctor_id, appointment_date } = bookingForm;
      if (!doctor_id || !appointment_date) {
        setBookingSlots([]);
        return;
      }
      setBookingSlotsLoading(true);
      try {
        const res = await getAvailableSlots(Number(doctor_id), appointment_date);
        const list = Array.isArray(res) ? res : res?.slots || [];
        if (active) {
          setBookingSlots(list);
          setBookingForm(prev => ({ ...prev, time_slot: list[0] || "" }));
        }
      } catch (err) {
        console.error("Error loading booking slots", err);
      } finally {
        if (active) setBookingSlotsLoading(false);
      }
    };

    loadBookingSlots();
    return () => { active = false; };
  }, [bookingForm.doctor_id, bookingForm.appointment_date]);

  const handlePatientSearch = async (e) => {
    e.preventDefault();
    if (!patientSearch.trim()) return;
    setSearchingPatients(true);
    setSelectedPatient(null);
    try {
      const res = await searchPatients(patientSearch.trim());
      if (res?.success && Array.isArray(res.patients)) {
        setPatientResults(res.patients);
        if (res.patients.length === 0) {
          showToast("No matching patient found. You can register them below.", "amber");
        }
      }
    } catch (err) {
      showToast("Patient lookup failed.", "error");
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleSelectPatient = (pat) => {
    setSelectedPatient(pat);
    setBookingForm((prev) => ({
      ...prev,
      patient_name: pat.full_name,
      phone: pat.phone || "",
      email: pat.email || "",
    }));
    setIsNewPatient(false);
    setPatientResults([]);
    setPatientSearch("");
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const { doctor_id, appointment_date, time_slot, patient_name, phone } = bookingForm;
    
    if (!patient_name.trim() || !phone.trim()) {
      showToast("Patient name and phone number are required.", "error");
      return;
    }
    if (!doctor_id) {
      showToast("Please select a doctor.", "error");
      return;
    }
    if (!appointment_date) {
      showToast("Please choose a date.", "error");
      return;
    }
    if (!time_slot) {
      showToast("Please pick an available session slot.", "error");
      return;
    }

    setBookingSubmitting(true);
    try {
      const payload = {
        patient_id: selectedPatient ? selectedPatient.id : undefined,
        doctor_id: Number(doctor_id),
        appointment_date,
        time_slot,
        visit_reason: bookingForm.visit_reason,
        notes: bookingForm.notes,
        patient_name,
        phone,
        email: bookingForm.email,
      };

      const res = await createAppointment(payload);
      if (res?.success) {
        showToast("Appointment booked successfully!", "success");
        setShowBookModal(false);
        // Reset form
        setBookingForm({
          patient_name: "",
          phone: "",
          email: "",
          specialisation: "",
          doctor_id: "",
          appointment_date: "",
          time_slot: "",
          visit_reason: VISIT_REASONS[0],
          notes: "",
        });
        setSelectedPatient(null);
        setIsNewPatient(false);
        fetchAppointments(false);
      } else {
        showToast(res?.error || "Booking failed.", "error");
      }
    } catch (err) {
      showToast("An error occurred during booking.", "error");
    } finally {
      setBookingSubmitting(false);
    }
  };

  // 6. Filtering & Searching Appointments in Frontend
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // 1. Text search match (Patient name, phone, doctor name, spec)
      const q = searchTerm.toLowerCase().trim();
      const patientMatch = app.patient_name?.toLowerCase().includes(q) || app.patient_phone?.includes(q);
      const doctorMatch = app.doctor_name?.toLowerCase().includes(q) || app.specialisation?.toLowerCase().includes(q);
      const textMatch = q ? (patientMatch || doctorMatch) : true;

      // 2. Doctor filter match
      const docMatch = selectedDoctorFilter ? String(app.doctor_id) === String(selectedDoctorFilter) : true;

      // 3. Status filter match
      const statusMatch = selectedStatusFilter ? app.status === selectedStatusFilter : true;

      return textMatch && docMatch && statusMatch;
    });
  }, [appointments, searchTerm, selectedDoctorFilter, selectedStatusFilter]);

  // Stats Counters
  const stats = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let noShows = 0;
    let cancelled = 0;

    appointments.forEach((app) => {
      if (app.status === "confirmed" || app.status === "rescheduled") pending++;
      else if (app.status === "completed") completed++;
      else if (app.status === "no_show") noShows++;
      else if (app.status === "cancelled") cancelled++;
    });

    return {
      total: appointments.length,
      pending,
      completed,
      inactive: noShows + cancelled,
    };
  }, [appointments]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar role="receptionist" activePage="Appointments" />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Toast Alerts */}
        {toast.message && (
          <div
            className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white transition-all duration-300 ${
              toast.type === "error" ? "bg-red-500 animate-bounce" : "bg-green-500 animate-pulse"
            }`}
          >
            <i className={toast.type === "error" ? "ti ti-alert-circle text-lg" : "ti ti-circle-check text-lg"} />
            <span className="font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight text-[#1A73E8]">Manage Appointments</h1>
            <p className="text-slate-500 text-xs mt-1">Schedule new consultations, manage waitlists, and review scheduling slots</p>
          </div>
          <button
            onClick={() => {
              setShowBookModal(true);
              setIsNewPatient(false);
              setSelectedPatient(null);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <i className="ti ti-calendar-plus text-base" /> Book Appointment
          </button>
        </div>

        {/* Date Navigation Widget */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 mb-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <i className="ti ti-chevron-left text-sm font-bold" />
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer ${
                selectedDate === todayStr ? "bg-blue-50 border-blue-200 text-[#1A73E8]" : ""
              }`}
            >
              Today
            </button>
            <button
              onClick={() => changeDateByDays(1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Next Day"
            >
              <i className="ti ti-chevron-right text-sm font-bold" />
            </button>
          </div>

          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="ti ti-calendar-event text-blue-600 text-lg" />
            <span>{formatDate(selectedDate)}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Go to Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Booked"
            value={stats.total}
            icon="ti ti-calendar text-blue-600 text-lg"
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Pending Check-in"
            value={stats.pending}
            icon="ti ti-clock-play text-amber-600 text-lg"
            color="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Checked-in / Done"
            value={stats.completed}
            icon="ti ti-circle-check text-green-600 text-lg"
            color="bg-green-50 text-green-600"
          />
          <StatCard
            label="No-shows & Cancelled"
            value={stats.inactive}
            icon="ti ti-calendar-cancel text-red-600 text-lg"
            color="bg-red-50 text-red-600"
          />
        </div>

        {/* Appointments Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ti ti-search text-slate-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, phone, doctor..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Doctor filter */}
              <select
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Doctors</option>
                {doctors.map((d) => (
                  <option key={d.doctor_id} value={d.doctor_id}>
                    {d.full_name} ({d.specialisation || "General"})
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="completed">Completed</option>
                <option value="no_show">No Show</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Reset Filters */}
              {(searchTerm || selectedDoctorFilter || selectedStatusFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDoctorFilter("");
                    setSelectedStatusFilter("");
                  }}
                  className="px-3 py-2 text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-slate-500 text-xs font-semibold">Loading appointments list...</span>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3 text-lg">
                  <i className="ti ti-calendar-off" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">No Appointments Found</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                  {appointments.length === 0
                    ? `No appointments scheduled for ${formatDate(selectedDate)}.`
                    : "No appointments match your search or filter settings."}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Doctor</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Time Slot</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Visit Reason</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredAppointments.map((app) => (
                    <AppointmentRow
                      key={app.id}
                      appointment={app}
                      onCheckin={handleCheckin}
                      onNoShow={handleNoShow}
                      onCancel={handleCancel}
                      onReschedule={handleOpenReschedule}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Reschedule Appointment Modal */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false);
          setReschedulingAppointment(null);
        }}
        title="Reschedule Appointment"
      >
        {reschedulingAppointment && (
          <form onSubmit={handleConfirmReschedule} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Patient:</span>
                <span className="font-semibold text-slate-800">{reschedulingAppointment.patient_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Doctor:</span>
                <span className="font-semibold text-slate-800">{reschedulingAppointment.doctor_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Original Slot:</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(reschedulingAppointment.appointment_date)} at {formatTime(reschedulingAppointment.time_slot)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select New Date</label>
              <input
                type="date"
                min={todayStr}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Session Slot</label>
              {rescheduleSlotsLoading ? (
                <div className="flex items-center gap-2 py-2 text-slate-400 text-xs">
                  <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full" />
                  <span>Loading available slots...</span>
                </div>
              ) : rescheduleSlots.length === 0 ? (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <i className="ti ti-alert-triangle" />
                  No available time slots on this date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {rescheduleSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setRescheduleSlot(slot)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                        rescheduleSlot === slot
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setReschedulingAppointment(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rescheduleSubmitting || rescheduleSlots.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
              >
                {rescheduleSubmitting ? "Updating..." : "Reschedule Appointment"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => {
          setShowBookModal(false);
          // reset form
          setBookingForm({
            patient_name: "",
            phone: "",
            email: "",
            specialisation: "",
            doctor_id: "",
            appointment_date: "",
            time_slot: "",
            visit_reason: VISIT_REASONS[0],
            notes: "",
          });
          setSelectedPatient(null);
          setIsNewPatient(false);
          setPatientSearch("");
          setPatientResults([]);
        }}
        title="Schedule Appointment"
      >
        <div className="space-y-5">
          {/* Patient Lookup Selector */}
          {!selectedPatient && !isNewPatient && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
                1. Patient Search
              </h4>
              <form onSubmit={handlePatientSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search existing patient by Name or NIC..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={searchingPatients}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {searchingPatients ? "Searching..." : "Lookup"}
                </button>
              </form>

              {/* Patient Results */}
              {patientResults.length > 0 && (
                <div className="border border-slate-100 rounded-xl max-h-[160px] overflow-y-auto divide-y divide-slate-100 bg-white">
                  {patientResults.map((pat) => (
                    <div key={pat.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{pat.full_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">NIC: {pat.nic} | Phone: {pat.phone}</div>
                      </div>
                      <button
                        onClick={() => handleSelectPatient(pat)}
                        className="px-2.5 py-1 bg-blue-50 text-[#1A73E8] hover:bg-blue-100 text-[10px] font-bold rounded transition-colors cursor-pointer"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 py-2">
                <span className="h-px bg-slate-200 flex-1"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">OR</span>
                <span className="h-px bg-slate-200 flex-1"></span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsNewPatient(true);
                  setSelectedPatient(null);
                }}
                className="w-full py-2.5 border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <i className="ti ti-user-plus" />
                Register Walk-in / New Patient details
              </button>
            </div>
          )}

          {/* Patient Details display/input */}
          {(selectedPatient || isNewPatient) && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {selectedPatient ? "1. Patient Selected" : "1. Registering Walk-in Details"}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null);
                    setIsNewPatient(false);
                    setBookingForm((prev) => ({ ...prev, patient_name: "", phone: "", email: "" }));
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Change Patient
                </button>
              </div>

              {selectedPatient ? (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{selectedPatient.full_name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">NIC: {selectedPatient.nic} | Phone: {selectedPatient.phone}</div>
                  </div>
                  <Badge text="Registered" color="blue" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.patient_name}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, patient_name: e.target.value }))}
                      placeholder="e.g. Kasun Perera"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. 0771234567"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. name@example.com"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Consultation / Date details */}
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
                  2. Booking Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Specialization</label>
                    <select
                      value={bookingForm.specialisation}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, specialisation: e.target.value, doctor_id: "" }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Choose Spec --</option>
                      {uniqueSpecialisations.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Select Doctor</label>
                    <select
                      required
                      value={bookingForm.doctor_id}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, doctor_id: e.target.value }))}
                      disabled={!bookingForm.specialisation}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-60"
                    >
                      <option value="">-- Choose Doctor --</option>
                      {filteredDoctors.map((d) => (
                        <option key={d.doctor_id} value={d.doctor_id}>
                          {d.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {bookingForm.doctor_id && doctorWorkingDays && (
                  <div className="text-[10px] text-[#1A73E8] bg-blue-50/50 px-2 py-1 rounded font-semibold inline-flex items-center gap-1">
                    <i className="ti ti-calendar" />
                    <span>Working Days: <strong>{doctorWorkingDays}</strong></span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Consultation Date</label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={bookingForm.appointment_date}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, appointment_date: e.target.value }))}
                      disabled={!bookingForm.doctor_id}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                    />
                    {bookingForm.appointment_date && !isWorkingDay && (
                      <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                        ⚠️ Typically not a scheduled working day.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Session Slot</label>
                    {bookingSlotsLoading ? (
                      <div className="flex items-center gap-2 py-2 text-slate-400 text-[10px]">
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full" />
                        <span>Fetching slots...</span>
                      </div>
                    ) : bookingSlots.length === 0 ? (
                      <div className="p-2 border border-slate-100 rounded-lg text-[10px] text-slate-400 flex items-center justify-center min-h-[32px] bg-slate-50 font-semibold">
                        {!bookingForm.doctor_id || !bookingForm.appointment_date
                          ? "Select doctor & date"
                          : "No slots / Fully booked"}
                      </div>
                    ) : (
                      <select
                        required
                        value={bookingForm.time_slot}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, time_slot: e.target.value }))}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        {bookingSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {formatTime(slot)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Visit Reason</label>
                    <select
                      value={bookingForm.visit_reason}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, visit_reason: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      {VISIT_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Notes (Optional)</label>
                    <input
                      type="text"
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Symptoms, requests..."
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setIsNewPatient(false);
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={bookingSubmitting || !bookingForm.time_slot}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer animate-pulse"
                  >
                    {bookingSubmitting ? "Booking..." : "Schedule Appointment"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default ManageAppointments;
