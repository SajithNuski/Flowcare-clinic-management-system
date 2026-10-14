import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { getMyConsultations } from "../api/consultations";
import { formatDate } from "../utils/helpers";

export default function MyConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Selected consultation for full view/print modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await getMyConsultations();
        if (res?.success && Array.isArray(res.consultations)) {
          setConsultations(res.consultations);
        } else {
          setConsultations([]);
        }
      } catch (err) {
        setError("Failed to load your consultations history.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredConsultations = consultations.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const docName = (c.doctor_name || "").toLowerCase();
    const diag = (c.diagnosis || "").toLowerCase();
    const notes = (c.notes || "").toLowerCase();
    const ref = (c.referral || "").toLowerCase();
    return docName.includes(q) || diag.includes(q) || notes.includes(q) || ref.includes(q);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar role="patient" activePage="Consultations" />

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <i className="ti ti-notes text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  My Consultations & Prescriptions
                </h1>
                <p className="text-sm text-slate-500">
                  Review your clinical visits, past diagnoses, medical instructions, and referrals.
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/patient/book"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <i className="ti ti-calendar-plus" />
            Book New Appointment
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Visits</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{consultations.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
              <i className="ti ti-heart-rate-monitor" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Latest Consultation</p>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {consultations.length > 0 ? formatDate(consultations[0].created_at) : "None yet"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              <i className="ti ti-calendar-check" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Treating Doctors</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {new Set(consultations.map((c) => c.doctor_id)).size}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
              <i className="ti ti-stethoscope" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3">
          <i className="ti ti-search text-slate-400 text-lg" />
          <input
            type="text"
            placeholder="Search consultations by Doctor, Diagnosis, or Medical Notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-transparent border-none focus:outline-none text-slate-800"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Fetching your medical consultations..." />
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        ) : filteredConsultations.length === 0 ? (
          <EmptyState
            icon="ti ti-notes-off"
            title={searchTerm ? "No matching records found" : "No consultations recorded yet"}
            description={
              searchTerm
                ? `No visits match your search query "${searchTerm}".`
                : "You have not completed any clinic consultations yet. Book an appointment to see a doctor."
            }
            actionLabel={!searchTerm ? "Book an Appointment" : undefined}
            onAction={!searchTerm ? () => (window.location.href = "/patient/book") : undefined}
          />
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                      <i className="ti ti-stethoscope" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Dr. {c.doctor_name || "Assigned Physician"}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Visit Date: {formatDate(c.created_at)}
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {c.diagnosis || "General Consultation"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Doctor's Notes & Advice
                    </span>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {c.notes || "No additional notes provided."}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Referral / Follow-up
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {c.referral ? c.referral : "No external referral or follow-up required."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecord(c);
                      setShowModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    <i className="ti ti-file-text" />
                    View & Print Clinical Slip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detailed Consultation Slip Modal */}
        {showModal && selectedRecord && (
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Clinical Consultation Record"
          >
            <div className="space-y-6 printable-area">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">FlowCare Medical Center</h3>
                  <p className="text-xs text-slate-500">Official Patient Clinical Summary</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400 block">Record #{selectedRecord.id}</span>
                  <span className="text-xs text-slate-500">{formatDate(selectedRecord.created_at)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400 block">Physician</span>
                  <strong className="text-slate-800">Dr. {selectedRecord.doctor_name}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Primary Diagnosis</span>
                  <strong className="text-slate-800">{selectedRecord.diagnosis || "General Consultation"}</strong>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Clinical Examination & Instructions
                </h4>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line shadow-inner">
                  {selectedRecord.notes}
                </div>
              </div>

              {selectedRecord.referral && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Referral / Prescription Instructions
                  </h4>
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-sm text-blue-900 leading-relaxed">
                    {selectedRecord.referral}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
                >
                  <i className="ti ti-printer" />
                  Print Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
