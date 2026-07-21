<?php
// This endpoint saves consultation notes and completes the queue entry for a doctor.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

if (!isset($_SESSION['user_id'], $_SESSION['role']) || $_SESSION['role'] !== 'doctor') {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

require_once __DIR__ . '/../../models/Queue.php';
require_once __DIR__ . '/../../models/Consultation.php';
require_once __DIR__ . '/../../models/Appointment.php';

$data = get_request_body();
$queue_id = isset($data['queue_id']) ? (int) $data['queue_id'] : 0;
$patient_id = isset($data['patient_id']) ? (int) $data['patient_id'] : 0;
$notes = trim($data['notes'] ?? 'Consultation completed');
$diagnosis = trim($data['diagnosis'] ?? 'General Consultation');
$referral = trim($data['referral'] ?? '');

if ($queue_id <= 0) {
	respond_json(["success" => false, "error" => "queue_id is required"], 400);
}

// Find doctor ID for logged-in user
$user_id = (int) $_SESSION['user_id'];
$doctor_stmt = mysqli_prepare($conn, "SELECT id FROM doctors WHERE id = ? LIMIT 1");
mysqli_stmt_bind_param($doctor_stmt, "i", $user_id);
mysqli_stmt_execute($doctor_stmt);
$doctor_result = mysqli_stmt_get_result($doctor_stmt);
$doctor_row = $doctor_result ? mysqli_fetch_assoc($doctor_result) : false;
mysqli_stmt_close($doctor_stmt);

if (!$doctor_row) {
	respond_json(["success" => false, "error" => "Doctor record not found"], 404);
}
$doctor_id = (int) $doctor_row['id'];

// If patient_id was not provided, look it up from queue table
if ($patient_id <= 0) {
	$q_stmt = mysqli_prepare($conn, "SELECT patient_id FROM queue WHERE id = ? LIMIT 1");
	mysqli_stmt_bind_param($q_stmt, "i", $queue_id);
	mysqli_stmt_execute($q_stmt);
	$q_res = mysqli_stmt_get_result($q_stmt);
	if ($q_row = mysqli_fetch_assoc($q_res)) {
		$patient_id = (int) $q_row['patient_id'];
	}
	mysqli_stmt_close($q_stmt);
}

$consultation = new Consultation($conn);
$queue = new Queue($conn);
$appointment = new Appointment($conn);

// Save consultation record if patient_id valid
$consultation_id = false;
if ($patient_id > 0) {
	$consultation_id = $consultation->save($queue_id, $patient_id, $user_id, $notes, $diagnosis, $referral !== '' ? $referral : null);
}

// Mark queue entry completed
if (!$queue->mark_complete($queue_id)) {
	respond_json(["success" => false, "error" => "Could not complete queue entry"], 400);
}

// Mark linked appointment completed if one exists
$appointment_id = isset($data['appointment_id']) ? (int)$data['appointment_id'] : 0;
if ($appointment_id <= 0) {
	$pay_stmt = mysqli_prepare($conn, "SELECT appointment_id FROM payments WHERE queue_id = ? AND appointment_id IS NOT NULL AND appointment_id > 0 LIMIT 1");
	if ($pay_stmt) {
		mysqli_stmt_bind_param($pay_stmt, "i", $queue_id);
		mysqli_stmt_execute($pay_stmt);
		$pay_res = mysqli_stmt_get_result($pay_stmt);
		if ($pay_row = mysqli_fetch_assoc($pay_res)) {
			$appointment_id = (int)$pay_row['appointment_id'];
		}
		mysqli_stmt_close($pay_stmt);
	}
}
if ($appointment_id > 0) {
	$appointment->mark_completed($appointment_id);
}

// Auto promote next waiting patient for this doctor
$next_patient = $queue->call_next($doctor_id);

$patient_name = 'patient';
if ($patient_id > 0) {
	$patient_stmt = mysqli_prepare($conn, "SELECT full_name FROM patients WHERE id = ? LIMIT 1");
	mysqli_stmt_bind_param($patient_stmt, "i", $patient_id);
	mysqli_stmt_execute($patient_stmt);
	$patient_result = mysqli_stmt_get_result($patient_stmt);
	$patient_row = $patient_result ? mysqli_fetch_assoc($patient_result) : false;
	mysqli_stmt_close($patient_stmt);
	if ($patient_row) {
		$patient_name = $patient_row['full_name'];
	}
}

log_activity($conn, $user_id, 'consultation_complete', 'Completed consultation for ' . $patient_name);

respond_json([
	"success" => true,
	"consultation_id" => $consultation_id,
	"next_patient" => $next_patient ?: null
]);
?>