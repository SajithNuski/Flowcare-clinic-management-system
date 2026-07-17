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

if (!isset($_SESSION['user_id'], $_SESSION['role']) || !in_array($_SESSION['role'], ['receptionist', 'admin', 'patient'], true)) {
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
$appt_data = $appointment->get_by_id($appointment_id);

if (!$appt_data) {
	respond_json(["success" => false, "error" => "Appointment not found"], 404);
}

// If patient is performing the action, check if they own the appointment and if they are allowed to do this action
if ($_SESSION['role'] === 'patient') {
	if ((int)$appt_data['patient_id'] !== (int)$_SESSION['user_id']) {
		respond_json(["success" => false, "error" => "Access denied. You cannot manage other patients' appointments."], 403);
	}
	if ($action !== 'cancel') {
		respond_json(["success" => false, "error" => "Access denied. Patients are only allowed to cancel appointments."], 403);
	}
}

$success = false;
$activity_message = '';

if ($action === 'cancel') {
	// Only allow cancelling an appointment while its status is still "booked" (confirmed or rescheduled)
	// If it's already been checked into the queue or marked completed, block the cancellation and explain why.

	// Check if already checked into the queue
	$queue_stmt = mysqli_prepare($conn, "SELECT id FROM queue WHERE patient_id = ? AND doctor_id = ? AND date = ? LIMIT 1");
	mysqli_stmt_bind_param($queue_stmt, "iis", $appt_data['patient_id'], $appt_data['doctor_id'], $appt_data['appointment_date']);
	mysqli_stmt_execute($queue_stmt);
	$queue_res = mysqli_stmt_get_result($queue_stmt);
	$is_in_queue = $queue_res && mysqli_num_rows($queue_res) > 0;
	mysqli_stmt_close($queue_stmt);

	if ($is_in_queue) {
		respond_json(["success" => false, "error" => "Cannot cancel this appointment because you have already been checked into the queue."], 400);
	}

	if ($appt_data['status'] === 'completed') {
		respond_json(["success" => false, "error" => "Cannot cancel this appointment because it has already been marked as completed."], 400);
	}

	if (!in_array($appt_data['status'], ['confirmed', 'rescheduled'], true)) {
		respond_json(["success" => false, "error" => "Cannot cancel this appointment. Only upcoming booked appointments can be cancelled."], 400);
	}

	$success = $appointment->cancel($appointment_id);
	$activity_message = 'Cancelled appointment #' . $appointment_id;
} elseif ($action === 'no_show') {
	$success = $appointment->mark_no_show($appointment_id);
	$activity_message = 'Marked appointment #' . $appointment_id . ' as no-show';
} elseif ($action === 'reschedule') {
	$new_date = trim($data['new_date'] ?? '');
	$new_appointment_time = trim($data['new_appointment_time'] ?? $data['new_time_slot'] ?? '');

	if ($new_date === '' || $new_appointment_time === '') {
		respond_json(["success" => false, "error" => "New date and appointment time are required"], 400);
	}

	$date_object = DateTime::createFromFormat('Y-m-d', $new_date);
	if (!$date_object || $date_object->format('Y-m-d') !== $new_date) {
		respond_json(["success" => false, "error" => "Invalid new date"], 400);
	}

	$success = $appointment->reschedule($appointment_id, $new_date, $new_appointment_time);
	$activity_message = 'Rescheduled appointment #' . $appointment_id . ' to ' . $new_date . ' ' . $new_appointment_time;
} else {
	respond_json(["success" => false, "error" => "Invalid action"], 400);
}

if (!$success) {
	respond_json(["success" => false, "error" => "Appointment update failed"], 400);
}

log_activity($conn, (int) $_SESSION['user_id'], 'appointment_update', $activity_message);

respond_json(["success" => true, "message" => "Appointment updated"]);