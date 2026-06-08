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
