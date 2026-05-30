<?php
// This endpoint updates appointment status or timing for receptionist and admin users.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

if (!isset($_SESSION['user_id'], $_SESSION['role']) || !in_array($_SESSION['role'], ['receptionist', 'admin'], true)) {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

require_once __DIR__ . '/../../models/Appointment.php';

$data = get_request_body();
$appointment_id = isset($data['appointment_id']) ? (int) $data['appointment_id'] : 0;
$action = trim($data['action'] ?? '');

if ($appointment_id <= 0 || $action === '') {
	respond_json(["success" => false, "error" => "Appointment ID and action are required"], 400);
}

$appointment = new Appointment($conn);
$success = false;
$activity_message = '';

if ($action === 'cancel') {
	$success = $appointment->cancel($appointment_id);
	$activity_message = 'Cancelled appointment #' . $appointment_id;
} elseif ($action === 'no_show') {
	$success = $appointment->mark_no_show($appointment_id);
	$activity_message = 'Marked appointment #' . $appointment_id . ' as no-show';
} elseif ($action === 'reschedule') {
	$new_date = trim($data['new_date'] ?? '');
	$new_time_slot = trim($data['new_time_slot'] ?? '');

	if ($new_date === '' || $new_time_slot === '') {
		respond_json(["success" => false, "error" => "New date and time slot are required"], 400);
	}

	$date_object = DateTime::createFromFormat('Y-m-d', $new_date);
	if (!$date_object || $date_object->format('Y-m-d') !== $new_date) {
		respond_json(["success" => false, "error" => "Invalid new date"], 400);
	}

	$success = $appointment->reschedule($appointment_id, $new_date, $new_time_slot);
	$activity_message = 'Rescheduled appointment #' . $appointment_id . ' to ' . $new_date . ' ' . $new_time_slot;
} else {
	respond_json(["success" => false, "error" => "Invalid action"], 400);
}

if (!$success) {
	respond_json(["success" => false, "error" => "Appointment update failed"], 400);
}

log_activity($conn, (int) $_SESSION['user_id'], 'appointment_update', $activity_message);

respond_json(["success" => true, "message" => "Appointment updated"]);