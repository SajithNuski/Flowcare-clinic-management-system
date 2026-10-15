import { apiClient, ENDPOINTS, handleApiError } from "./config";

/**
 * Gets receptionist dashboard statistics.
 * @param {string|null} date - optional date filter (YYYY-MM-DD)
 */
export async function getReceptionistStats(date = null) {
  try {
    const params = date ? { date } : {};
    const response = await apiClient.get(ENDPOINTS.RECEPTIONIST.STATS, { params });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
