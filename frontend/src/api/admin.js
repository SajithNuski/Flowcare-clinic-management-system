// This file contains all the functions that talk to the backend for admin.

import axios from "axios";
import { API_BASE } from "../utils/constants";

/**
 * Returns all staff users for the admin panel.
 */
export async function getAllStaff() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/admin/users.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Creates a new staff user.
 * @param {object} data
 */
export async function createStaffUser(data) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/admin/users.php`, {
      action: "create",
      ...data,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Toggles a staff user's active status.
 * @param {number} userId
 */
export async function toggleUserStatus(userId) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/admin/users.php`, {
      action: "toggle_status",
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Returns admin report data for a date range.
 * @param {string} dateFrom
 * @param {string} dateTo
 */
export async function getReports(dateFrom, dateTo) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/admin/reports.php`, {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Returns all clinic announcements.
 */
export async function getAnnouncements() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/admin/announcements.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Creates a new clinic announcement.
 * @param {object} data
 */
export async function createAnnouncement(data) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/admin/announcements.php`, {
      action: "create",
      ...data,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Deletes an announcement by ID.
 * @param {number} id
 */
export async function deleteAnnouncement(id) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/admin/announcements.php`, {
      action: "delete",
      id,
    });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Returns the current clinic settings.
 */
export async function getClinicSettings() {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.get(`${API_BASE}/admin/settings.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Updates clinic settings using key-value data.
 * @param {object} data
 */
export async function updateClinicSettings(data) {
  try {
    // We use try/catch so network or server errors turn into a clean response for the UI.
    const response = await axios.post(`${API_BASE}/admin/settings.php`, data);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}
