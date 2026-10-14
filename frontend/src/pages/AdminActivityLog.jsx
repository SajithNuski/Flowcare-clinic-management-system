import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { getActivityLogs } from "../api/admin";
import { formatDate, formatTime } from "../utils/helpers";

export default function AdminActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [availableActions, setAvailableActions] = useState([]);

  // Filters
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchLogs = async (currentPage = page) => {
    setLoading(true);
    try {
      const res = await getActivityLogs({
        page: currentPage,
        limit: 25,
        action: selectedAction,
        date: selectedDate,
        search: search,
      });

      if (res?.success) {
        setLogs(res.logs || []);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
        setPage(res.page || 1);
        if (res.available_actions) {
          setAvailableActions(res.available_actions);
        }
      } else {
        setLogs([]);
      }
    } catch (err) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [selectedAction, selectedDate, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSelectedAction("");
    setSelectedDate("");
    setSearch("");
    setSearchInput("");
  };

  const getRoleBadgeVariant = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "danger";
      case "doctor":
        return "primary";
      case "receptionist":
        return "warning";
      case "patient":
        return "neutral";
      default:
        return "neutral";
    }
  };

  const formatActionName = (action) => {
    if (!action) return "Action";
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar role="admin" activePage="Activity Log" />

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <i className="ti ti-history text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  System Audit & Activity Log
                </h1>
                <p className="text-sm text-slate-500">
                  Track and monitor administrative, clinical, and operational actions performed across FlowCare.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              Total Log Entries: <strong className="text-slate-800">{total}</strong>
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search descriptions, user names, or action keywords..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50 focus:bg-white transition"
              />
            </div>

            {/* Action Dropdown */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full md:w-56 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700"
            >
              <option value="">All Action Types</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {formatActionName(act)}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full md:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-700"
            />

            <button
              type="submit"
              className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              Apply Filter
            </button>

            {(selectedAction || selectedDate || search) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full md:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition"
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Loading system audit log..." />
          ) : logs.length === 0 ? (
            <EmptyState
              icon="ti ti-history-off"
              title="No activity records found"
              description="No logged events match the selected criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                        <div>{formatDate(log.created_at)}</div>
                        <div className="text-slate-400">{formatTime(log.created_at)}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {log.user_name}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={getRoleBadgeVariant(log.user_role)}>
                          {log.user_role}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-md">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && pages > 1 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing page <strong className="text-slate-700">{page}</strong> of{" "}
                <strong className="text-slate-700">{pages}</strong> ({total} total entries)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => fetchLogs(page - 1)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => fetchLogs(page + 1)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
