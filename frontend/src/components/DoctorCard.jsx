import { Link } from "react-router-dom";
import Badge from "./Badge";
import { getInitials } from "../utils/helpers";

/**
 * Renders a doctor profile card with initials, specialty, schedule details, and a booking button.
 * @param {{ doctor: { full_name: string, specialisation: string, working_days: string, bio: string } }} props
 */
function DoctorCard({ doctor }) {
  const initials = getInitials(doctor.full_name);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all duration-200 hover:border-[rgba(26,115,232,0.18)] hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#E8F0FE] bg-white text-xl font-semibold text-[#1A73E8]">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-[#1F2937]">
            {doctor.full_name}
          </h3>
          <p className="mt-1 text-xs text-[#9CA3AF]">MBBS</p>
          <div className="mt-3">
            <Badge
              text={doctor.specialisation || "General Physician"}
              color="blue"
            />
          </div>
        </div>
      </div>

      <div className="my-4 border-t border-[#E5E7EB]" />

      <div className="space-y-3 text-sm text-[#4B5563]">
        <div className="flex items-start gap-2">
          <i className="ti ti-calendar text-[#9CA3AF]" />
          <span>{doctor.working_days || "Mon, Tue, Wed, Thu, Fri"}</span>
        </div>
        <p className="leading-6 text-[#4B5563]">
          {doctor.bio || "No bio available."}
        </p>
      </div>

      <Link
        to="/register"
        className="mt-5 inline-flex items-center text-sm font-medium text-[#1A73E8] transition-all duration-200 hover:underline"
      >
        Book Appointment
      </Link>
    </article>
  );
}

export default DoctorCard;
