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
 * Returns admin report data for a date range and optional filters.
 * @param {object|string} paramsObj
 * @param {string} [dateTo]
 */
export async function getReports(paramsObj, dateTo) {
  try {
    let params = {};
    if (typeof paramsObj === "object" && paramsObj !== null) {
      params = paramsObj;
    } else {
      params = { date_from: paramsObj, date_to: dateTo };
    }
    const response = await axios.get(`${API_BASE}/admin/reports.php`, { params });
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

/**
 * Updates a doctor's consultation days (dates) and consultation hours (time).
 * @param {number} doctorId
 * @param {string|string[]} workingDays - e.g. "Mon,Tue,Wed,Thu,Fri"
 * @param {string} workingTime - e.g. "09:00-17:00"
 */
export async function updateDoctorSchedule(doctorId, workingDays, workingTime) {
  try {
    const response = await axios.post(`${API_BASE}/admin/users.php`, {
      action: "update_doctor_schedule",
      doctor_id: doctorId,
      working_days: Array.isArray(workingDays) ? workingDays.join(",") : workingDays,
      working_time: workingTime,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return { success: false, error: error.message };
  }
}
