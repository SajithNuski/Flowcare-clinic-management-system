// This file contains all the functions that talk to the backend for auth.

import axios from "axios";
import { API_BASE, AUTH_TOKEN_KEY } from "../utils/constants";

// Automatically attach tab-isolated Bearer token from sessionStorage to all Axios requests
axios.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically attach tab-isolated Bearer token from sessionStorage to all window.fetch requests
if (typeof window !== "undefined" && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = function (resource, init = {}) {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      init = init ? { ...init } : {};
      const headers = new Headers(init.headers || {});
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      init.headers = headers;
    }
    return originalFetch(resource, init);
  };
}

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
    if (response.data?.success && response.data?.token) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    }
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
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
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

/**
 * Changes password of the logged-in user.
 * @param {string} oldPassword
 * @param {string} newPassword
 */
export async function changePassword(oldPassword, newPassword) {
  try {
    const response = await axios.post(`${API_BASE}/auth/change_password.php`, {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, error: error.message };
  }
}
