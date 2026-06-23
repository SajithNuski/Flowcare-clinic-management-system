/*
React Router lets us show different components for different URLs
without reloading the page - like having multiple pages in one app.
*/

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AboutPage from "./pages/AboutPage";
import HowItWorks from "./pages/HowItWorks";
import ContactPage from "./pages/ContactPage";
import AdminDashboard from "./pages/AdminDashboard";
import BookAppointment from "./pages/BookAppointment";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import ManageAppointments from "./pages/ManageAppointments";
import PatientDashboard from "./pages/PatientDashboard";

function PageStub({ title }) {
  return (
    <div className="min-h-screen bg-white px-7 py-16 text-gray-900">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-gray-600">This page is being prepared.</p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Patient routes */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/book"
            element={
              <ProtectedRoute allowedRole="patient">
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/consultations"
            element={
              <ProtectedRoute allowedRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Receptionist routes */}
          <Route
            path="/receptionist/dashboard"
            element={
              <ProtectedRoute allowedRole="receptionist">
                <ReceptionistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/appointments"
            element={
              <ProtectedRoute allowedRole="receptionist">
                <ManageAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/queue"
            element={
              <ProtectedRoute allowedRole="receptionist">
                <PageStub title="Manage Queue" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/search"
            element={
              <ProtectedRoute allowedRole="receptionist">
                <PageStub title="Search Patient" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/payments"
            element={
              <ProtectedRoute allowedRole="receptionist">
                <PageStub title="Payments" />
              </ProtectedRoute>
            }
          />

          {/* Doctor routes */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/consultations"
            element={
              <ProtectedRoute allowedRole="doctor">
                <PageStub title="Doctor Consultations" />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageStub title="Staff" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageStub title="Patients" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageStub title="Appointments" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageStub title="Settings" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageStub title="Report" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageStub title="Announcements" />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
