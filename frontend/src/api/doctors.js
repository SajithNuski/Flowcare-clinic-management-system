// This file contains all the functions that talk to the backend for doctors.

import axios from "axios";
import { API_BASE } from "../utils/constants";

/**
 * Returns the list of active doctors for the landing page and booking form.
 */
export async function getDoctors() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/doctors/list.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Gets the dashboard details for the logged-in doctor.
 */
export async function getDoctorDashboardData() {
  try {
    const response = await axios.get(`${API_BASE}/doctors/dashboard.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

