<?php
// This endpoint marks a patient or appointment as no-show for a receptionist.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

if (!isset($_SESSION['user_id'], $_SESSION['role']) || !in_array($_SESSION['role'], ['receptionist', 'doctor'])) {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

require_once __DIR__ . '/../../models/Queue.php';
require_once __DIR__ . '/../../models/Appointment.php';

$data = get_request_body();
$queue_id = isset($data['queue_id']) ? (int) $data['queue_id'] : 0;
$appointment_id = isset($data['appointment_id']) ? (int) $data['appointment_id'] : 0;

if ($queue_id <= 0 && $appointment_id <= 0) {
	respond_json(["success" => false, "error" => "queue_id or appointment_id is required"], 400);
}

$queue = new Queue($conn);
$appointment = new Appointment($conn);
$updated = false;

if ($queue_id > 0) {
	$updated = $queue->mark_no_show($queue_id) || $updated;
}

if ($appointment_id > 0) {
	$updated = $appointment->mark_no_show($appointment_id) || $updated;
}

if (!$updated) {
	respond_json(["success" => false, "error" => "Could not mark no-show"], 400);
}

$next_patient = null;
if ($_SESSION['role'] === 'doctor') {
	$user_id = (int) $_SESSION['user_id'];
	$doc_stmt = mysqli_prepare($conn, "SELECT id FROM doctors WHERE id = ? LIMIT 1");
	if ($doc_stmt) {
		mysqli_stmt_bind_param($doc_stmt, "i", $user_id);
		mysqli_stmt_execute($doc_stmt);
		$doc_res = mysqli_stmt_get_result($doc_stmt);
		if ($doc_row = mysqli_fetch_assoc($doc_res)) {
			$doctor_id = (int)$doc_row['id'];
			$next_patient = $queue->call_next($doctor_id);
		}
		mysqli_stmt_close($doc_stmt);
	}
}

log_activity($conn, (int) $_SESSION['user_id'], 'mark_no_show', 'Marked a patient as skipped/no-show');

respond_json(["success" => true, "message" => "Marked as skipped / no-show", "next_patient" => $next_patient ?: null]);
?>