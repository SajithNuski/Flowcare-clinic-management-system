<?php

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
$appointment_time = trim($data['appointment_time'] ?? $data['time_slot'] ?? '');
$visit_reason = trim($data['visit_reason'] ?? '');
$notes = trim($data['notes'] ?? '');

if ($doctor_id <= 0 || $appointment_date === '' || $appointment_time === '' || $visit_reason === '') {
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
$patient_name = isset($data['patient_name']) ? trim($data['patient_name']) : '';

if ($_SESSION['role'] === 'receptionist') {
	$patient_email = isset($data['email']) ? trim($data['email']) : '';
	$patient_phone = isset($data['phone']) ? trim($data['phone']) : '';

	if ($patient_email !== '') {
		$stmt = mysqli_prepare($conn, "SELECT id, full_name FROM patients WHERE email = ? LIMIT 1");
		mysqli_stmt_bind_param($stmt, "s", $patient_email);
		mysqli_stmt_execute($stmt);
		$result = mysqli_stmt_get_result($stmt);
		if ($row = mysqli_fetch_assoc($result)) {
			$patient_id = (int) $row['id'];
			if ($patient_name === '') {
				$patient_name = $row['full_name'];
			}
		}
		mysqli_stmt_close($stmt);
	}

	if ($patient_id === 0 && $patient_phone !== '') {
		$stmt = mysqli_prepare($conn, "SELECT id, full_name FROM patients WHERE phone = ? LIMIT 1");
		mysqli_stmt_bind_param($stmt, "s", $patient_phone);
		mysqli_stmt_execute($stmt);
		$result = mysqli_stmt_get_result($stmt);
		if ($row = mysqli_fetch_assoc($result)) {
			$patient_id = (int) $row['id'];
			if ($patient_name === '') {
				$patient_name = $row['full_name'];
			}
		}
		mysqli_stmt_close($stmt);
	}

	if ($patient_id === 0) {
		if ($patient_name === '') {
			$patient_name = 'Walk-in Patient';
		}
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
	if ($patient_name === '') {
		$stmt = mysqli_prepare($conn, "SELECT full_name FROM patients WHERE id = ? LIMIT 1");
		mysqli_stmt_bind_param($stmt, "i", $patient_id);
		mysqli_stmt_execute($stmt);
		$result = mysqli_stmt_get_result($stmt);
		if ($row = mysqli_fetch_assoc($result)) {
			$patient_name = $row['full_name'];
		}
		mysqli_stmt_close($stmt);
	}
}

$appointment_id = $appointment->create($patient_id, $doctor_id, $appointment_date, $appointment_time, $visit_reason, $notes, $patient_name);

if ($appointment_id === false) {
	respond_json(["success" => false, "error" => "Slot already taken"], 409);
}

log_activity($conn, $patient_id, 'appointment_create', 'Created appointment #' . $appointment_id);

respond_json([
	"success" => true,
	"message" => "Appointment created",
	"appointment_id" => $appointment_id,
]);