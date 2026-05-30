<?php
// This endpoint returns the available appointment slots for a doctor on a given date.

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

// Slot generation works like this:
// 1. Read the clinic opening and closing times from the settings table.
// 2. Start at the opening time.
// 3. Add 30 minutes each step until we reach the closing time.
// 4. Collect each generated time in a list.
// 5. Remove any time already booked for the selected doctor and date.

$settings_stmt = mysqli_prepare(
	$conn,
	"SELECT setting_key, setting_value FROM clinic_settings WHERE setting_key IN ('open_time', 'close_time')"
);
mysqli_stmt_execute($settings_stmt);
$settings_result = mysqli_stmt_get_result($settings_stmt);
$settings_rows = $settings_result ? mysqli_fetch_all($settings_result, MYSQLI_ASSOC) : [];
mysqli_stmt_close($settings_stmt);

$open_time = '08:00';
$close_time = '17:00';

foreach ($settings_rows as $row) {
	if ($row['setting_key'] === 'open_time') {
		$open_time = $row['setting_value'];
	}
	if ($row['setting_key'] === 'close_time') {
		$close_time = $row['setting_value'];
	}
}

$start = DateTime::createFromFormat('Y-m-d H:i', $date . ' ' . $open_time);
$end = DateTime::createFromFormat('Y-m-d H:i', $date . ' ' . $close_time);

if (!$start || !$end) {
	respond_json(["error" => "Could not generate slots"], 500);
}

$all_slots = [];
$current = clone $start;

while ($current < $end) {
	$all_slots[] = $current->format('H:i');
	$current->modify('+30 minutes');
}

$booked_stmt = mysqli_prepare(
	$conn,
	"SELECT time_slot FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status IN ('confirmed', 'rescheduled', 'completed', 'no_show')"
);
mysqli_stmt_bind_param($booked_stmt, "is", $doctor_id, $date);
mysqli_stmt_execute($booked_stmt);
$booked_result = mysqli_stmt_get_result($booked_stmt);
$booked_rows = $booked_result ? mysqli_fetch_all($booked_result, MYSQLI_ASSOC) : [];
mysqli_stmt_close($booked_stmt);

$booked_slots = [];
foreach ($booked_rows as $row) {
	$booked_slots[] = $row['time_slot'];
}

$available_slots = array_values(array_filter($all_slots, function ($slot) use ($booked_slots) {
	return !in_array($slot, $booked_slots, true);
}));

respond_json($available_slots);