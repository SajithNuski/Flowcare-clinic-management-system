import { apiClient, ENDPOINTS, handleApiError } from "./config";

/**
 * Retrieves payment history records for receptionist or admin.
 * @param {string} date - optional date filter (YYYY-MM-DD)
 */
export async function getPaymentsHistory(date = "") {
  try {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.LIST, {
      params: date ? { date } : {},
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
