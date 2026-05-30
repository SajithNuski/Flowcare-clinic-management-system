import Badge from "./Badge";
import { getInitials } from "../utils/helpers";

/**
 * Renders a doctor profile card with initials, specialty, schedule details, and a booking button.
 * @param {{ doctor: { full_name: string, specialisation: string, working_days: string, bio: string } }} props
 */
function DoctorCard({ doctor }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
          {getInitials(doctor.full_name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            {doctor.full_name}
          </h3>
          <div className="mt-2">
            <Badge
              text={doctor.specialisation || "General Physician"}
              color="blue"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm text-gray-600">
        <div className="flex items-start gap-2">
          <i className="ti ti-calendar text-gray-400" />
          <span>{doctor.working_days || "Mon,Tue,Wed,Thu,Fri"}</span>
        </div>
        <p className="leading-6 text-gray-600">
          {doctor.bio || "No bio available."}
        </p>
      </div>

      <button type="button" className="btn-primary mt-5 w-full">
        Book appointment
      </button>
    </div>
  );
}

export default DoctorCard;
