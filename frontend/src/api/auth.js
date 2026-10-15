// This file contains all the functions that talk to the backend for auth.

import axios from "axios";
import { apiClient, ENDPOINTS, handleApiError } from "./config";
import { AUTH_TOKEN_KEY } from "../utils/constants";

// Global fallback interceptor: attach tab-isolated Bearer token from sessionStorage to all Axios requests
axios.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global fallback interceptor: attach tab-isolated Bearer token from sessionStorage to all window.fetch requests
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
    const body = new URLSearchParams();
    body.append("identifier", identifier);
    body.append("password", password);

    const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (response.data?.success && response.data?.token) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    }
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Registers a new patient account.
 * @param {object} formData
 */
export async function registerUser(formData) {
  try {
    const body = new URLSearchParams();
    Object.keys(formData || {}).forEach((k) => {
      if (formData[k] !== undefined && formData[k] !== null) {
        body.append(k, formData[k]);
      }
    });

    const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Logs the current user out of the backend session.
 */
export async function logoutUser() {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Returns the currently logged-in user from the backend session.
 */
export async function getCurrentUser() {
  try {
    const response = await apiClient.get(ENDPOINTS.AUTH.ME);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Changes password of the logged-in user.
 * @param {string} oldPassword
 * @param {string} newPassword
 */
export async function changePassword(oldPassword, newPassword) {
  try {
    const response = await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
