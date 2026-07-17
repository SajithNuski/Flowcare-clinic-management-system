// This file contains all the functions that talk to the backend for queue.

import axios from "axios";
import { API_BASE } from "../utils/constants";

/**
 * Gets the logged-in patient's queue status for today.
 */
export async function getQueueStatus() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/queue/status.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Gets the live queue for doctors or receptionists.
 */
export async function getLiveQueue() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/queue/status.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Checks a patient into the queue.
 * @param {number} patientId
 * @param {number} doctorId
 * @param {number} appointmentId
 */
export async function checkinPatient(patientId, doctorId, appointmentId, amount = 0, paymentMethod = "") {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/queue/checkin.php`, {
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_id: appointmentId,
      amount: amount,
      payment_method: paymentMethod,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Calls the next waiting patient for the logged-in doctor.
 */
export async function callNextPatient() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/queue/call_next.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Saves consultation details and completes the queue entry.
 * @param {object} data
 */
export async function completeConsultation(data) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/queue/complete.php`, data);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Marks a queue entry as no-show.
 * @param {number} queueId
 */
export async function markQueueNoShow(queueId) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/queue/no_show.php`, {
      queue_id: queueId,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}
