<?php
// This endpoint checks a patient into the queue for a receptionist.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

if (!isset($_SESSION['user_id'], $_SESSION['role']) || $_SESSION['role'] !== 'receptionist') {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

require_once __DIR__ . '/../../models/Queue.php';
require_once __DIR__ . '/../../models/Appointment.php';

$data = get_request_body();
$patient_id = isset($data['patient_id']) ? (int) $data['patient_id'] : 0;
$doctor_id = isset($data['doctor_id']) ? (int) $data['doctor_id'] : 0;
$appointment_id = isset($data['appointment_id']) ? (int) $data['appointment_id'] : 0;

if ($patient_id <= 0 || $doctor_id <= 0) {
	respond_json(["success" => false, "error" => "patient_id and doctor_id are required"], 400);
}

$queue = new Queue($conn);
$appointment = new Appointment($conn);
$today = date('Y-m-d');
$result = $queue->add_to_queue($patient_id, $doctor_id, $today);

if ($result === false) {
	respond_json(["success" => false, "error" => "Could not add patient to queue"], 400);
}

if ($appointment_id > 0) {
	$appointment->mark_completed($appointment_id);
}

$patient_stmt = mysqli_prepare($conn, "SELECT full_name FROM patients WHERE id = ? LIMIT 1");
mysqli_stmt_bind_param($patient_stmt, "i", $patient_id);
mysqli_stmt_execute($patient_stmt);
$patient_result = mysqli_stmt_get_result($patient_stmt);
$patient_row = $patient_result ? mysqli_fetch_assoc($patient_result) : false;
mysqli_stmt_close($patient_stmt);

$patient_name = $patient_row ? $patient_row['full_name'] : 'patient';

log_activity($conn, (int) $_SESSION['user_id'], 'queue_checkin', 'Checked in patient ' . $patient_name);

respond_json([
	"success" => true,
	"queue_number" => $result['queue_number'],
	"queue_id" => $result['queue_id'],
]);