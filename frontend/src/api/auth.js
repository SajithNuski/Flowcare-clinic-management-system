// This file contains all the functions that talk to the backend for auth.

import axios from "axios";
import { API_BASE } from "../utils/constants";

/**
 * Logs a user in with an email or NIC identifier and password.
 * @param {string} identifier
 * @param {string} password
 */
export async function loginUser(identifier, password) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/auth/login.php`, {
      identifier,
      password,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Registers a new patient account.
 * @param {object} formData
 */
export async function registerUser(formData) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(
      `${API_BASE}/auth/register.php`,
      formData,
    );
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Logs the current user out of the backend session.
 */
export async function logoutUser() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/auth/logout.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Returns the currently logged-in user from the backend session.
 */
export async function getCurrentUser() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/auth/me.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}
