// This file contains all the functions that talk to the backend for admin.

import { apiClient, ENDPOINTS, handleApiError } from "./config";

/**
 * Returns all staff users for the admin panel.
 */
export async function getAllStaff() {
  try {
    const response = await apiClient.get(ENDPOINTS.ADMIN.USERS);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Creates a new staff user.
 * @param {object} data
 */
export async function createStaffUser(data) {
  try {
    const response = await apiClient.post(ENDPOINTS.ADMIN.USERS, {
      action: "create",
      ...data,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Toggles a staff user's active status.
 * @param {number} userId
 */
export async function toggleUserStatus(userId) {
  try {
    const response = await apiClient.post(ENDPOINTS.ADMIN.USERS, {
      action: "toggle_status",
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
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
    const response = await apiClient.get(ENDPOINTS.ADMIN.REPORTS, { params });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Returns all clinic announcements.
 */
export async function getAnnouncements() {
  try {
    const response = await apiClient.get(ENDPOINTS.ADMIN.ANNOUNCEMENTS);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Creates a new clinic announcement.
 * @param {object} data
 */
export async function createAnnouncement(data) {
  try {
    const response = await apiClient.post(ENDPOINTS.ADMIN.ANNOUNCEMENTS, {
      action: "create",
      ...data,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Deletes an announcement by ID.
 * @param {number} id
 */
export async function deleteAnnouncement(id) {
  try {
    const response = await apiClient.post(ENDPOINTS.ADMIN.ANNOUNCEMENTS, {
      action: "delete",
      id,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Returns the current clinic settings.
 */
export async function getClinicSettings() {
  try {
    const response = await apiClient.get(ENDPOINTS.ADMIN.SETTINGS);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Updates clinic settings using key-value data.
 * @param {object} data
 */
export async function updateClinicSettings(data) {
  try {
    const response = await apiClient.post(ENDPOINTS.ADMIN.SETTINGS, data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
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
    const response = await apiClient.post(ENDPOINTS.ADMIN.USERS, {
      action: "update_doctor_schedule",
      doctor_id: doctorId,
      working_days: Array.isArray(workingDays) ? workingDays.join(",") : workingDays,
      working_time: workingTime,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Returns paginated system activity and audit logs.
 * @param {object} params - { page, limit, action, search, date }
 */
export async function getActivityLogs(params = {}) {
  try {
    const response = await apiClient.get(ENDPOINTS.ADMIN.ACTIVITY_LOG, { params });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
