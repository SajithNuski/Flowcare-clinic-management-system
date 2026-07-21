<?php
// This endpoint moves the next waiting patient into consultation for a doctor.

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

$doctor_stmt = mysqli_prepare($conn, "SELECT id FROM doctors WHERE id = ? LIMIT 1");
mysqli_stmt_bind_param($doctor_stmt, "i", $_SESSION['user_id']);
mysqli_stmt_execute($doctor_stmt);
$doctor_result = mysqli_stmt_get_result($doctor_stmt);
$doctor_row = $doctor_result ? mysqli_fetch_assoc($doctor_result) : false;
mysqli_stmt_close($doctor_stmt);

if (!$doctor_row) {
	respond_json(["success" => false, "error" => "Doctor record not found"], 404);
}

$queue = new Queue($conn);
$next_patient = $queue->call_next((int) $doctor_row['id']);

if ($next_patient === false) {
	respond_json(["success" => false, "error" => "No waiting patients"], 404);
}

respond_json([
	"success" => true,
	"patient" => $next_patient,
]);