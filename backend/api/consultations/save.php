<?php
// This endpoint saves a consultation record for a doctor.

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
	respond_json(["success" => false, "error" => "Access denied. Only doctors can record consultations."], 403);
}

require_once __DIR__ . '/../../models/Consultation.php';
require_once __DIR__ . '/../../models/Queue.php';
require_once __DIR__ . '/../../models/Appointment.php';

$data = get_request_body();
$queue_id = isset($data['queue_id']) ? (int) $data['queue_id'] : 0;
$patient_id = isset($data['patient_id']) ? (int) $data['patient_id'] : 0;
$notes = trim($data['notes'] ?? 'Consultation completed');
$diagnosis = trim($data['diagnosis'] ?? 'General Consultation');
$referral = trim($data['referral'] ?? '');

$doctor_id = (int) $_SESSION['user_id'];

// If patient_id was not provided, look it up from queue if queue_id is present
if ($patient_id <= 0 && $queue_id > 0) {
	$q_stmt = mysqli_prepare($conn, "SELECT patient_id FROM queue WHERE id = ? LIMIT 1");
	mysqli_stmt_bind_param($q_stmt, "i", $queue_id);
	mysqli_stmt_execute($q_stmt);
	$q_res = mysqli_stmt_get_result($q_stmt);
	if ($q_row = mysqli_fetch_assoc($q_res)) {
		$patient_id = (int) $q_row['patient_id'];
	}
	mysqli_stmt_close($q_stmt);
}

if ($patient_id <= 0) {
	respond_json(["success" => false, "error" => "patient_id is required"], 400);
}

$consultation = new Consultation($conn);
$consultation_id = $consultation->save(
	$queue_id,
	$patient_id,
	$doctor_id,
	$notes,
	$diagnosis,
	$referral !== '' ? $referral : null
);

if (!$consultation_id) {
	respond_json(["success" => false, "error" => "Failed to save consultation"], 500);
}

// If queue_id was provided, update queue and appointment status
if ($queue_id > 0) {
	$queue = new Queue($conn);
	$queue->mark_complete($queue_id);

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
		$appointment = new Appointment($conn);
		$appointment->mark_completed($appointment_id);
	}
}

log_activity($conn, $doctor_id, 'consultation_save', "Saved consultation #{$consultation_id} for patient #{$patient_id}");

respond_json([
	"success" => true,
	"consultation_id" => $consultation_id,
	"message" => "Consultation saved successfully"
]);
?>