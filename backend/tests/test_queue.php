<?php
/*
TDD means Test Driven Development.
We write tests first so the code has a clear target.
The tests describe the behavior we need before we build it.
If a test fails, it tells us exactly what still needs work.
*/

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Queue.php';

mysqli_report(MYSQLI_REPORT_OFF);

$queue_model = new Queue($conn);
$user_model = new User($conn);

$test_date = date('Y-m-d');
$test_doctor_id = 1;
$test_patients = [];
$test_queue_ids = [];

function print_test_header($test_name) {
	echo $test_name . PHP_EOL;
}

function print_pass() {
	echo "✅ PASS" . PHP_EOL . PHP_EOL;
}

function print_fail($reason) {
	echo "❌ FAIL: " . $reason . PHP_EOL . PHP_EOL;
}

function create_queue_test_patient($suffix) {
	global $user_model;

	$nic = 'QTEST' . str_pad((string) $suffix, 6, '0', STR_PAD_LEFT) . 'V';
	$email = 'queue' . $suffix . '@flowcare.lk';
	$password = 'queuepass123';

	delete_queue_test_patient($nic);

	$user_id = $user_model->register(
		'Queue Test ' . $suffix,
		$nic,
		'1998-01-01',
		'other',
		'0700000000',
		$email,
		$password,
		'patient'
	);

	return $user_id === false ? false : ['id' => $user_id, 'nic' => $nic];
}

function delete_queue_test_patient($nic) {
	global $conn;

	$stmt = mysqli_prepare($conn, "DELETE FROM patients WHERE nic = ?");
	mysqli_stmt_bind_param($stmt, "s", $nic);
	mysqli_stmt_execute($stmt);
	mysqli_stmt_close($stmt);
}

function delete_queue_test_entries($queue_ids) {
	global $conn;

	if (empty($queue_ids)) {
		return;
	}

	$placeholders = implode(',', array_fill(0, count($queue_ids), '?'));
	$types = str_repeat('i', count($queue_ids));
	$stmt = mysqli_prepare($conn, "DELETE FROM queue WHERE id IN ($placeholders)");
	mysqli_stmt_bind_param($stmt, $types, ...$queue_ids);
	mysqli_stmt_execute($stmt);
	mysqli_stmt_close($stmt);
}

function clear_test_queue_for_day() {
	global $conn, $test_doctor_id, $test_date;

	$stmt = mysqli_prepare($conn, "DELETE FROM queue WHERE doctor_id = ? AND date = ?");
	mysqli_stmt_bind_param($stmt, "is", $test_doctor_id, $test_date);
	mysqli_stmt_execute($stmt);
	mysqli_stmt_close($stmt);
}

function get_queue_row($queue_id) {
	global $conn;

	$stmt = mysqli_prepare(
		$conn,
		"SELECT id, patient_id, doctor_id, queue_number, date, status, check_in_time, completed_time FROM queue WHERE id = ? LIMIT 1"
	);
	mysqli_stmt_bind_param($stmt, "i", $queue_id);
	mysqli_stmt_execute($stmt);
	$result = mysqli_stmt_get_result($stmt);
	$row = $result ? mysqli_fetch_assoc($result) : false;
	mysqli_stmt_close($stmt);

	return $row;
}

function seed_queue_patient($suffix) {
	global $test_patients;

	$patient = create_queue_test_patient($suffix);

	if ($patient !== false) {
		$test_patients[] = $patient;
	}

	return $patient;
}

function remember_queue_result($result) {
	global $test_queue_ids;

	if (is_array($result) && isset($result['queue_id'])) {
		$test_queue_ids[] = (int) $result['queue_id'];
	}
}

function test_can_add_patient_to_queue() {
	global $queue_model, $test_doctor_id, $test_date;

	print_test_header(__FUNCTION__);
	clear_test_queue_for_day();

	$patient = seed_queue_patient(1);

	if ($patient === false) {
		print_fail('Could not create a test patient.');
		return false;
	}

	$result = $queue_model->add_to_queue($patient['id'], $test_doctor_id, $test_date);

	if (is_array($result) && isset($result['queue_number'], $result['queue_id'])) {
		remember_queue_result($result);
		print_pass();
		return $result;
	}

	print_fail('Expected queue_id and queue_number in the result.');
	return false;
}

function test_queue_numbers_increment() {
	global $queue_model, $test_doctor_id, $test_date;

	print_test_header(__FUNCTION__);
	clear_test_queue_for_day();

	$patient_one = seed_queue_patient(2);
	$patient_two = seed_queue_patient(3);

	if ($patient_one === false || $patient_two === false) {
		print_fail('Could not create test patients.');
		return false;
	}

	$first = $queue_model->add_to_queue($patient_one['id'], $test_doctor_id, $test_date);
	$second = $queue_model->add_to_queue($patient_two['id'], $test_doctor_id, $test_date);
	remember_queue_result($first);
	remember_queue_result($second);

	if (is_array($first) && is_array($second) && (int) $second['queue_number'] === 2) {
		print_pass();
		return [$first['queue_id'], $second['queue_id']];
	}

	print_fail('Expected the second patient to get queue_number = 2.');
	return false;
}

function test_can_get_live_queue() {
	global $queue_model, $test_doctor_id, $test_date;

	print_test_header(__FUNCTION__);
	clear_test_queue_for_day();

	$patient = seed_queue_patient(4);

	if ($patient === false) {
		print_fail('Could not create a test patient.');
		return false;
	}

	$queued = $queue_model->add_to_queue($patient['id'], $test_doctor_id, $test_date);
	remember_queue_result($queued);

	$live_queue = $queue_model->get_live_queue($test_doctor_id, $test_date);

	if (is_array($live_queue) && count($live_queue) > 0) {
		print_pass();
		return true;
	}

	print_fail('Expected an array of waiting patients.');
	return false;
}

function test_can_mark_complete() {
	global $queue_model, $test_doctor_id, $test_date;

	print_test_header(__FUNCTION__);
	clear_test_queue_for_day();

	$patient = seed_queue_patient(5);

	if ($patient === false) {
		print_fail('Could not create a test patient.');
		return false;
	}

	$queued = $queue_model->add_to_queue($patient['id'], $test_doctor_id, $test_date);
	remember_queue_result($queued);

	if ($queued === false) {
		print_fail('Could not add patient to queue.');
		return false;
	}

	$completed = $queue_model->mark_complete($queued['queue_id']);
	$row = get_queue_row($queued['queue_id']);

	if ($completed && is_array($row) && $row['status'] === 'completed') {
		print_pass();
		return [$queued['queue_id']];
	}

	print_fail('Expected status = completed.');
	return false;
}

function test_can_mark_no_show() {
	global $queue_model, $test_doctor_id, $test_date;

	print_test_header(__FUNCTION__);
	clear_test_queue_for_day();

	$patient = seed_queue_patient(6);

	if ($patient === false) {
		print_fail('Could not create a test patient.');
		return false;
	}

	$queued = $queue_model->add_to_queue($patient['id'], $test_doctor_id, $test_date);
	remember_queue_result($queued);

	if ($queued === false) {
		print_fail('Could not add patient to queue.');
		return false;
	}

	$marked = $queue_model->mark_no_show($queued['queue_id']);
	$row = get_queue_row($queued['queue_id']);

	if ($marked && is_array($row) && $row['status'] === 'no_show') {
		print_pass();
		return [$queued['queue_id']];
	}

	print_fail('Expected status = no_show.');
	return false;
}

function test_queue_position_is_correct() {
	global $queue_model, $test_doctor_id, $test_date;

	print_test_header(__FUNCTION__);
	clear_test_queue_for_day();

	$patient_a = seed_queue_patient(7);
	$patient_b = seed_queue_patient(8);
	$patient_c = seed_queue_patient(9);

	if ($patient_a === false || $patient_b === false || $patient_c === false) {
		print_fail('Could not create the test patients.');
		return false;
	}

	$queue_a = $queue_model->add_to_queue($patient_a['id'], $test_doctor_id, $test_date);
	$queue_b = $queue_model->add_to_queue($patient_b['id'], $test_doctor_id, $test_date);
	$queue_c = $queue_model->add_to_queue($patient_c['id'], $test_doctor_id, $test_date);
	remember_queue_result($queue_a);
	remember_queue_result($queue_b);
	remember_queue_result($queue_c);

	if ($queue_a === false || $queue_b === false || $queue_c === false) {
		print_fail('Could not add all patients to the queue.');
		return false;
	}

	$queue_model->mark_complete($queue_a['queue_id']);
	$status = $queue_model->get_my_queue_status($patient_b['id'], $test_date);

	if (is_array($status) && isset($status['position']) && (int) $status['position'] === 0) {
		print_pass();
		return [$queue_a['queue_id'], $queue_b['queue_id'], $queue_c['queue_id']];
	}

	print_fail('Expected the second patient position to be 0.');
	return false;
}

$cleanup_queue_ids = [];

$result = test_can_add_patient_to_queue();
if (is_array($result) && isset($result['queue_id'])) {
	$cleanup_queue_ids[] = (int) $result['queue_id'];
}

$result = test_queue_numbers_increment();
if (is_array($result)) {
	$cleanup_queue_ids = array_merge($cleanup_queue_ids, array_map('intval', $result));
}

test_can_get_live_queue();

$result = test_can_mark_complete();
if (is_array($result)) {
	$cleanup_queue_ids = array_merge($cleanup_queue_ids, array_map('intval', $result));
}

$result = test_can_mark_no_show();
if (is_array($result)) {
	$cleanup_queue_ids = array_merge($cleanup_queue_ids, array_map('intval', $result));
}

$result = test_queue_position_is_correct();
if (is_array($result)) {
	$cleanup_queue_ids = array_merge($cleanup_queue_ids, array_map('intval', $result));
}

$cleanup_queue_ids = array_values(array_unique(array_merge($cleanup_queue_ids, $test_queue_ids)));
delete_queue_test_entries($cleanup_queue_ids);

foreach ($test_patients as $patient) {
	delete_queue_test_patient($patient['nic']);
}