import axios from "axios";
import { API_BASE } from "../utils/constants";

/**
 * Retrieves payment history records for receptionist or admin.
 * @param {string} date - optional date filter (YYYY-MM-DD)
 */
export async function getPaymentsHistory(date = "") {
  try {
    const url = date ? `${API_BASE}/payments/list.php?date=${date}` : `${API_BASE}/payments/list.php`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}
