import axios from "axios";
import { API_BASE } from "../utils/constants";

/**
 * Searches a patient by NIC.
 * @param {string} nic
 */
export async function searchPatientByNic(nic) {
  try {
    const response = await axios.get(`${API_BASE}/patients/search.php`, {
      params: { nic },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Searches patients by query (Name or NIC).
 * @param {string} q
 */
export async function searchPatients(q) {
  try {
    const response = await axios.get(`${API_BASE}/patients/search.php`, {
      params: { q },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
}

/**
 * Updates the logged-in patient's profile and medical details.
 * @param {object} profileData
 */
export async function updatePatientProfile(profileData) {
  try {
    const response = await axios.post(`${API_BASE}/patients/update_profile.php`, profileData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, error: error.message };
  }
}

/**
 * Registers a new patient with basic details by a receptionist.
 * @param {object} patientData
 */
export async function registerPatientByReceptionist(patientData) {
  try {
    const response = await axios.post(`${API_BASE}/patients/register.php`, patientData);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      exists: error.response?.data?.exists || false,
      patient: error.response?.data?.patient || null,
    };
  }
}

