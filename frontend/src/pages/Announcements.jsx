import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Badge from "../components/Badge";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../api/admin";
import { formatDate } from "../utils/helpers";

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const loadAnnouncements = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const res = await getAnnouncements();
      if (res?.success) {
        setAnnouncements(res.announcements || []);
      } else {
        setError(res?.error || "Failed to fetch announcements.");
      }
    } catch (err) {
      setError("An error occurred while loading announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements(true);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await createAnnouncement({
        title: title.trim(),
        message: message.trim(),
      });

      if (res?.success) {
        setSuccess("Announcement posted successfully!");
        setTitle("");
        setMessage("");
        await loadAnnouncements(false);
      } else {
        setError(res?.error || "Could not post announcement.");
      }
    } catch (err) {
      setError("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const res = await deleteAnnouncement(id);
      if (res?.success) {
        setSuccess("Announcement deleted successfully.");
        await loadAnnouncements(false);
      } else {
        setError(res?.error || "Could not delete announcement.");
      }
    } catch (err) {
      setError("An error occurred during deletion.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar role="admin" activePage="Announcements" />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-[#1A73E8] uppercase tracking-wider">
            System Configuration
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Manage Clinic Announcements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Broadcast updates, news, and critical messages to all clinic dashboards.
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2 animate-shake">
            <i className="ti ti-alert-circle text-lg" />
            <span className="font-semibold">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl border border-emerald-250 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-center gap-2 animate-pulse">
            <i className="ti ti-circle-check text-lg" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Post Announcement Form */}
          <section className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm self-start">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="ti ti-send text-[#1A73E8]" />
              Post New Announcement
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Maintenance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Message / Content
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Type your clinic-wide update here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 whitespace-pre-wrap"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#1A73E8] text-white rounded-xl hover:bg-blue-700 text-sm font-bold transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? "Publishing..." : "Publish Announcement"}
              </button>
            </form>
          </section>

          {/* Announcements List */}
          <section className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i className="ti ti-list text-[#1A73E8]" />
              Active Announcements ({announcements.length})
            </h2>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin h-8 w-8 border-4 border-[#1A73E8] border-t-transparent rounded-full" />
                <span className="text-sm text-slate-400 font-medium">Loading...</span>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                <i className="ti ti-bell-off text-4xl text-slate-300" />
                <p className="text-sm text-slate-400 mt-3 font-semibold">
                  No announcements published yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {announcements.map((ann) => (
                  <article
                    key={ann.id}
                    className="p-4 rounded-xl border border-slate-200 bg-[#FAFBFF] flex justify-between gap-4 hover:border-blue-100 transition-colors"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {ann.title}
                        </h3>
                        <Badge text="ACTIVE" color="blue" />
                      </div>
                      <p className="text-xs text-slate-655 leading-relaxed whitespace-pre-wrap break-words">
                        {ann.message}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <span>Posted by: {ann.created_by_name}</span>
                        <span>•</span>
                        <span>{formatDate(ann.created_at)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(ann.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0 self-start"
                      title="Delete Announcement"
                    >
                      <i className="ti ti-trash text-lg" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Announcements;
