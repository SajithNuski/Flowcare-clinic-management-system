<?php
// This endpoint returns the current queue status for patients, doctors, and receptionists.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["error" => "Method not allowed"], 405);
}

// Public landing page visitors can see a simple clinic-wide queue snapshot without logging in.
if (!isset($_SESSION['user_id'], $_SESSION['role'])) {
	$today = date('Y-m-d');

	$serving_stmt = mysqli_prepare(
		$conn,
		"SELECT queue_number FROM queue WHERE date = ? AND status IN ('in_consultation', 'waiting') ORDER BY CASE WHEN status = 'in_consultation' THEN 0 ELSE 1 END, queue_number ASC LIMIT 1"
	);
	mysqli_stmt_bind_param($serving_stmt, "s", $today);
	mysqli_stmt_execute($serving_stmt);
	$serving_result = mysqli_stmt_get_result($serving_stmt);
	$serving_row = $serving_result ? mysqli_fetch_assoc($serving_result) : false;
	mysqli_stmt_close($serving_stmt);

	$summary_stmt = mysqli_prepare(
		$conn,
		"SELECT COALESCE(SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END), 0) AS waiting, COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed, COALESCE(ROUND(AVG(TIMESTAMPDIFF(MINUTE, check_in_time, completed_time)), 0), 0) AS avg_wait FROM queue WHERE date = ?"
	);
	mysqli_stmt_bind_param($summary_stmt, "s", $today);
	mysqli_stmt_execute($summary_stmt);
	$summary_result = mysqli_stmt_get_result($summary_stmt);
	$summary_row = $summary_result ? mysqli_fetch_assoc($summary_result) : ['waiting' => 0, 'completed' => 0, 'avg_wait' => 0];
	mysqli_stmt_close($summary_stmt);

	respond_json([
		"open_now" => true,
		"queue_number" => $serving_row ? (int) $serving_row['queue_number'] : 0,
		"waiting" => (int) $summary_row['waiting'],
		"estimated_wait_minutes" => (int) $summary_row['avg_wait'],
		"completed" => (int) $summary_row['completed'],
		"status" => "open",
	]);
}

if (!isset($_SESSION['user_id'], $_SESSION['role'])) {
	respond_json(["error" => "Not logged in"], 401);
}

require_once __DIR__ . '/../../models/Queue.php';

$queue = new Queue($conn);
$role = $_SESSION['role'];
$today = date('Y-m-d');

if ($role === 'patient') {
	$status = $queue->get_my_queue_status((int) $_SESSION['user_id'], $today);

	if ($status === false) {
		respond_json([
			"success" => true,
			"checked_in" => false,
			"message" => "Queue entry not found"
		]);
	}

	$avg_wait = $queue->calculate_avg_wait($today);
	$estimated_wait_minutes = null;

	if ($avg_wait !== false && $avg_wait !== null) {
		$estimated_wait_minutes = (int) round(((int) $status['position']) * (float) $avg_wait);
	}

	respond_json([
		"success" => true,
		"checked_in" => true,
		"queue_number" => (int) $status['queue_number'],
		"position" => (int) $status['position'],
		"estimated_wait_minutes" => $estimated_wait_minutes,
		"status" => $status['status'],
	]);
}

if ($role === 'doctor') {
	$doctor_stmt = mysqli_prepare($conn, "SELECT id FROM doctors WHERE id = ? LIMIT 1");
	mysqli_stmt_bind_param($doctor_stmt, "i", $_SESSION['user_id']);
	mysqli_stmt_execute($doctor_stmt);
	$doctor_result = mysqli_stmt_get_result($doctor_stmt);
	$doctor_row = $doctor_result ? mysqli_fetch_assoc($doctor_result) : false;
	mysqli_stmt_close($doctor_stmt);

	if (!$doctor_row) {
		respond_json(["error" => "Doctor record not found"], 404);
	}

	$all = isset($_GET['all']) && $_GET['all'] === 'true';
	$live_queue = $queue->get_doctor_queue((int) $doctor_row['id'], $today, $all);
	respond_json($live_queue ?: []);
}

if ($role === 'receptionist') {
	$all = isset($_GET['all']) && $_GET['all'] === 'true';
	if ($all) {
		$live_queue = $queue->get_full_queue_all($today);
	} else {
		$live_queue = $queue->get_live_queue_all($today);
	}
	respond_json($live_queue ?: []);
}

respond_json(["error" => "Access denied"], 403);