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

$data = get_request_body();
$queue_id = isset($data['queue_id']) ? (int) $data['queue_id'] : 0;
$patient_id = isset($data['patient_id']) ? (int) $data['patient_id'] : 0;
$notes = trim($data['notes'] ?? '');
$diagnosis = trim($data['diagnosis'] ?? '');
$referral = trim($data['referral'] ?? '');

if ($queue_id <= 0 || $patient_id <= 0 || $notes === '' || $diagnosis === '') {
	respond_json(["success" => false, "error" => "queue_id, patient_id, notes, and diagnosis are required"], 400);
}

$doctor_stmt = mysqli_prepare($conn, "SELECT id FROM doctors WHERE user_id = ? LIMIT 1");
mysqli_stmt_bind_param($doctor_stmt, "i", $_SESSION['user_id']);
mysqli_stmt_execute($doctor_stmt);
$doctor_result = mysqli_stmt_get_result($doctor_stmt);
$doctor_row = $doctor_result ? mysqli_fetch_assoc($doctor_result) : false;
mysqli_stmt_close($doctor_stmt);

if (!$doctor_row) {
	respond_json(["success" => false, "error" => "Doctor record not found"], 404);
}

$consultation = new Consultation($conn);
$queue = new Queue($conn);
$consultation_id = $consultation->save($queue_id, $patient_id, (int) $_SESSION['user_id'], $notes, $diagnosis, $referral !== '' ? $referral : null);

if ($consultation_id === false) {
	respond_json(["success" => false, "error" => "Could not save consultation"], 400);
}

if (!$queue->mark_complete($queue_id)) {
	respond_json(["success" => false, "error" => "Could not complete queue entry"], 400);
}

$patient_stmt = mysqli_prepare($conn, "SELECT full_name FROM users WHERE id = ? LIMIT 1");
mysqli_stmt_bind_param($patient_stmt, "i", $patient_id);
mysqli_stmt_execute($patient_stmt);
$patient_result = mysqli_stmt_get_result($patient_stmt);
$patient_row = $patient_result ? mysqli_fetch_assoc($patient_result) : false;
mysqli_stmt_close($patient_stmt);

$patient_name = $patient_row ? $patient_row['full_name'] : 'patient';

log_activity($conn, (int) $_SESSION['user_id'], 'consultation_complete', 'Completed consultation for ' . $patient_name);

respond_json([
	"success" => true,
	"consultation_id" => $consultation_id,
]);