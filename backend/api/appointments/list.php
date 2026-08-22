<?php
// This endpoint returns appointments for the current user, doctor, receptionist, or admin.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

if (!isset($_SESSION['user_id'], $_SESSION['role'])) {
	respond_json(["error" => "Not logged in"], 401);
}

require_once __DIR__ . '/../../models/Appointment.php';

$appointment = new Appointment($conn);
$role = $_SESSION['role'];

if ($role === 'patient') {
	$appointments = $appointment->get_by_patient((int) $_SESSION['user_id']);
	respond_json(["success" => true, "appointments" => $appointments ?: []]);
}

if ($role === 'receptionist' || $role === 'admin') {
	$date = isset($_GET['date']) ? trim($_GET['date']) : '';
	if ($date !== '') {
		$date_object = DateTime::createFromFormat('Y-m-d', $date);
		if (!$date_object || $date_object->format('Y-m-d') !== $date) {
			respond_json(["success" => false, "error" => "Invalid date format"], 400);
		}
		$appointments = $appointment->get_today_all($date);
	} else {
		$appointments = $appointment->get_today_all();
	}
	respond_json(["success" => true, "appointments" => $appointments ?: []]);
}

if ($role === 'doctor') {
	$date = trim($_GET['date'] ?? '');

	if ($date === '') {
		respond_json(["success" => false, "error" => "Date is required"], 400);
	}

	$date_object = DateTime::createFromFormat('Y-m-d', $date);
	if (!$date_object || $date_object->format('Y-m-d') !== $date) {
		respond_json(["success" => false, "error" => "Invalid date"], 400);
	}

	$stmt = mysqli_prepare($conn, "SELECT id FROM doctors WHERE id = ? LIMIT 1");
	mysqli_stmt_bind_param($stmt, "i", $_SESSION['user_id']);
	mysqli_stmt_execute($stmt);
	$result = mysqli_stmt_get_result($stmt);
	$doctor_row = $result ? mysqli_fetch_assoc($result) : false;
	mysqli_stmt_close($stmt);

	if (!$doctor_row) {
		respond_json(["success" => false, "error" => "Doctor record not found"], 404);
	}

	$appointments = $appointment->get_by_doctor_and_date((int) $doctor_row['id'], $date);
	respond_json(["success" => true, "appointments" => $appointments ?: []]);
}

respond_json(["success" => false, "error" => "Access denied"], 403);