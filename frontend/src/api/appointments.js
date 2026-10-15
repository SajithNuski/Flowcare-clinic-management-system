// This file contains all the functions that talk to the backend for appointments.

import { apiClient, ENDPOINTS, handleApiError } from "./config";

/**
 * Creates a new appointment.
 * @param {object} data
 */
export async function createAppointment(data) {
  try {
    const response = await apiClient.post(ENDPOINTS.APPOINTMENTS.CREATE, data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Returns the current user's appointments.
 */
export async function getMyAppointments() {
  try {
    const response = await apiClient.get(ENDPOINTS.APPOINTMENTS.LIST);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Returns today's appointments for receptionist or admin views.
 * @param {string} date
 */
export async function getTodayAppointments(date = "") {
  try {
    const response = await apiClient.get(ENDPOINTS.APPOINTMENTS.LIST, {
      params: date ? { date } : {},
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Returns the available slots for a doctor on a date.
 * @param {number} doctorId
 * @param {string} date
 */
export async function getAvailableSlots(doctorId, date) {
  try {
    const response = await apiClient.get(ENDPOINTS.APPOINTMENTS.SLOTS, {
      params: { doctor_id: doctorId, date },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Cancels an appointment by ID.
 * @param {number} appointmentId
 */
export async function cancelAppointment(appointmentId) {
  try {
    const response = await apiClient.post(ENDPOINTS.APPOINTMENTS.UPDATE, {
      appointment_id: appointmentId,
      action: "cancel",
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Reschedules an appointment to a new date and time slot.
 * @param {number} appointmentId
 * @param {string} newDate
 * @param {string} newTimeSlot
 */
export async function rescheduleAppointment(appointmentId, newDate, newTimeSlot) {
  try {
    const response = await apiClient.post(ENDPOINTS.APPOINTMENTS.UPDATE, {
      appointment_id: appointmentId,
      action: "reschedule",
      new_date: newDate,
      new_time_slot: newTimeSlot,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Marks an appointment as no-show.
 * @param {number} appointmentId
 */
export async function markNoShow(appointmentId) {
  try {
    const response = await apiClient.post(ENDPOINTS.APPOINTMENTS.UPDATE, {
      appointment_id: appointmentId,
      action: "no_show",
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
