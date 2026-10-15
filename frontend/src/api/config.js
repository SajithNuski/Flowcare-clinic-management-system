/**
 * FlowCare Central API Configuration & HTTP Client
 * 
 * Provides:
 * 1. Unified base URL resolution (production domain flowcare.great-site.net vs dev)
 * 2. Centralized endpoint registry (ENDPOINTS)
 * 3. Pre-configured Axios instance (apiClient) with automatic JWT token attachment
 * 4. Interceptors for tab-isolated authentication and uniform error handling
 * 5. Fetch wrapper (apiFetch) with automatic Authorization headers
 */

import axios from "axios";
import { AUTH_TOKEN_KEY } from "../utils/constants";

// FlowCare production deployment domain
export const PRODUCTION_DOMAIN =
  import.meta.env.VITE_PRODUCTION_DOMAIN || "flowcare.great-site.net";

/**
 * Resolves the API Base URL based on environment and runtime host:
 * - VITE_API_BASE_URL: Explicit override via environment variables (e.g. .env.production)
 * - Browser on flowcare.great-site.net: Dynamically adopts current protocol (http/https)
 * - Production builds running externally: https://flowcare.great-site.net/api
 * - Local development: /api (proxied by Vite to local XAMPP backend)
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === PRODUCTION_DOMAIN
    ? `${window.location.protocol}//${PRODUCTION_DOMAIN}/api`
    : import.meta.env.PROD
      ? `https://${PRODUCTION_DOMAIN}/api`
      : "/api");

export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;

/**
 * Central API Endpoint Registry
 * All backend routes are cataloged here to prevent fragmented URLs across components.
 */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login.php",
    REGISTER: "/auth/register.php",
    LOGOUT: "/auth/logout.php",
    ME: "/auth/me.php",
    CHANGE_PASSWORD: "/auth/change_password.php",
  },
  QUEUE: {
    STATUS: "/queue/status.php",
    CHECKIN: "/queue/checkin.php",
    CALL_NEXT: "/queue/call_next.php",
    COMPLETE: "/queue/complete.php",
    NO_SHOW: "/queue/no_show.php",
    UPDATE_NUMBER: "/queue/update_number.php",
  },
  APPOINTMENTS: {
    CREATE: "/appointments/create.php",
    LIST: "/appointments/list.php",
    SLOTS: "/appointments/slots.php",
    UPDATE: "/appointments/update.php",
  },
  DOCTORS: {
    LIST: "/doctors/list.php",
    DASHBOARD: "/doctors/dashboard.php",
    PROFILE_UPDATE: "/doctor/profile/update.php",
  },
  PATIENTS: {
    SEARCH: "/patients/search.php",
    UPDATE_PROFILE: "/patients/update_profile.php",
    REGISTER: "/patients/register.php",
  },
  CONSULTATIONS: {
    LIST: "/consultations/list.php",
    SAVE: "/consultations/save.php",
  },
  RECEPTIONIST: {
    STATS: "/receptionist/stats.php",
  },
  PAYMENTS: {
    LIST: "/payments/list.php",
  },
  ADMIN: {
    USERS: "/admin/users.php",
    PATIENTS: "/admin/patients.php",
    APPOINTMENTS: "/admin/appointments.php",
    REPORTS: "/admin/reports.php",
    ANNOUNCEMENTS: "/admin/announcements.php",
    SETTINGS: "/admin/settings.php",
    ACTIVITY_LOG: "/admin/activity_log.php",
  },
};

/**
 * Pre-configured Central Axios Client
 */
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    "Accept": "application/json",
  },
});

/**
 * Request Interceptor:
 * Attaches the sessionStorage Bearer token (tab-isolated auth) to every outgoing request.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * Normalizes error responses and handles authentication expiry uniformly.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("flowcare:unauthorized", { detail: error.response?.data }));
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Native fetch wrapper that applies central API_BASE and Authorization headers
 * @param {string} endpoint - Path relative to API_BASE or full URL
 * @param {RequestInit} init - Standard fetch options
 */
export async function apiFetch(endpoint, init = {}) {
  const url = endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? endpoint
    : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const token = typeof window !== "undefined" ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
  const headers = new Headers(init.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const options = {
    ...init,
    headers,
    credentials: init.credentials || "include",
  };

  return window.fetch(url, options);
}

/**
 * Uniform Error Extractor for API Functions
 * @param {any} error
 * @returns {{ success: false, error: string }}
 */
export function handleApiError(error) {
  if (error.response && error.response.data) {
    return error.response.data;
  }
  return {
    success: false,
    error: error.message || "An unexpected network or server error occurred.",
  };
}

export default apiClient;
