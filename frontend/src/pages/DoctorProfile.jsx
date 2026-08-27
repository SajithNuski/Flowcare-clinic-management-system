import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { getDoctorDashboardData, updateDoctorProfile } from "../api/doctors";
import { useAuth } from "../context/AuthContext";

function DoctorProfile() {
  const { user, login } = useAuth();
  const fileInputRef = useRef(null);

  // Profile data state
  const [profile, setProfile] = useState({
    full_name: "",
    specialisation: "",
    qualification: "",
    experience_years: 0,
    bio: "",
    photo_url: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [fileError, setFileError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "success" });
    }, 4000);
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getDoctorDashboardData();
        if (res?.success && res.doctor) {
          setProfile({
            full_name: res.doctor.full_name || "",
            specialisation: res.doctor.specialisation || "",
            qualification: res.doctor.qualification || "",
            experience_years: res.doctor.experience_years || 0,
            bio: res.doctor.bio || "",
            photo_url: res.doctor.photo_url || "",
            email: res.doctor.email || "",
          });
        } else {
          showToast("Failed to load profile data", "error");
        }
      } catch (err) {
        showToast("Error loading profile", "error");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: name === "experience_years" ? parseInt(value) || 0 : value,
    }));
    
    // Clear field-specific error
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileError("");

    // Validate type (PNG or JPG/JPEG)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Only PNG or JPG images are allowed");
      return;
    }

    // Validate size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError("Only PNG or JPG images are allowed. File exceeds 2MB limit.");
      return;
    }

    setSelectedFile(file);
    // Create live preview
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleTriggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!profile.full_name.trim()) {
      errors.full_name = "Full Name is required";
    } else if (profile.full_name.trim().length < 3) {
      errors.full_name = "Name must be at least 3 characters";
    } else if (profile.full_name.trim().length > 100) {
      errors.full_name = "Name must not exceed 100 characters";
    }

    if (!profile.specialisation.trim()) {
      errors.specialisation = "Specialty/Department is required";
    } else if (profile.specialisation.trim().length > 100) {
      errors.specialisation = "Specialty must not exceed 100 characters";
    }

    if (profile.experience_years < 0 || profile.experience_years > 60) {
      errors.experience_years = "Experience must be between 0 and 60 years";
    }

    if (profile.qualification.trim().length > 255) {
      errors.qualification = "Qualifications must not exceed 255 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || fileError) {
      showToast("Please correct the errors in the form", "error");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("full_name", profile.full_name.trim());
      formData.append("specialisation", profile.specialisation.trim());
      formData.append("qualification", profile.qualification.trim());
      formData.append("experience_years", profile.experience_years);
      formData.append("bio", profile.bio.trim());

      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      const res = await updateDoctorProfile(formData);
      if (res?.success) {
        showToast("Profile updated successfully", "success");
        setSelectedFile(null); // Clear selected file
        
        // Update state with return values from backend
        setProfile({
          full_name: res.doctor.full_name || "",
          specialisation: res.doctor.specialisation || "",
          qualification: res.doctor.qualification || "",
          experience_years: res.doctor.experience_years || 0,
          bio: res.doctor.bio || "",
          photo_url: res.doctor.photo_url || "",
          email: res.doctor.email || "",
        });
        setPreviewUrl(""); // Reset preview url

        // Sync with Auth Context
        if (user) {
          login({
            ...user,
            full_name: res.doctor.full_name,
            photo_url: res.doctor.photo_url,
          });
        }
      } else {
        showToast(res?.error || "Failed to update profile", "error");
      }
    } catch (err) {
      showToast("An error occurred while saving profile changes", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        <Sidebar role="doctor" activePage="Profile" />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A73E8]"></div>
        </main>
      </div>
    );
  }

  // Fallback profile initials
  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "DR";

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar role="doctor" activePage="Profile" />

      {/* Toast Alert overlay */}
      {toast.message && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 ${toast.type === "error" ? "bg-red-500 animate-bounce" : "bg-green-500"}`}>
          <i className={toast.type === "error" ? "ti ti-alert-circle text-lg" : "ti ti-circle-check text-lg"} />
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-[#1A73E8] to-[#1557B0] relative">
            <div className="absolute -bottom-16 left-8">
              <div className="relative group cursor-pointer" onClick={handleTriggerFilePicker}>
                {previewUrl || profile.photo_url ? (
                  <img
                    src={previewUrl || profile.photo_url}
                    alt="Doctor Profile"
                    className="w-[120px] h-[120px] rounded-full object-cover border-4 border-white shadow-md bg-white"
                  />
                ) : (
                  <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-md bg-gradient-to-br from-[#1A73E8] to-[#1557B0] text-white flex items-center justify-center text-4xl font-bold select-none">
                    {initials}
                  </div>
                )}
                
                {/* Change photo overlay on hover */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <i className="ti ti-camera text-2xl" />
                  <span className="text-[11px] font-bold mt-1">Change Photo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 mb-6 gap-2">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Profile Settings</h1>
                <p className="text-xs text-slate-500 mt-1">Update your professional details and display photo visible to patients.</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full font-bold uppercase tracking-wider self-start sm:self-center">
                {profile.email}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg"
                className="hidden"
              />

              {/* Photo Error Banner */}
              {fileError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-2">
                  <i className="ti ti-alert-circle text-sm" />
                  {fileError}
                </div>
              )}

              {/* Name & Specialty Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Dr. Jane Doe"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all ${
                      formErrors.full_name ? "border-red-500 bg-red-50/20" : "border-slate-300"
                    }`}
                  />
                  {formErrors.full_name && (
                    <span className="text-[11px] font-semibold text-red-500 mt-1 block">{formErrors.full_name}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Specialty / Department *
                  </label>
                  <input
                    type="text"
                    name="specialisation"
                    value={profile.specialisation}
                    onChange={handleInputChange}
                    placeholder="e.g. Cardiologist"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all ${
                      formErrors.specialisation ? "border-red-500 bg-red-50/20" : "border-slate-300"
                    }`}
                  />
                  {formErrors.specialisation && (
                    <span className="text-[11px] font-semibold text-red-500 mt-1 block">{formErrors.specialisation}</span>
                  )}
                </div>
              </div>

              {/* Qualifications & Experience Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={profile.qualification}
                    onChange={handleInputChange}
                    placeholder="e.g. MBBS, MD (Cardiology)"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all ${
                      formErrors.qualification ? "border-red-500 bg-red-50/20" : "border-slate-300"
                    }`}
                  />
                  {formErrors.qualification && (
                    <span className="text-[11px] font-semibold text-red-500 mt-1 block">{formErrors.qualification}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="experience_years"
                    value={profile.experience_years}
                    onChange={handleInputChange}
                    min="0"
                    max="60"
                    placeholder="e.g. 12"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all ${
                      formErrors.experience_years ? "border-red-500 bg-red-50/20" : "border-slate-300"
                    }`}
                  />
                  {formErrors.experience_years && (
                    <span className="text-[11px] font-semibold text-red-500 mt-1 block">{formErrors.experience_years}</span>
                  )}
                </div>
              </div>

              {/* Bio/Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bio / Description
                </label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell patients about your clinical focus, background, or approach to patient care..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-8">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-[#1A73E8] hover:bg-[#1557B0] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-200 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-device-floppy text-base" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DoctorProfile;
