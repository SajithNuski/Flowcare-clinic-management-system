<?php
/*
TDD means Test Driven Development.
We write tests first so the code has a clear target.
The tests show the behavior we want before we build it.
If a test fails, it tells us exactly what still needs work.
*/

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Appointment.php';

mysqli_report(MYSQLI_REPORT_OFF);

$appointment_model = new Appointment($conn);
$user_model = new User($conn);

$test_date = date('Y-m-d');
$test_doctor_id = 1;
$test_patient_counter = 1;
$test_patient_nics = [];
$test_appointment_ids = [];

function print_test_header($test_name) {
	echo $test_name . PHP_EOL;
}

function print_pass() {
	echo "✅ PASS" . PHP_EOL . PHP_EOL;
}

function print_fail($reason) {
	echo "❌ FAIL: " . $reason . PHP_EOL . PHP_EOL;
}

function delete_test_patient_by_nic($nic) {
	global $conn;

	$stmt = mysqli_prepare($conn, "DELETE FROM users WHERE nic = ?");
	mysqli_stmt_bind_param($stmt, "s", $nic);
	mysqli_stmt_execute($stmt);
	mysqli_stmt_close($stmt);
}

function delete_test_appointments($appointment_ids) {
	global $conn;

	if (empty($appointment_ids)) {
		return;
	}

	$placeholders = implode(',', array_fill(0, count($appointment_ids), '?'));
	$types = str_repeat('i', count($appointment_ids));
	$stmt = mysqli_prepare($conn, "DELETE FROM appointments WHERE id IN ($placeholders)");
	mysqli_stmt_bind_param($stmt, $types, ...$appointment_ids);
	mysqli_stmt_execute($stmt);
	mysqli_stmt_close($stmt);
}

function clear_test_appointments_for_day() {
	global $conn, $test_doctor_id, $test_date;

	$stmt = mysqli_prepare($conn, "DELETE FROM appointments WHERE doctor_id = ? AND appointment_date = ?");
	mysqli_stmt_bind_param($stmt, "is", $test_doctor_id, $test_date);
	mysqli_stmt_execute($stmt);
	mysqli_stmt_close($stmt);
}

function create_test_patient() {
	global $user_model, $test_patient_counter, $test_patient_nics;

	$nic = 'ATEST' . str_pad((string) $test_patient_counter, 6, '0', STR_PAD_LEFT) . 'V';
	$email = 'appointment' . $test_patient_counter . '@flowcare.lk';
	$password = 'appointmentpass123';

	delete_test_patient_by_nic($nic);

	$user_id = $user_model->register(
		'Appointment Test ' . $test_patient_counter,
		$nic,
		'1998-01-01',
		'other',
		'0700000000',
		$email,
		$password,
		'patient'
	);

	$test_patient_counter++;

	if ($user_id === false) {
		return false;
	}

	$test_patient_nics[] = $nic;
	return $user_id;
}

function get_appointment_row($appointment_id) {
	global $conn;

	$stmt = mysqli_prepare(
		$conn,
		"SELECT id, patient_id, doctor_id, appointment_date, time_slot, visit_reason, notes, status, created_at FROM appointments WHERE id = ? LIMIT 1"
	);
	mysqli_stmt_bind_param($stmt, "i", $appointment_id);
	mysqli_stmt_execute($stmt);
	$result = mysqli_stmt_get_result($stmt);
	$row = $result ? mysqli_fetch_assoc($result) : false;
	mysqli_stmt_close($stmt);

	return $row;
}

function remember_appointment_id($appointment_id) {
	global $test_appointment_ids;

	if (is_int($appointment_id) && $appointment_id > 0) {
		$test_appointment_ids[] = $appointment_id;
	}
}

function test_can_create_appointment() {
	global $appointment_model, $test_doctor_id, $test_date;

	print_test_header(__FUNCTION__);
	clear_test_appointments_for_day();

	$patient_id = create_test_patient();

	if ($patient_id === false) {
		print_fail('Could not create a test patient.');
		return false;
	}

	$appointment_id = $appointment_model->create(
		$patient_id,
		$test_doctor_id,
		$test_date,
		'09:00',
		'General consultation',
		'First appointment test'
	);

	if (is_int($appointment_id) && $appointment_id > 0) {
		remember_appointment_id($appointment_id);
		print_pass();
		return $appointment_id;
	}

	print_fail('Expected an appointment ID for a free slot.');
	return false;
}

function test_duplicate_slot_rejected() {
	global $appointment_model, $test_doctor_id, $test_date;

	print_test_header(__FUNCTION__);
	clear_test_appointments_for_day();

	$patient_one = create_test_patient();
	$patient_two = create_test_patient();

	if ($patient_one === false || $patient_two === false) {
		print_fail('Could not create test patients.');
		return false;
	}

	$first = $appointment_model->create($patient_one, $test_doctor_id, $test_date, '09:30', 'General consultation', 'Slot check one');
	$second = $appointment_model->create($patient_two, $test_doctor_id, $test_date, '09:30', 'General consultation', 'Slot check two');

	if (is_int($first) && $first > 0 && $second === false) {
		remember_appointment_id($first);
		print_pass();
		return true;
	}

	print_fail('Expected the second booking for the same slot to be rejected.');
	return false;
}

function test_can_cancel() {
	global $appointment_model, $test_doctor_id, $test_date;

	print_test_header(__FUNCTION__);
	clear_test_appointments_for_day();

	$patient_id = create_test_patient();

	if ($patient_id === false) {
		print_fail('Could not create a test patient.');
		return false;
	}

	$appointment_id = $appointment_model->create($patient_id, $test_doctor_id, $test_date, '10:00', 'General consultation', 'Cancel test');

	if ($appointment_id === false) {
		print_fail('Could not create an appointment.');
		return false;
	}

	remember_appointment_id($appointment_id);
	$cancelled = $appointment_model->cancel($appointment_id);
	$row = get_appointment_row($appointment_id);

	if ($cancelled && is_array($row) && $row['status'] === 'cancelled') {
		print_pass();
		return true;
	}

	print_fail('Expected status = cancelled.');
	return false;
}

function test_can_reschedule() {
	global $appointment_model, $test_doctor_id, $test_date;

	print_test_header(__FUNCTION__);
	clear_test_appointments_for_day();

	$patient_id = create_test_patient();

	if ($patient_id === false) {
		print_fail('Could not create a test patient.');
		return false;
	}

	$appointment_id = $appointment_model->create($patient_id, $test_doctor_id, $test_date, '10:30', 'General consultation', 'Reschedule test');

	if ($appointment_id === false) {
		print_fail('Could not create an appointment.');
		return false;
	}

	remember_appointment_id($appointment_id);
	$new_date = date('Y-m-d', strtotime($test_date . ' +1 day'));
	$rescheduled = $appointment_model->reschedule($appointment_id, $new_date, '11:00');
	$row = get_appointment_row($appointment_id);

	if ($rescheduled && is_array($row) && $row['status'] === 'rescheduled' && $row['appointment_date'] === $new_date && $row['time_slot'] === '11:00') {
		print_pass();
		return true;
	}

	print_fail('Expected the appointment to be rescheduled with updated date and time.');
	return false;
}

$result = test_can_create_appointment();
$result = test_duplicate_slot_rejected();
$result = test_can_cancel();
$result = test_can_reschedule();

delete_test_appointments(array_values(array_unique($test_appointment_ids)));

foreach ($test_patient_nics as $nic) {
	delete_test_patient_by_nic($nic);
}