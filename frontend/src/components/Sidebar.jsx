import { Link } from "react-router-dom";

/**
 * Renders the left dashboard sidebar for a logged-in user.
 * @param {{ role: string, activePage: string }} props
 */
function Sidebar({ role, activePage }) {
  const menuByRole = {
    patient: [
      {
        label: "Dashboard",
        to: "/patient/dashboard",
        icon: "ti ti-layout-dashboard",
      },
      {
        label: "My Queue",
        to: "/patient/consultations",
        icon: "ti ti-list-numbers",
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
      { label: "Register Patient", to: "/register", icon: "ti ti-user-plus" },
      {
        label: "Appointments",
        to: "/receptionist/appointments",
        icon: "ti ti-calendar-event",
      },
      { label: "Queue", to: "/receptionist/queue", icon: "ti ti-list-numbers" },
      {
        label: "Search Patient",
        to: "/receptionist/search",
        icon: "ti ti-search",
      },
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
      { label: "User Accounts", to: "/admin/users", icon: "ti ti-users" },
      {
        label: "Clinic Settings",
        to: "/admin/settings",
        icon: "ti ti-settings",
      },
      { label: "Reports", to: "/admin/reports", icon: "ti ti-chart-bar" },
      {
        label: "Announcements",
        to: "/admin/announcements",
        icon: "ti ti-megaphone",
      },
      { label: "Activity Log", to: "/admin/reports", icon: "ti ti-logs" },
    ],
  };

  const items = menuByRole[role] || [];

  return (
    <aside className="h-full w-48 border-r border-gray-200 bg-white py-4">
      <nav className="space-y-1">
        {items.map((item) => {
          const active = activePage === item.label;

          return (
            <Link
              key={item.label}
              to={item.to}
              className={
                "flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 " +
                (active
                  ? "border-r-2 border-blue-600 bg-blue-50 font-medium text-blue-700"
                  : "")
              }
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
