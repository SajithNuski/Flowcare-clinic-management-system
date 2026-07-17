# Project Details: FlowCare Clinic Management System

FlowCare is a modern, responsive Clinic Management System built with a **React (Vite) frontend** and a **PHP + MySQL backend API**. The project aims to streamline clinical operations across four main roles: Patients, Receptionists, Doctors, and Administrators.

---

## 🛠️ What has been done so far

We have established the core database architecture, set up the API endpoints, constructed the responsive routing, and built out several complete dashboard views for each user role.

### 1. Database Schema & Core Architecture (`backend/database.sql`)
*   **Structured Tables:** Designed tables for `admin`, `doctors`, `receptionist`, `patients`, `appointments`, `queue`, `consultations`, `payments`, `announcements`, `activity_log`, and `clinic_settings`.
*   **Relational Integrity:** Foreign key constraints handle the links between patients, doctors, appointments, queues, and consultations.
*   **Seed Data:** Seeded with test data for admins, doctors, receptionists, patients, and default clinic settings to allow immediate development testing.

### 2. Frontend Structure & Routing (`frontend/src/`)
*   **Vite + React Core:** Built using React with TailwindCSS styling.
*   **Protected Routing (`ProtectedRoute.jsx`):** Configured role-based route guards that restrict access to pages based on whether the logged-in user is an Admin, Doctor, Receptionist, or Patient.
*   **Dynamic Sidebar & Navbar:** Created a clean layout where the navigation bar adapts to the current user's authentication status and role.

### 3. Public Pages & Authentications
*   **Modern Landing Page:** Featuring a clean teal medical color palette, dynamic statistics panel, clinic location details, opening hours, and calls-to-action.
*   **Company Info Pages:** Completed pages for "About Us", "How It Works", and "Contact".
*   **Authentication Flow:** Implemented user login and registration forms. Registration includes detailed validation fields (NIC, Date of Birth, Gender, and Emergency Contacts) and password visibility toggles.

### 4. Role-Specific Dashboards (Implemented)

#### A. Patient Portal
*   **Patient Dashboard:** Displays upcoming appointments, personal health info, latest clinic announcements, and active prescriptions/consultation summaries.
*   **Interactive Appointment Wizard (`BookAppointment.jsx`):** A premium multi-step form wizard allowing patients to select a doctor, choose available date and time slots based on the doctor's working schedule, specify visit reasons, and obtain immediate confirmation.

#### B. Receptionist Dashboard
*   **Oversight Hub:** Real-time summary showing today's appointments, check-in stats, active queue count, and pending payments.
*   **Manage Appointments:** Full CRUD capability for receptionists to search, update, reschedule, cancel, or check-in patients for appointments (which automatically assigns them to the active queue).

#### C. Doctor Dashboard
*   **Clinical Feed:** Displays the active queue of patients checked-in today under the logged-in doctor.
*   **Patient Records:** Allows doctors to view a patient's medical details, histories, and allergies.

#### D. Administrator Portal
*   **Stats Summary:** Aggregated cards showcasing total users, active doctors, daily appointments, and revenue overview.
*   **Manage Users:** Control center for adding, updating, and toggling active/inactive status of clinical staff (Doctors, Receptionists, and Admins).
*   **Manage Patients:** Interface to review registered patients, search by NIC/Name, and examine basic histories.
*   **Appointments Master-list:** An oversight screen displaying all clinic appointments across all doctors.
*   **Announcements Board:** Allows admins to create and publish clinic announcements that propagate instantly to the patient dashboards.
*   **Clinic Settings:** Dynamic configuration editor allowing admins to update details like the clinic name, address, phone number, hours of operation, and working days directly into the database.

### 5. Receptionist-led Registration & Duplicate Prevention (Implemented)
*   **Database nullable password**: Modified `patients` table schema to support NULL passwords, enabling receptionist-created profiles without app credentials.
*   **Duplicate NIC existence check**: Created dedicated `backend/api/patients/register.php` endpoint to verify if an NIC already exists before attempting registration.
*   **Seamless Receptionist Workflow**: Redesigned the "Register Patient" modal on the Receptionist Dashboard to capture only basic demographics (Name, NIC, Phone, DOB, Gender).
*   **Dynamic Results & Quick Actions**: Shows clear alert feedback upon registration submission (whether new or existing matching profile), offering direct pathways to check them in to the live queue or proceed to schedule an appointment.
*   **Integrated Booking Flow**: Updated backend appointment creation to accept `patient_id` directly, carrying the selected patient seamlessly into the slot booking wizard.

---

## 📋 What still needs to be done (Next Steps)

While the foundations and primary dashboards are operational, several features are currently stubbed out (using placeholder files or stub APIs) and need to be fully implemented.

### 1. Queue Management System
*   **Frontend UI (`frontend/src/pages/ManageQueue.jsx`):** Currently a page stub. Needs an interactive dashboard for receptionists to manage the active patients waiting list.
*   **Queue Control Panel:** Receptionists should be able to trigger actions to call the next patient, mark a patient as a "no-show", skip patients, or re-order the queue.
*   **Backend Sync:** Wire the UI up to the existing queue API endpoints:
    *   `backend/api/queue/call_next.php`
    *   `backend/api/queue/checkin.php`
    *   `backend/api/queue/complete.php`
    *   `backend/api/queue/no_show.php`
    *   `backend/api/queue/status.php`

### 2. Doctor Consultation & Prescriptions
*   **Frontend UI (`frontend/src/pages/DoctorConsultations.jsx`):** Currently a stub. Needs a rich clinical dashboard where the doctor can treat patients.
*   **Treatment Workspace:** When a doctor calls a patient from the queue, this page should allow them to write:
    *   Symptom history & notes.
    *   Diagnoses.
    *   Prescriptions (drug names, dosages, durations).
    *   Referrals to other specialists.
*   **Backend Integration:** Replace the placeholder `backend/api/consultations/save.php` with a functional script to save consultation logs into the `consultations` table, transition the queue status to `completed`, and trigger the payment status.

### 3. Payments & Invoicing
*   **Frontend UI (`frontend/src/pages/Payments.jsx`):** Currently a stub. Receptionists need a screen to view completed consultations and calculate charges.
*   **Invoicing Flow:**
    *   View doctor consulting fees + medication charges.
    *   Process payment transactions (Cash / Card) and mark the invoice as paid.
    *   Print simple receipts for patient records.
*   **Backend Model & APIs:** Create a proper PHP model in `backend/models/Payment.php` (currently just a comment placeholder) and write the backend APIs to log transactions in the `payments` table.

### 4. Admin Reports & Analytics
*   **Frontend UI (`frontend/src/pages/Reports.jsx`):** Currently a placeholder. Needs visual charts and graphs using a library like Chart.js or Recharts.
*   **Metrics to Track:**
    *   Monthly appointment booking trends.
    *   Daily/Monthly revenue analysis.
    *   Doctor performance stats (patient load, average consult time).
    *   Patient demographics (gender ratios, age ranges).
*   **Backend APIs:** Connect to `backend/api/admin/reports.php` to fetch aggregated analytics.

### 5. Patient Profile & Personal Consultations
*   **Frontend UI (`frontend/src/pages/MyProfile.jsx` & `MyConsultations.jsx`):** Currently redirected or stubbed.
*   **Profile Editor:** Allow patients to update their contact details, address, blood group, allergies, and emergency contact details.
*   **Consultation History:** Provide patients with a list of their past diagnoses, prescriptions, and notes, with options to download/print them.

### 6. Receptionist Patient Search
*   **Frontend UI (`frontend/src/pages/SearchPatient.jsx`):** Currently a stub.
*   **Features:** Search bar allowing receptionists to instantly look up patients by Name, NIC, or Phone number to view their profile, past visits, or check them in directly without a pre-booked appointment.

### 7. Administrative Activity Logging
*   **Backend API (`backend/api/admin/activity_log.php`):** Currently a placeholder.
*   **Feature:** Needs a script that automatically records actions performed by admins and staff (e.g., updating settings, deleting users, deleting appointments) into the database table `activity_log` and displays them in a "System Audit Log" section in the Admin Dashboard.
