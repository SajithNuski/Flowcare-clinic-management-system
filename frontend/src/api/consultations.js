// This file contains all the functions that talk to the backend for consultations.

import axios from "axios";
import { API_BASE } from "../utils/constants";

/**
 * Returns all consultations for the current patient.
 */
export async function getMyConsultations() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/consultations/list.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Returns consultations for a doctor, optionally filtered by date.
 * @param {string} date
 */
export async function getDoctorConsultations(date) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/consultations/list.php`, {
      params: date ? { date } : {},
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}
