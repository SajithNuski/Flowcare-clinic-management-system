import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Renders the left dashboard sidebar for a logged-in user.
 * @param {{ role: string, activePage: string }} props
 */
function Sidebar({ role, activePage }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuByRole = {
    patient: [
      {
        label: "Dashboard",
        to: "/patient/dashboard",
        icon: "ti ti-layout-dashboard",
      },
      {
        label: "Book Appointment",
        to: "/patient/book",
        icon: "ti ti-calendar-plus",
      },
      {
        label: "Consultations",
        to: "/patient/consultations",
        icon: "ti ti-notes",
      },
      { label: "Profile", to: "/patient/profile", icon: "ti ti-user" },
    ],
    receptionist: [
      {
        label: "Dashboard",
        to: "/receptionist/dashboard",
        icon: "ti ti-layout-dashboard",
      },
      {
        label: "Appointments",
        to: "/receptionist/appointments",
        icon: "ti ti-calendar-event",
      },
      { label: "Queue", to: "/receptionist/queue", icon: "ti ti-list-numbers" },
      { label: "Payments", to: "/receptionist/payments", icon: "ti ti-cash" },
    ],
    doctor: [
      {
        label: "Dashboard",
        to: "/doctor/dashboard",
        icon: "ti ti-layout-dashboard",
      },
      {
        label: "My Queue",
        to: "/doctor/consultations",
        icon: "ti ti-list-numbers",
      },
      {
        label: "All Patients",
        to: "/doctor/consultations",
        icon: "ti ti-users",
      },
      {
        label: "Consultations",
        to: "/doctor/consultations",
        icon: "ti ti-notes",
      },
    ],
    admin: [
      {
        label: "Dashboard",
        to: "/admin/dashboard",
        icon: "ti ti-layout-dashboard",
      },
      { label: "Staff", to: "/admin/users", icon: "ti ti-users" },
      { label: "Patients", to: "/admin/patients", icon: "ti ti-user-heart" },
      {
        label: "Appointments",
        to: "/admin/appointments",
        icon: "ti ti-calendar-event",
      },
      { label: "Report", to: "/admin/reports", icon: "ti ti-chart-bar" },
      { label: "Settings", to: "/admin/settings", icon: "ti ti-settings" },
    ],
  };

  const items = menuByRole[role] || [];
  const isActive = (item) => {
    if (activePage) {
      return activePage === item.label;
    }
    return location.pathname === item.to;
  };

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const roleLabels = {
    admin: "System Admin",
    receptionist: "Front Desk Staff",
    doctor: "Medical Doctor",
    patient: "Clinic Patient",
  };
  const roleLabel = roleLabels[role] || role;

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "US";

  return (
    <aside className="flex min-h-screen w-48 shrink-0 flex-col border-r border-[#1e2f4d] bg-[#0E1E38]">
      <div className="border-b border-[#1e2f4d] px-4 py-4">
        <Link to={`/${role}/dashboard`} className="block">
          <div className="text-lg font-bold leading-tight text-white">
            FlowCare
          </div>
          <div className="text-[11px] text-blue-300/60">Clinic Management</div>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3">
        <div className="space-y-1">
          {items.map((item) => {
            const active = isActive(item);

            return (
              <Link
                key={item.label}
                to={item.to}
                className={
                  "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm transition-colors duration-150 " +
                  (active
                    ? "border-l-4 border-[#1A73E8] bg-[#1A73E8]/20 font-semibold text-white"
                    : "text-blue-200 hover:bg-[#1A73E8]/10 hover:text-white")
                }
              >
                <i className={`${item.icon} text-base`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto border-t border-[#1e2f4d] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              {user?.full_name || "User"}
            </div>
            <div className="text-[11px] text-blue-300/70 capitalize">
              {roleLabel}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-blue-200 transition-colors duration-150 hover:bg-[#1A73E8]/10 hover:text-white"
        >
          <i className="ti ti-logout text-base" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
