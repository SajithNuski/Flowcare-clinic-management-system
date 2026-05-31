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
          <Route path="/about" element={<PageStub title="About FlowCare" />} />
          <Route
            path="/how-it-works"
            element={<PageStub title="How FlowCare Works" />}
          />
          <Route
            path="/contact"
            element={<PageStub title="Contact FlowCare" />}
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Patient routes */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRole="patient">
                <PageStub title="Patient Dashboard" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/book"
            element={
              <ProtectedRoute allowedRole="patient">
                <PageStub title="Book Appointment" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/consultations"
            element={
              <ProtectedRoute allowedRole="patient">
                <PageStub title="My Consultations" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRole="patient">
                <PageStub title="My Profile" />
              </ProtectedRoute>
            }
          />

          {/* Receptionist routes */}
          <Route
            path="/receptionist/dashboard"
            element={
              <ProtectedRoute allowedRole="receptionist">
                <PageStub title="Receptionist Dashboard" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/appointments"
            element={
              <ProtectedRoute allowedRole="receptionist">
                <PageStub title="Manage Appointments" />
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
                <PageStub title="Doctor Dashboard" />
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
                <PageStub title="Admin Dashboard" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageStub title="Manage Users" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageStub title="Clinic Settings" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRole="admin">
                <PageStub title="Reports" />
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
