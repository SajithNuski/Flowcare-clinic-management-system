
import { apiClient, ENDPOINTS, handleApiError } from "./config";

/**
 * Searches a patient by NIC.
 * @param {string} nic
 */
export async function searchPatientByNic(nic) {
  try {
    const response = await apiClient.get(ENDPOINTS.PATIENTS.SEARCH, {
      params: { nic },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Searches patients by query (Name or NIC).
 * @param {string} q
 */
export async function searchPatients(q) {
  try {
    const response = await apiClient.get(ENDPOINTS.PATIENTS.SEARCH, {
      params: { q },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Updates the logged-in patient's profile and medical details.
 * @param {object|FormData} profileData
 */
export async function updatePatientProfile(profileData) {
  try {
    const response = await apiClient.post(ENDPOINTS.PATIENTS.UPDATE_PROFILE, profileData, {
      headers: {
        "Content-Type": profileData instanceof FormData ? "multipart/form-data" : "application/json",
      },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Registers a new patient with basic details by a receptionist.
 * @param {object} patientData
 */
export async function registerPatientByReceptionist(patientData) {
  try {
    const response = await apiClient.post(ENDPOINTS.PATIENTS.REGISTER, patientData);
    return response.data;
  } catch (error) {
    const err = handleApiError(error);
    return {
      success: false,
      error: err.error,
      exists: error.response?.data?.exists || false,
      patient: error.response?.data?.patient || null,
    };
  }
}
