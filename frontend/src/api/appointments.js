// This file contains all the functions that talk to the backend for appointments.

import axios from "axios";
import { API_BASE } from "../utils/constants";

/**
 * Creates a new appointment.
 * @param {object} data
 */
export async function createAppointment(data) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(
      `${API_BASE}/appointments/create.php`,
      data,
    );
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Returns the current user's appointments.
 */
export async function getMyAppointments() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/appointments/list.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Returns today's appointments for receptionist or admin views.
 */
export async function getTodayAppointments(date = "") {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const url = date ? `${API_BASE}/appointments/list.php?date=${date}` : `${API_BASE}/appointments/list.php`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Returns the available slots for a doctor on a date.
 * @param {number} doctorId
 * @param {string} date
 */
export async function getAvailableSlots(doctorId, date) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/appointments/slots.php`, {
      params: { doctor_id: doctorId, date },
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancels an appointment by ID.
 * @param {number} appointmentId
 */
export async function cancelAppointment(appointmentId) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/appointments/update.php`, {
      appointment_id: appointmentId,
      action: "cancel",
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Reschedules an appointment to a new date and time slot.
 * @param {number} appointmentId
 * @param {string} newDate
 * @param {string} newTimeSlot
 */
export async function rescheduleAppointment(
  appointmentId,
  newDate,
  newTimeSlot,
) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/appointments/update.php`, {
      appointment_id: appointmentId,
      action: "reschedule",
      new_date: newDate,
      new_time_slot: newTimeSlot,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Marks an appointment as no-show.
 * @param {number} appointmentId
 */
export async function markNoShow(appointmentId) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/appointments/update.php`, {
      appointment_id: appointmentId,
      action: "no_show",
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}
