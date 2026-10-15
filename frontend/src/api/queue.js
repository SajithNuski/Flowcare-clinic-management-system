// This file contains all the functions that talk to the backend for queue.

import { apiClient, ENDPOINTS, handleApiError } from "./config";

/**
 * Gets the logged-in patient's queue status for today.
 */
export async function getQueueStatus() {
  try {
    const response = await apiClient.get(ENDPOINTS.QUEUE.STATUS);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Gets the live queue for doctors or receptionists.
 */
export async function getLiveQueue(all = false) {
  try {
    const response = await apiClient.get(ENDPOINTS.QUEUE.STATUS, {
      params: all ? { all: "true" } : {},
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
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
    const response = await apiClient.post(ENDPOINTS.QUEUE.CHECKIN, {
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_id: appointmentId,
      amount: amount,
      payment_method: paymentMethod,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Calls the next waiting patient for the logged-in doctor.
 */
export async function callNextPatient() {
  try {
    const response = await apiClient.post(ENDPOINTS.QUEUE.CALL_NEXT);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Saves consultation details and completes the queue entry.
 * @param {object} data
 */
export async function completeConsultation(data) {
  try {
    const response = await apiClient.post(ENDPOINTS.QUEUE.COMPLETE, data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Marks a queue entry as no-show.
 * @param {number} queueId
 */
export async function markQueueNoShow(queueId) {
  try {
    const response = await apiClient.post(ENDPOINTS.QUEUE.NO_SHOW, {
      queue_id: queueId,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Updates a patient's queue number in the database.
 * @param {number} queueId
 * @param {number} newQueueNumber
 */
export async function updateQueueNumber(queueId, newQueueNumber) {
  try {
    const response = await apiClient.post(ENDPOINTS.QUEUE.UPDATE_NUMBER, {
      queue_id: queueId,
      queue_number: newQueueNumber,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
