import Badge from "./Badge";
import { formatTime } from "../utils/helpers";

/**
 * Renders one row in the live queue table with queue number, patient name, check-in time, and status.
 * @param {{ entry: { queue_number: number, patient_name: string, check_in_time: string, status: string } }} props
 */
function QueueRow({ entry }) {
  const statusColorMap = {
    waiting: "amber",
    in_consultation: "blue",
    completed: "gray",
    no_show: "red",
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {entry.queue_number}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{entry.patient_name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatTime(entry.check_in_time)}
      </td>
      <td className="px-4 py-3">
        <Badge
          text={entry.status}
          color={statusColorMap[entry.status] || "gray"}
        />
      </td>
    </tr>
  );
}

export default QueueRow;
