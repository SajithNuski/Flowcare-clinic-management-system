import Badge from "./Badge";
import { formatTime } from "../utils/helpers";

/**
 * Renders a row in the receptionist's appointments table.
 * @param {{
 *   appointment: {
 *     id: number,
 *     patient_id: number,
 *     doctor_id: number,
 *     patient_name: string,
 *     patient_phone: string,
 *     doctor_name: string,
 *     specialisation: string,
 *     time_slot: string,
 *     visit_reason: string,
 *     notes: string,
 *     status: string
 *   },
 *   onCheckin: (patientId: number, doctorId: number, appointmentId: number) => void,
 *   onReschedule: (appointment: any) => void,
 *   onCancel: (appointmentId: number) => void,
 *   onNoShow: (appointmentId: number) => void
 * }} props
 */
function AppointmentRow({ appointment, onCheckin, onReschedule, onCancel, onNoShow }) {
  const isPending = appointment.status === "confirmed" || appointment.status === "rescheduled";
  const isCompleted = appointment.status === "completed";
  const isNoShow = appointment.status === "no_show";
  const isCancelled = appointment.status === "cancelled";

  // Map backend status strings to Badge colors
  const statusColorMap = {
    confirmed: "blue",
    rescheduled: "amber",
    completed: "green",
    no_show: "red",
    cancelled: "red",
  };

  const statusLabelMap = {
    confirmed: "Confirmed",
    rescheduled: "Rescheduled",
    completed: "Completed",
    no_show: "No Show",
    cancelled: "Cancelled",
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      {/* Patient details */}
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
            {appointment.patient_name
              ? appointment.patient_name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase()
              : "PT"}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {appointment.patient_name}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              <i className="ti ti-phone text-slate-400 mr-1" />
              {appointment.patient_phone || "No phone"}
            </div>
          </div>
        </div>
      </td>

      {/* Doctor details */}
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="text-sm font-semibold text-slate-800">
          {appointment.doctor_name}
        </div>
        <div className="text-xs text-slate-400 font-medium mt-0.5">
          {appointment.specialisation || "General Practitioner"}
        </div>
      </td>

      {/* Time slot */}
      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
        <div className="flex items-center gap-1.5">
          <i className="ti ti-clock text-[#1A73E8]" />
          <span>{formatTime(appointment.time_slot)}</span>
        </div>
      </td>

      {/* Reason for visit */}
      <td className="px-5 py-4">
        <div className="text-xs font-semibold text-slate-700 max-w-[200px] truncate">
          {appointment.visit_reason}
        </div>
        {appointment.notes && (
          <div className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate italic" title={appointment.notes}>
            "{appointment.notes}"
          </div>
        )}
      </td>

      {/* Status badge */}
      <td className="px-5 py-4 whitespace-nowrap">
        <Badge
          text={statusLabelMap[appointment.status] || appointment.status}
          color={statusColorMap[appointment.status] || "gray"}
        />
      </td>

      {/* Action buttons */}
      <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
        {isPending ? (
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={() => onCheckin(appointment.patient_id, appointment.doctor_id, appointment.id)}
              className="px-2.5 py-1.5 bg-[#10B981] hover:bg-emerald-600 text-white rounded-lg font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <i className="ti ti-user-check text-xs" />
              Check in
            </button>
            <button
              onClick={() => onReschedule(appointment)}
              className="px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <i className="ti ti-calendar-event text-xs" />
              Reschedule
            </button>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
              <button
                onClick={() => onNoShow(appointment.id)}
                className="text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
                title="Mark as No-Show"
              >
                No-Show
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => onCancel(appointment.id)}
                className="text-slate-400 hover:text-red-600 font-bold transition-colors cursor-pointer"
                title="Cancel Appointment"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic font-medium pr-2">
            No actions available
          </span>
        )}
      </td>
    </tr>
  );
}

export default AppointmentRow;
