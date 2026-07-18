import Badge from "./Badge";
import { formatTime } from "../utils/helpers";

/**
 * Renders one row in the live queue table with queue number, patient name, doctor name, check-in time, and status.
 * @param {{ entry: { queue_number: number, patient_name: string, doctor_name: string, check_in_time: string, status: string }, showDoctor?: boolean }} props
 */
function QueueRow({ entry, showDoctor = true }) {
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
      <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{entry.patient_name}</td>
      {showDoctor && (
        <td className="px-4 py-3 text-sm text-slate-800">
          <div className="font-semibold">{entry.doctor_name || "Doctor"}</div>
          <div className="text-slate-400 text-xs">{entry.specialisation}</div>
        </td>
      )}
      <td className="px-4 py-3 text-sm text-slate-500">
        {formatTime(entry.check_in_time)}
      </td>
      <td className="px-4 py-3">
        <Badge
          text={entry.status === "in_consultation" ? "in consultation" : entry.status}
          color={statusColorMap[entry.status] || "gray"}
        />
      </td>
    </tr>
  );
}

export default QueueRow;

