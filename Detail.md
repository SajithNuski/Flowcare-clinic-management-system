# Project Details: FlowCare Clinic Management System

FlowCare is a modern, responsive Clinic Management System built with a **React (Vite) frontend** and a **PHP + MySQL backend API**. The project aims to streamline clinical operations across four main roles: Patients, Receptionists, Doctors, and Administrators.

---

## 🛠️ What has been done

We have established the core database architecture, set up the API endpoints, constructed the responsive routing, and built out complete dashboard views and workflows for each user role.

### 1. Database Schema & Core Architecture (`backend/database.sql`)
*   **Structured Tables:** Designed tables for `admin`, `doctors`, `receptionist`, `patients`, `appointments`, `queue`, `consultations`, `payments`, `announcements`, `activity_log`, and `clinic_settings`.
*   **Relational Integrity:** Foreign key constraints handle the links between patients, doctors, appointments, queues, consultations, and payments.
*   **Seed Data:** Seeded with test data for admins, doctors, receptionists, patients, and default clinic settings to allow immediate development testing.

### 2. Frontend Structure & Routing (`frontend/src/`)
*   **Vite + React Core:** Built using React with TailwindCSS utility styling.
*   **Protected Routing (`ProtectedRoute.jsx`):** Configured role-based route guards that restrict access to pages based on whether the logged-in user is an Admin, Doctor, Receptionist, or Patient.
*   **Dynamic Sidebar & Navbar:** Created a clean layout where the navigation bar adapts to the current user's authentication status and role.
*   **Performance Optimization:** Configured Rollup chunk splitting in `vite.config.js` separating vendor packages and Recharts visualization bundles.

### 3. Public Pages & Authentication
*   **Modern Landing Page:** Featuring a clean medical color palette, dynamic statistics panel, clinic location details, opening hours, and calls-to-action.
*   **Company Info Pages:** Completed pages for "About Us", "How It Works", and "Contact".
*   **Hybrid Authentication Flow:** Implemented user login and registration forms supporting both tab-isolated JWT Bearer tokens and PHP native sessions. Registration includes validation fields (NIC, Date of Birth, Gender, Emergency Contacts).

### 4. Role-Specific Dashboards & Operational Features

#### A. Patient Portal
*   **Patient Dashboard (`PatientDashboard.jsx`):** Displays upcoming appointments, personal health info, latest clinic announcements, and active prescriptions/consultation summaries.
*   **Interactive Appointment Wizard (`BookAppointment.jsx`):** A multi-step form wizard allowing patients to select a doctor, choose available date and time slots based on the doctor's working schedule, specify visit reasons, and obtain immediate confirmation.
*   **Consultation & Prescriptions (`MyConsultations.jsx`):** A dedicated consultation viewer allowing patients to search and review past diagnoses, physician advice, and print official clinical summaries.
*   **Profile & Medical Information (`MyProfile.jsx`):** Allows patients to update their contact details, address, date of birth, blood group, allergies, chronic history, emergency contacts, upload profile photos, and change account passwords.

#### B. Receptionist Portal
*   **Oversight Hub (`ReceptionistDashboard.jsx`):** Real-time summary showing today's appointments, check-in stats, active queue count, and pending payments.
*   **Manage Appointments (`ManageAppointments.jsx`):** Full CRUD capability for receptionists to search, update, reschedule, cancel, or check-in patients for appointments (which automatically assigns them to the active queue).
*   **Queue Management (`ManageQueue.jsx`):** Live queue monitoring and control panel with auto-refresh and status updates.
*   **Patient Search & Directory (`SearchPatient.jsx`):** Comprehensive search bar allowing receptionists to instantly look up patients by Name, NIC, or Phone number, view their full clinical background (allergies, blood group, history), and check them in directly to the queue as walk-in patients.
*   **Payments & Invoicing (`Payments.jsx`):** Daily billing ledger to review consultation transactions, filter by cash/card, view revenue metrics, and record transactions.

#### C. Doctor Portal
*   **Doctor Queue Hub (`DoctorQueue.jsx`):** Displays the active queue of patients checked-in today, sorted by effective-time logic (scheduled slots vs. walk-in arrival). Allows doctors to call next, complete consultations, or mark no-shows.
*   **Consultation Workspace & History (`DoctorConsultations.jsx`):** Full clinical history screen where doctors can filter consultations by date, view past records, diagnoses, and patient histories.
*   **Patient Records (`ManagePatients.jsx`):** Doctors can browse registered patients and review medical histories and allergy details.
*   **Doctor Profile (`DoctorProfile.jsx`):** Allows doctors to update their bio, qualifications, working hours, and contact details.

#### D. Administrator Portal
*   **Dashboard & Analytics (`AdminDashboard.jsx` & `Reports.jsx`):** Aggregated metrics and Recharts visualizations showcasing appointment volume, completion rates, revenue by payment method, doctor performance (patient volume & consult duration), and patient demographics (gender and age ranges).
*   **System Audit & Activity Log (`AdminActivityLog.jsx` & `backend/api/admin/activity_log.php`):** Administrative audit trail tracking security and operational actions with user name, role badges, action filters, date filters, and pagination.
*   **Manage Staff & Patients (`ManageUsers.jsx` & `ManagePatients.jsx`):** Control center for adding, updating, and toggling active/inactive status of clinical staff and reviewing patients.
*   **Announcements Board (`Announcements.jsx`):** Allows admins to publish announcements that propagate instantly to patient and staff dashboards.
*   **Clinic Settings (`ClinicSettings.jsx`):** Dynamic configuration editor for clinic name, address, contact details, and operating hours.

---

## 🔒 Security Hardening

1. **Prepared Statements**: Parameterized SQL queries using `mysqli_prepare` across all endpoints, including the administrative reports analytics engine.
2. **Password Security**: Blowfish Hashing (`password_hash` with `PASSWORD_DEFAULT`).
3. **Tab-Isolated JWTs**: Client-side `sessionStorage` tokens preventing cross-tab account collisions.
