import axios from "axios";
import { API_BASE } from "../utils/constants";

/**
 * Gets receptionist dashboard statistics.
 */
export async function getReceptionistStats() {
  try {
    const response = await axios.get(`${API_BASE}/receptionist/stats.php`);
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}
