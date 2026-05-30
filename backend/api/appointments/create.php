<?php
// This endpoint creates a new appointment for a patient or receptionist in FlowCare.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

require_once __DIR__ . '/../../models/Appointment.php';

$data = get_request_body();

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['patient', 'receptionist'], true)) {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

$doctor_id = isset($data['doctor_id']) ? (int) $data['doctor_id'] : 0;
$appointment_date = trim($data['appointment_date'] ?? '');
$time_slot = trim($data['time_slot'] ?? '');
$visit_reason = trim($data['visit_reason'] ?? '');
$notes = trim($data['notes'] ?? '');

if ($doctor_id <= 0 || $appointment_date === '' || $time_slot === '' || $visit_reason === '') {
	respond_json(["success" => false, "error" => "All required fields must be filled."], 400);
}

$date_object = DateTime::createFromFormat('Y-m-d', $appointment_date);
$date_is_valid = $date_object && $date_object->format('Y-m-d') === $appointment_date;

if (!$date_is_valid) {
	respond_json(["success" => false, "error" => "Invalid appointment date."], 400);
}

$today = new DateTime(date('Y-m-d'));

if ($date_object < $today) {
	respond_json(["success" => false, "error" => "Appointment date cannot be in the past."], 400);
}

$appointment = new Appointment($conn);
$patient_id = (int) $_SESSION['user_id'];
$appointment_id = $appointment->create($patient_id, $doctor_id, $appointment_date, $time_slot, $visit_reason, $notes);

if ($appointment_id === false) {
	respond_json(["success" => false, "error" => "Slot already taken"], 409);
}

log_activity($conn, $patient_id, 'appointment_create', 'Created appointment #' . $appointment_id);

respond_json([
	"success" => true,
	"message" => "Appointment created",
	"appointment_id" => $appointment_id,
]);