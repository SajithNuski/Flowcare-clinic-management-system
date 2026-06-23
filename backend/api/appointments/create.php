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

$patient_id = 0;
if ($_SESSION['role'] === 'receptionist') {
	$patient_email = isset($data['email']) ? trim($data['email']) : '';
	$patient_phone = isset($data['phone']) ? trim($data['phone']) : '';
	$patient_name = isset($data['patient_name']) ? trim($data['patient_name']) : '';

	// 1. Search by email
	if ($patient_email !== '') {
		$stmt = mysqli_prepare($conn, "SELECT id FROM patients WHERE email = ? LIMIT 1");
		mysqli_stmt_bind_param($stmt, "s", $patient_email);
		mysqli_stmt_execute($stmt);
		$result = mysqli_stmt_get_result($stmt);
		if ($row = mysqli_fetch_assoc($result)) {
			$patient_id = (int) $row['id'];
		}
		mysqli_stmt_close($stmt);
	}

	// 2. Search by phone if not found by email
	if ($patient_id === 0 && $patient_phone !== '') {
		$stmt = mysqli_prepare($conn, "SELECT id FROM patients WHERE phone = ? LIMIT 1");
		mysqli_stmt_bind_param($stmt, "s", $patient_phone);
		mysqli_stmt_execute($stmt);
		$result = mysqli_stmt_get_result($stmt);
		if ($row = mysqli_fetch_assoc($result)) {
			$patient_id = (int) $row['id'];
		}
		mysqli_stmt_close($stmt);
	}

	// 3. Create a new patient user if not found
	if ($patient_id === 0) {
		if ($patient_name === '') {
			$patient_name = 'Walk-in Patient';
		}
		// Generate valid dummy NIC: 9 digits + 'V'
		$nic = substr(strval(time() . rand(100, 999)), -9) . 'V';
		$dob = '1990-01-01';
		$gender = 'other';
		$password_hash = password_hash('Password@123', PASSWORD_DEFAULT);

		$stmt = mysqli_prepare($conn, "INSERT INTO patients (full_name, nic, date_of_birth, gender, phone, email, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')");
		$email_val = $patient_email !== '' ? $patient_email : null;
		mysqli_stmt_bind_param($stmt, "sssssss", $patient_name, $nic, $dob, $gender, $patient_phone, $email_val, $password_hash);

		if (mysqli_stmt_execute($stmt)) {
			$patient_id = mysqli_insert_id($conn);
		} else {
			respond_json(["success" => false, "error" => "Could not automatically register patient for appointment: " . mysqli_error($conn)], 500);
		}
		mysqli_stmt_close($stmt);
	}
} else {
	$patient_id = (int) $_SESSION['user_id'];
}

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