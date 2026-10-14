import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { getCurrentUser, changePassword } from "../api/auth";
import { updatePatientProfile } from "../api/patients";
import { getInitials } from "../utils/helpers";

export default function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Patient profile form state
  const [patientId, setPatientId] = useState(null);
  const [nic, setNic] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [allergies, setAllergies] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const showToastMsg = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  };

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await getCurrentUser();
        if (res?.success && res.user) {
          const u = res.user;
          setPatientId(u.id);
          setNic(u.nic || "");
          setFullName(u.full_name || "");
          setPhone(u.phone || "");
          setEmail(u.email || "");
          setDateOfBirth(u.date_of_birth ? u.date_of_birth.split(" ")[0] : "");
          setGender(u.gender || "male");
          setBloodGroup(u.blood_group || "");
          setEmergencyContact(u.emergency_contact || "");
          setMedicalHistory(u.medical_history || "");
          setAllergies(u.allergies || "");
          setPhotoUrl(u.photo_url || "");
        } else {
          showToastMsg("Failed to load profile details.", "error");
        }
      } catch (err) {
        showToastMsg("Error connecting to server.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToastMsg("Photo size must be less than 2MB.", "error");
        return;
      }
      setSelectedPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim() || !dateOfBirth) {
      showToastMsg("Please fill in all required demographic fields.", "error");
      return;
    }

    if (!/^07\d{8}$/.test(phone.trim())) {
      showToastMsg("Phone number must start with 07 and have exactly 10 digits.", "error");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("full_name", fullName.trim());
      formData.append("phone", phone.trim());
      formData.append("email", email.trim());
      formData.append("gender", gender);
      formData.append("date_of_birth", dateOfBirth);
      formData.append("blood_group", bloodGroup);
      formData.append("emergency_contact", emergencyContact.trim());
      formData.append("medical_history", medicalHistory.trim());
      formData.append("allergies", allergies.trim());

      if (selectedPhoto) {
        formData.append("photo", selectedPhoto);
      }

      const res = await updatePatientProfile(formData);
      if (res?.success) {
        showToastMsg("Profile details updated successfully!", "success");
        if (res.user?.photo_url) {
          setPhotoUrl(res.user.photo_url);
        }
      } else {
        showToastMsg(res?.error || "Failed to update profile.", "error");
      }
    } catch (err) {
      showToastMsg("An error occurred while saving profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showToastMsg("Both current and new passwords are required.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToastMsg("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToastMsg("New password must be at least 6 characters.", "error");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res?.success) {
        showToastMsg("Password changed successfully!", "success");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToastMsg(res?.error || "Failed to change password.", "error");
      }
    } catch (err) {
      showToastMsg("An error occurred while updating password.", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar role="patient" activePage="Profile" />

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-5xl mx-auto w-full">
        {/* Toast */}
        {toast.message && (
          <div
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
              toast.type === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            <i
              className={`ti ${
                toast.type === "error" ? "ti-alert-circle" : "ti-circle-check"
              } text-lg`}
            />
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
                <i className="ti ti-user-circle text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  My Profile & Medical Info
                </h1>
                <p className="text-sm text-slate-500">
                  Manage your personal demographics, health background, and account security.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <i className="ti ti-lock" />
            Change Password
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your profile details..." />
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Top Identity Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-3xl shadow-md border-4 border-white">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : photoUrl ? (
                    <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(fullName)
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-xl shadow cursor-pointer hover:bg-blue-700 transition">
                  <i className="ti ti-camera text-sm" />
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-slate-900">{fullName || "Patient Profile"}</h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 text-xs text-slate-500">
                  <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                    NIC: {nic || "—"}
                  </span>
                  <span>•</span>
                  <span>Registered Patient</span>
                  {bloodGroup && (
                    <>
                      <span>•</span>
                      <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200">
                        Blood: {bloodGroup}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Demographics */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="ti ti-id text-blue-600" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    National Identity Card (NIC)
                  </label>
                  <input
                    type="text"
                    value={nic}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Phone Number * (e.g., 0771234567)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical & Emergency Information */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="ti ti-activity text-emerald-600" />
                Clinical & Emergency Background
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  >
                    <option value="">Unknown / Not Tested</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spouse / Parent - 0771234567"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Known Drug & Food Allergies
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g., Penicillin, Aspirin, Peanuts, Sulfa drugs (Leave blank if none)"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chronic Medical Conditions & Past Surgeries
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Hypertension, Type 2 Diabetes, Asthma, Previous Surgeries..."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <i className="ti ti-loader-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check" />
                    Save Profile Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <Modal
            isOpen={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
            title="Change Account Password"
          >
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <>
                      <i className="ti ti-loader-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}
