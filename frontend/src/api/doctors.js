// This file contains all the functions that talk to the backend for doctors.

import { apiClient, ENDPOINTS, handleApiError } from "./config";

/**
 * Returns the list of active doctors for the landing page and booking form.
 */
export async function getDoctors() {
  try {
    const response = await apiClient.get(ENDPOINTS.DOCTORS.LIST);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Gets the dashboard details for the logged-in doctor.
 */
export async function getDoctorDashboardData() {
  try {
    const response = await apiClient.get(ENDPOINTS.DOCTORS.DASHBOARD);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Updates the profile of the logged-in doctor.
 * @param {FormData} formData
 */
export async function updateDoctorProfile(formData) {
  try {
    const response = await apiClient.post(ENDPOINTS.DOCTORS.PROFILE_UPDATE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
