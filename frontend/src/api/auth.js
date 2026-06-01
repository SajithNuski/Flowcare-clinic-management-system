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
    const body = new URLSearchParams();
    body.append("identifier", identifier);
    body.append("password", password);

    const response = await axios.post(`${API_BASE}/auth/login.php`, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  } catch (error) {
    // If the server returned a JSON error body, forward it so UI can show detailed messages
    if (error.response && error.response.data) {
      return error.response.data;
    }

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
    // Send as form-encoded so the PHP backend reliably receives values in $_POST
    const body = new URLSearchParams();
    Object.keys(formData || {}).forEach((k) => {
      if (formData[k] !== undefined && formData[k] !== null) {
        body.append(k, formData[k]);
      }
    });

    const response = await axios.post(`${API_BASE}/auth/register.php`, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  } catch (error) {
    // Forward server JSON error responses when available so the UI shows the exact message
    if (error.response && error.response.data) {
      return error.response.data;
    }

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
