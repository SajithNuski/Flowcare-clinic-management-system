import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";

function ManagePatients() {
  const { user: currentUser } = useAuth();

  // State variables
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch all patients from backend
  const fetchPatients = async () => {
    try {
      setError("");
      const res = await fetch("/api/admin/patients.php", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setPatients(data.patients || []);
      } else {
        setError(data.error || "Failed to load patients list.");
      }
    } catch (err) {
      setError("An error occurred while connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle patient status (active <-> inactive)
  const handleToggleStatus = async (patientId, currentStatus) => {
    setError("");
    setSuccess("");

    const actionText = currentStatus === "active" ? "Deactivate" : "Activate";
    if (!window.confirm(`Are you sure you want to ${actionText.toLowerCase()} this patient account?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/patients.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggle_status",
          patient_id: patientId,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Patient account has been successfully ${actionText.toLowerCase()}d.`);
        fetchPatients();
        
        // If the toggled patient is currently viewed in modal, update it
        if (selectedPatient && selectedPatient.id === patientId) {
          setSelectedPatient(prev => ({
            ...prev,
            status: data.status
          }));
        }
      } else {
        setError(data.error || "Failed to update patient account status.");
      }
    } catch (err) {
      setError("Failed to update status. Server connection issue.");
    }
  };

  // Helper: Calculate age from Date of Birth
  const getAge = (dobString) => {
    if (!dobString) return "—";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Helper: Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  // Calculate statistics
  const getStats = () => {
    const total = patients.length;
    const active = patients.filter((p) => p.status === "active").length;
    const inactive = patients.filter((p) => p.status === "inactive").length;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const newThisMonth = patients.filter((p) => {
      if (!p.created_at) return false;
      const created = new Date(p.created_at);
      return (
        created.getFullYear() === currentYear &&
        created.getMonth() === currentMonth
      );
    }).length;

    return { total, active, inactive, newThisMonth };
  };

  const stats = getStats();

  // Filter patients based on tab and search query
  const filteredPatients = patients.filter((patient) => {
    // 1. Status Filter
    if (activeTab === "active" && patient.status !== "active") return false;
    if (activeTab === "inactive" && patient.status !== "inactive") return false;

    // 2. Search Query Filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const nameMatch = patient.full_name
      ? patient.full_name.toLowerCase().includes(query)
      : false;
    const nicMatch = patient.nic ? patient.nic.toLowerCase().includes(query) : false;
    const phoneMatch = patient.phone
      ? patient.phone.toLowerCase().includes(query)
      : false;

    return nameMatch || nicMatch || phoneMatch;
  });

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleOpenDetailModal = (patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar role="admin" activePage="Patients" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patients Directory</h1>
              <p className="text-sm text-slate-500 font-medium">Manage and view registered clinic patients</p>
            </div>

            {/* Error and Success Alerts */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm flex items-center justify-between bg-red-50 text-red-700 border border-red-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <i className="ti ti-alert-circle text-lg"></i>
                  <span className="font-semibold">{error}</span>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-500 hover:text-red-700 font-bold focus:outline-none cursor-pointer"
                >
                  &times;
                </button>
              </div>
            )}

            {success && (
              <div className="rounded-xl px-4 py-3 text-sm flex items-center justify-between bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <i className="ti ti-circle-check text-lg"></i>
                  <span className="font-semibold">{success}</span>
                </div>
                <button
                  onClick={() => setSuccess("")}
                  className="text-emerald-500 hover:text-emerald-700 font-bold focus:outline-none cursor-pointer"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Total Patients */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</span>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                    {loading ? "..." : stats.total}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <i className="ti ti-users text-2xl" />
                </div>
              </div>

              {/* Card 2: Active Patients */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</span>
                  <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">
                    {loading ? "..." : stats.active}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <i className="ti ti-user-check text-2xl" />
                </div>
              </div>

              {/* Card 3: Inactive Patients */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactive</span>
                  <h3 className="text-3xl font-extrabold text-slate-500 mt-2">
                    {loading ? "..." : stats.inactive}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <i className="ti ti-user-x text-2xl" />
                </div>
              </div>

              {/* Card 4: New This Month */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">New This Month</span>
                  <h3 className="text-3xl font-extrabold text-blue-600 mt-2">
                    {loading ? "..." : stats.newThisMonth}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50/70 text-blue-600">
                  <i className="ti ti-user-plus text-2xl" />
                </div>
              </div>
            </div>

            {/* Filter controls and search field */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-[#1A73E8] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setActiveTab("active")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === "active"
                      ? "bg-[#1A73E8] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Active ({stats.active})
                </button>
                <button
                  onClick={() => setActiveTab("inactive")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === "inactive"
                      ? "bg-[#1A73E8] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Inactive ({stats.inactive})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                  <i className="ti ti-search text-base" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, NIC, or phone..."
                  className="border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-sm w-full md:w-80 outline-none transition-all focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <i className="ti ti-x text-sm" />
                  </button>
                )}
              </div>
            </div>

            {/* Patients Table Container */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(15,23,42,0.02)] overflow-hidden">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A73E8]"></div>
                  <span className="text-sm font-semibold text-slate-500">Loading patients list...</span>
                </div>
              ) : currentPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-slate-300 text-6xl mb-4">
                    <i className="ti ti-user-x" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No patients found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    We couldn't find any patient matching the filters or query. Try adjusting your inputs.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">NIC</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Gender</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Age</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Registered Date</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {currentPatients.map((patient) => (
                          <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Patient Name / Avatar / Email */}
                            <td className="px-6 py-4 flex items-center gap-3">
                              <div className="bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs h-9 w-9 shrink-0">
                                {getInitials(patient.full_name)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800">{patient.full_name}</div>
                                <div className="text-xs text-slate-400 font-medium">{patient.email || "No Email"}</div>
                              </div>
                            </td>

                            {/* NIC */}
                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                              {patient.nic}
                            </td>

                            {/* Phone */}
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                              {patient.phone}
                            </td>

                            {/* Gender */}
                            <td className="px-6 py-4 text-sm capitalize">
                              {patient.gender}
                            </td>

                            {/* Age */}
                            <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                              {getAge(patient.date_of_birth)}
                            </td>

                            {/* Registered Date */}
                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                              {formatDate(patient.created_at)}
                            </td>

                            {/* Status Badge */}
                            <td className="px-6 py-4">
                              {patient.status === "active" ? (
                                <span className="bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5 border border-emerald-100">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#2ECC71]" />
                                  Active
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1.5 border border-slate-200">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="px-6 py-4 text-right space-x-3">
                              <button
                                onClick={() => handleOpenDetailModal(patient)}
                                className="text-[#1A73E8] hover:text-blue-700 font-bold text-xs cursor-pointer hover:underline focus:outline-none"
                              >
                                View
                              </button>
                              <span className="text-slate-200">|</span>
                              {patient.status === "active" ? (
                                <button
                                  onClick={() => handleToggleStatus(patient.id, "active")}
                                  className="text-red-500 hover:text-red-700 font-bold text-xs cursor-pointer hover:underline focus:outline-none"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(patient.id, "inactive")}
                                  className="text-emerald-600 hover:text-emerald-700 font-bold text-xs cursor-pointer hover:underline focus:outline-none"
                                >
                                  Activate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="text-xs text-slate-500 font-semibold">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredPatients.length)} of{" "}
                      {filteredPatients.length} patients
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        <i className="ti ti-chevron-left mr-1" /> Previous
                      </button>
                      <span className="text-xs font-bold text-slate-700 px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        Next <i className="ti ti-chevron-right ml-1" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Patient Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPatient(null);
        }}
        title="Patient Details"
      >
        {selectedPatient && (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg h-14 w-14">
                {getInitials(selectedPatient.full_name)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedPatient.full_name}</h3>
                <div className="text-xs text-slate-400 font-medium">Patient ID: #{selectedPatient.id}</div>
                <div className="mt-1">
                  {selectedPatient.status === "active" ? (
                    <span className="bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-emerald-100 inline-block">
                      Active Account
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-slate-200 inline-block">
                      Inactive Account
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content sections */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIC Number</span>
                <span className="font-semibold text-slate-800">{selectedPatient.nic}</span>
              </div>
              
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                <span className="font-semibold text-slate-800">{selectedPatient.phone}</span>
              </div>

              <div className="col-span-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {selectedPatient.email || "No email registered"}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedPatient.date_of_birth)}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age / Gender</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {getAge(selectedPatient.date_of_birth)} yrs / {selectedPatient.gender}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</span>
                <span className="font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-xs inline-block mt-0.5">
                  {selectedPatient.blood_group || "Unknown"}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Since</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedPatient.created_at)}</span>
              </div>

              <div className="col-span-2 border-t border-slate-100 pt-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Contact</span>
                <span className="font-semibold text-slate-700 block mt-1 leading-relaxed">
                  {selectedPatient.emergency_contact || "No emergency contact listed"}
                </span>
              </div>

              <div className="col-span-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allergies</span>
                <span className="font-semibold text-amber-700 bg-amber-50/50 border border-amber-100/60 rounded-lg px-3 py-2 block mt-1 leading-relaxed text-xs">
                  {selectedPatient.allergies || "No allergies reported"}
                </span>
              </div>

              <div className="col-span-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medical History</span>
                <span className="font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 block mt-1 leading-relaxed text-xs max-h-32 overflow-y-auto">
                  {selectedPatient.medical_history || "No medical history available"}
                </span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              {selectedPatient.status === "active" ? (
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedPatient.id, "active")}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Deactivate Account
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedPatient.id, "inactive")}
                  className="px-4 py-2 border border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Activate Account
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedPatient(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
            
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ManagePatients;
