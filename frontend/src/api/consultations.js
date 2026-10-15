// This file contains all the functions that talk to the backend for consultations.

import { apiClient, ENDPOINTS, handleApiError } from "./config";

/**
 * Returns all consultations for the current patient.
 */
export async function getMyConsultations() {
  try {
    const response = await apiClient.get(ENDPOINTS.CONSULTATIONS.LIST);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Returns consultations for a doctor, optionally filtered by date.
 * @param {string} date
 */
export async function getDoctorConsultations(date) {
  try {
    const response = await apiClient.get(ENDPOINTS.CONSULTATIONS.LIST, {
      params: date ? { date } : {},
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Returns consultation history for a specific patient.
 * @param {number} patientId
 */
export async function getPatientMedicalHistory(patientId) {
  try {
    const response = await apiClient.get(ENDPOINTS.CONSULTATIONS.LIST, {
      params: { patient_id: patientId },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
