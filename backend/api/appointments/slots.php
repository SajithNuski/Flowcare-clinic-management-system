<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["error" => "Method not allowed"], 405);
}

$doctor_id = isset($_GET['doctor_id']) ? (int) $_GET['doctor_id'] : 0;
$date = trim($_GET['date'] ?? '');

if ($doctor_id <= 0 || $date === '') {
	respond_json(["error" => "doctor_id and date are required"], 400);
}

$date_object = DateTime::createFromFormat('Y-m-d', $date);
if (!$date_object || $date_object->format('Y-m-d') !== $date) {
	respond_json(["error" => "Invalid date"], 400);
}

$stmt = mysqli_prepare(
	$conn,
	"SELECT working_time, working_days FROM doctors WHERE id = ? LIMIT 1"
);
mysqli_stmt_bind_param($stmt, "i", $doctor_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$row = $result ? mysqli_fetch_assoc($result) : null;
mysqli_stmt_close($stmt);

$start_str = '09:00';
$end_str = '17:00';

$working_time = $row && !empty($row['working_time']) ? trim($row['working_time']) : '09:00-17:00';

// If the doctor has configured working days and this date isn't one of
// them, there are no bookable slots at all — no point generating a list.
if ($row && !empty($row['working_days'])) {
	$working_days = array_map('trim', explode(',', $row['working_days']));
	$requested_day_name = $date_object->format('D'); // Mon, Tue, Wed...
	if (!in_array($requested_day_name, $working_days, true)) {
		respond_json([]);
	}
}


if (preg_match('/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i', $working_time, $matches)) {
	$start_raw = trim($matches[1]);
	$end_raw = trim($matches[2]);

	$start_dt = DateTime::createFromFormat('g:i A', $start_raw);
	if (!$start_dt) $start_dt = DateTime::createFromFormat('G:i', $start_raw);
	if (!$start_dt) $start_dt = DateTime::createFromFormat('H:i', $start_raw);

	$end_dt = DateTime::createFromFormat('g:i A', $end_raw);
	if (!$end_dt) $end_dt = DateTime::createFromFormat('G:i', $end_raw);
	if (!$end_dt) $end_dt = DateTime::createFromFormat('H:i', $end_raw);

	if ($start_dt) {
		$start_str = $start_dt->format('H:i');
	}
	if ($end_dt) {
		$end_str = $end_dt->format('H:i');
	}
}

$appt_stmt = mysqli_prepare(
	$conn,
	"SELECT appointment_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status IN ('confirmed', 'rescheduled', 'completed')"
);

$booked_times = [];
if ($appt_stmt) {
	mysqli_stmt_bind_param($appt_stmt, "is", $doctor_id, $date);
	mysqli_stmt_execute($appt_stmt);
	$appt_result = mysqli_stmt_get_result($appt_stmt);
	while ($appt_row = mysqli_fetch_assoc($appt_result)) {
		$time_raw = trim($appt_row['appointment_time']);
		$time_dt = DateTime::createFromFormat('H:i:s', $time_raw);
		if (!$time_dt) $time_dt = DateTime::createFromFormat('H:i', $time_raw);
		if ($time_dt) {
			$booked_times[] = $time_dt->format('H:i');
		} else {
			$booked_times[] = $time_raw;
		}
	}
	mysqli_stmt_close($appt_stmt);
}

$slots = [];
$start_time = new DateTime($start_str);
$end_time = new DateTime($end_str);

// If the requested date is today, don't offer time slots that have already
// passed — a slot earlier than the current time can't realistically be booked.
$today_str = date('Y-m-d');
$current_time_str = $date === $today_str ? date('H:i') : null;

while ($start_time < $end_time) {
	$slot_str = $start_time->format('H:i');
	$already_booked = in_array($slot_str, $booked_times, true);
	$already_passed = $current_time_str !== null && $slot_str <= $current_time_str;

	if (!$already_booked && !$already_passed) {
		$slots[] = $slot_str;
	}
	$start_time->modify('+10 minutes');
}

respond_json($slots);