import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sidebar from "../components/Sidebar";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { getInitials, formatDate } from "../utils/helpers";
import { getAnnouncements, getAllStaff, getReports } from "../api/admin";

function formatShortDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}

function formatWaitTime(value) {
  if (value === null || value === undefined || value === "") return "0 min";

  const numericValue = Number(value);
  return `${numericValue.toFixed(Number.isInteger(numericValue) ? 0 : 1)} min`;
}

function MetricCard({ label, value, detail, icon, accentClass }) {
  return (
    <div className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#6B7280]">
            {label}
          </p>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">
            {value}
          </div>
          {detail ? (
            <p className="mt-2 text-sm text-[#6B7280]">{detail}</p>
          ) : null}
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentClass}`}
        >
          <i className={`ti ${icon} text-lg`} />
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [staff, setStaff] = useState([]);
  const [reports, setReports] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reportRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);

    const toYmd = (date) => date.toISOString().slice(0, 10);

    return {
      from: toYmd(start),
      to: toYmd(end),
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [staffResult, reportsResult, announcementsResult] =
          await Promise.all([
            getAllStaff(),
            getReports(reportRange.from, reportRange.to),
            getAnnouncements(),
          ]);

        if (!active) return;

        setStaff(
          staffResult?.success && Array.isArray(staffResult.users)
            ? staffResult.users
            : [],
        );
        setReports(
          reportsResult && !reportsResult.error ? reportsResult : null,
        );
        setAnnouncements(
          announcementsResult?.success &&
            Array.isArray(announcementsResult.announcements)
            ? announcementsResult.announcements
            : [],
        );
      } catch (fetchError) {
        if (active) {
          setError("Unable to load admin dashboard data.");
          setStaff([]);
          setReports(null);
          setAnnouncements([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [reportRange.from, reportRange.to]);

  const staffCount = staff.length;
  const activeStaffCount = staff.filter(
    (item) => item.status === "active",
  ).length;
  const doctorCount = staff.filter((item) => item.role === "doctor").length;
  const receptionistCount = staff.filter(
    (item) => item.role === "receptionist",
  ).length;

  const chartData = (reports?.daily_trend || []).map((item) => ({
    ...item,
    label: formatShortDate(item.date),
    count: Number(item.count || 0),
  }));

  const doctorSummary = new Map(
    (reports?.per_doctor || []).map((row) => [row.doctor_name, row]),
  );

  const staffRows = staff.map((member) => ({
    ...member,
    summary:
      member.role === "doctor" ? doctorSummary.get(member.full_name) : null,
  }));

  const latestAnnouncements = announcements.slice(0, 3);

  return (
    <div className="flex min-h-screen bg-[#F5F7FB] text-[#0F172A]">
      <Sidebar role="admin" activePage="Dashboard" />

      <main className="min-w-0 flex-1">
        <header className="border-b border-[#E6EEF3] bg-white/95 px-6 py-4 shadow-sm backdrop-blur-sm sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1A73E8]">
                Clinic Admin
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0F172A]">
                Dashboard
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
                Monitor clinic activity, review staff performance, and keep the
                admin side of FlowCare moving.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="hidden min-w-[240px] items-center gap-2 rounded-xl border border-[#E5EAF2] bg-[#F8FAFF] px-3 py-2 text-sm text-[#6B7280] shadow-sm md:flex">
                <i className="ti ti-search text-[#9CA3AF]" />
                <input
                  type="search"
                  placeholder="Search data, staff, or reports..."
                  className="w-full bg-transparent outline-none placeholder:text-[#9CA3AF]"
                />
              </label>

              <button
                type="button"
                onClick={() => navigate("/admin/settings")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1A73E8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                <i className="ti ti-settings" />
                System Settings
              </button>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 sm:px-8">
          {error ? (
            <div className="mb-6 rounded-2xl border border-[#FDEDEC] bg-[#FFF5F5] px-4 py-3 text-sm text-[#C53030]">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Active Staff"
              value={loading ? "..." : activeStaffCount}
              detail={`${doctorCount} doctors, ${receptionistCount} receptionists`}
              icon="ti-users"
              accentClass="bg-[#E8F0FE] text-[#1A73E8]"
            />
            <MetricCard
              label="Completed Consultations"
              value={loading ? "..." : (reports?.total_consultations ?? 0)}
              detail={`From ${formatDate(reportRange.from)} to ${formatDate(reportRange.to)}`}
              icon="ti-check"
              accentClass="bg-[#EAFAF1] text-[#22A06B]"
            />
            <MetricCard
              label="Walk-ins"
              value={loading ? "..." : (reports?.total_walkins ?? 0)}
              detail="Patients added directly from the queue"
              icon="ti-list-numbers"
              accentClass="bg-[#FFF4E5] text-[#D9822B]"
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">
                    Weekly Activity
                  </h2>
                  <p className="text-sm text-[#6B7280]">
                    Completed consultations across the selected period.
                  </p>
                </div>
                <div className="rounded-lg border border-[#DCE6F3] bg-[#F8FAFF] px-3 py-1.5 text-xs font-medium text-[#334155]">
                  Last 7 Days
                </div>
              </div>

              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E8EEF7"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(26,115,232,0.08)" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E5EAF2",
                      }}
                    />
                    <Bar dataKey="count" fill="#8FB6F4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#0F172A]">
                      Admin Snapshot
                    </h2>
                    <p className="text-sm text-[#6B7280]">
                      Quick overview of clinic administration.
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8]">
                    <i className="ti ti-layout-dashboard" />
                  </div>
                </div>

                <div className="mt-5 space-y-4 text-sm text-[#334155]">
                  <div className="flex items-center justify-between">
                    <span>Admin</span>
                    <span className="font-medium text-[#0F172A]">
                      {user?.full_name || "System Admin"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Staff Accounts</span>
                    <span className="font-medium text-[#0F172A]">
                      {staffCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Announcements</span>
                    <span className="font-medium text-[#0F172A]">
                      {announcements.length}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#0F172A]">
                      Recent Announcements
                    </h2>
                    <p className="text-sm text-[#6B7280]">
                      Latest clinic-wide updates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/announcements")}
                    className="text-sm font-medium text-[#1A73E8] hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  {latestAnnouncements.length > 0 ? (
                    latestAnnouncements.map((announcement) => (
                      <article
                        key={announcement.id}
                        className="rounded-xl border border-[#EEF2F7] bg-[#FAFBFF] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-[#0F172A]">
                            {announcement.title}
                          </h3>
                          <Badge text="NEW" color="blue" />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#556070]">
                          {announcement.message}
                        </p>
                        <p className="mt-3 text-xs text-[#94A3B8]">
                          {formatDate(announcement.created_at)}
                        </p>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#DCE6F3] px-4 py-8 text-center text-sm text-[#6B7280]">
                      No announcements yet.
                    </div>
                  )}
                </div>
              </section>
            </aside>
          </div>

          <section className="mt-6 rounded-2xl border border-[#E5EAF2] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#EEF2F7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  Staff Overview
                </h2>
                <p className="text-sm text-[#6B7280]">
                  Current doctors and receptionists working in the clinic.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/users")}
                className="inline-flex items-center gap-2 self-start rounded-lg border border-[#DCE6F3] bg-[#F8FAFF] px-3 py-2 text-sm font-medium text-[#334155] transition hover:bg-[#F1F7FF]"
              >
                <span>View All Staff</span>
                <i className="ti ti-arrow-right" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#FAFBFF] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                  <tr>
                    <th className="px-5 py-3">Staff Member</th>
                    <th className="px-5 py-3">Specialty</th>
                    <th className="px-5 py-3">Current Status</th>
                    <th className="px-5 py-3">Activity</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EEF2F7]">
                  {staffRows.length > 0 ? (
                    staffRows.map((member) => {
                      const isDoctor = member.role === "doctor";
                      const statusText =
                        member.status === "active" ? "On Duty" : "Off Duty";
                      const statusColor =
                        member.status === "active" ? "green" : "red";
                      const activity = isDoctor
                        ? `${member.summary?.total_completed ?? 0} completed`
                        : "Front desk";

                      return (
                        <tr key={member.id} className="align-middle">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0FE] text-sm font-semibold text-[#1A73E8]">
                                {getInitials(member.full_name)}
                              </div>
                              <div>
                                <div className="font-medium text-[#0F172A]">
                                  {member.full_name}
                                </div>
                                <div className="text-xs text-[#94A3B8]">
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-[#334155]">
                            {isDoctor
                              ? member.specialisation || "Doctor"
                              : "Receptionist"}
                          </td>

                          <td className="px-5 py-4">
                            <Badge text={statusText} color={statusColor} />
                          </td>

                          <td className="px-5 py-4 text-[#334155]">
                            {activity}
                          </td>

                          <td className="px-5 py-4 text-[#94A3B8]">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5EAF2] transition hover:bg-[#F8FAFF]"
                              aria-label={`More actions for ${member.full_name}`}
                            >
                              <i className="ti ti-dots-vertical" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        className="px-5 py-8 text-center text-sm text-[#6B7280]"
                        colSpan={5}
                      >
                        No staff records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
