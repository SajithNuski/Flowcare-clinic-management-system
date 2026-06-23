<?php
/*
TDD means Test Driven Development.
We write the test first so we know exactly what the code must do.
Then we build the model to make these tests pass.
If a test fails, it shows us what still needs to be fixed.
*/

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../models/User.php';

mysqli_report(MYSQLI_REPORT_OFF);

$test_nic = 'TEST123456V';
$test_name = 'Test Patient';
$test_email = 'test.patient@flowcare.lk';
$test_password = 'testpass123';
$test_new_email = 'updated.patient@flowcare.lk';
$test_new_phone = '0711111111';
$test_new_password = 'newtestpass123';
$current_test_email = $test_email;
$current_test_password = $test_password;
$current_test_user_id = null;

$user_model = new User($conn);

function print_test_header($test_name) {
	echo $test_name . PHP_EOL;
}

function print_pass() {
	echo "✅ PASS" . PHP_EOL . PHP_EOL;
}

function print_fail($reason) {
	echo "❌ FAIL: " . $reason . PHP_EOL . PHP_EOL;
}

function delete_test_patient($conn, $nic) {
	$stmt = mysqli_prepare($conn, "DELETE FROM patients WHERE nic = ?");
	mysqli_stmt_bind_param($stmt, "s", $nic);
	mysqli_stmt_execute($stmt);
	mysqli_stmt_close($stmt);
}

function test_can_register_a_new_patient() {
	global $user_model, $test_nic, $test_name, $test_email, $test_password, $current_test_user_id;

	print_test_header(__FUNCTION__);

	delete_test_patient($GLOBALS['conn'], $test_nic);

	$user_id = $user_model->register(
		$test_name,
		$test_nic,
		'1998-01-01',
		'other',
		'0700000000',
		$test_email,
		$test_password,
		'patient'
	);

	if (is_int($user_id)) {
		$current_test_user_id = $user_id;
		print_pass();
		return $user_id;
	}

	print_fail('Expected an integer ID, got false or another value.');
	return false;
}

function test_duplicate_nic_is_rejected() {
	global $user_model, $test_nic, $test_name, $test_email, $test_password;

	print_test_header(__FUNCTION__);

	$duplicate_id = $user_model->register(
		'Duplicate Patient',
		$test_nic,
		'1998-01-01',
		'other',
		'0700000000',
		'duplicate.patient@flowcare.lk',
		'testpass123',
		'patient'
	);

	if ($duplicate_id === false) {
		print_pass();
		return true;
	}

	print_fail('Expected false, but a duplicate record was inserted.');
	return false;
}

function test_can_login_with_correct_password() {
	global $user_model, $test_email, $test_password;

	print_test_header(__FUNCTION__);

	$user = $user_model->login($test_email, $test_password);

	if (is_array($user) && isset($user['role']) && $user['role'] === 'patient') {
		print_pass();
		return true;
	}

	print_fail('Expected a user array with role = patient.');
	return false;
}

function test_login_fails_with_wrong_password() {
	global $user_model, $test_email;

	print_test_header(__FUNCTION__);

	$user = $user_model->login($test_email, 'wrongpass');

	if ($user === false) {
		print_pass();
		return true;
	}

	print_fail('Expected false for a wrong password.');
	return false;
}

function test_inactive_user_cannot_login() {
	global $user_model, $current_test_user_id, $current_test_email, $current_test_password;

	print_test_header(__FUNCTION__);

	if (!is_int($current_test_user_id)) {
		print_fail('Could not find the test user ID before deactivating.');
		return false;
	}

	$deactivated = $user_model->deactivate($current_test_user_id);

	if (!$deactivated) {
		print_fail('Could not deactivate the test user.');
		return false;
	}

	$user = $user_model->login($current_test_email, $current_test_password);

	if ($user === false) {
		print_pass();
		return true;
	}

	print_fail('Expected false for an inactive user.');
	return false;
}

function test_get_by_id_returns_user_data() {
	global $user_model, $current_test_user_id;

	print_test_header(__FUNCTION__);

	if (!is_int($current_test_user_id)) {
		print_fail('Could not locate the test user ID.');
		return false;
	}

	$user = $user_model->get_by_id($current_test_user_id);

	if (is_array($user) && isset($user['nic']) && $user['nic'] === 'TEST123456V') {
		print_pass();
		return true;
	}

	print_fail('Expected user data from get_by_id().');
	return false;
}

function test_get_all_by_role_returns_patients() {
	global $user_model;

	print_test_header(__FUNCTION__);

	$users = $user_model->get_all_by_role('patient');

	if (is_array($users) && count($users) > 0) {
		foreach ($users as $user) {
			if (isset($user['nic']) && $user['nic'] === 'TEST123456V') {
				print_pass();
				return true;
			}
		}
	}

	print_fail('Expected the patient list to include the test user.');
	return false;
}

function test_update_changes_basic_user_info() {
	global $user_model, $current_test_user_id, $test_email, $test_password, $test_new_email, $test_new_phone, $current_test_email;

	print_test_header(__FUNCTION__);

	if (!is_int($current_test_user_id)) {
		print_fail('Could not locate the test user ID.');
		return false;
	}

	$updated = $user_model->update($current_test_user_id, 'Updated Test Patient', $test_new_phone, $test_new_email);

	if (!$updated) {
		print_fail('Update returned false.');
		return false;
	}

	$refreshed_user = $user_model->get_by_id($current_test_user_id);

	if (is_array($refreshed_user) && $refreshed_user['email'] === $test_new_email && $refreshed_user['phone'] === $test_new_phone) {
		$current_test_email = $test_new_email;
		print_pass();
		return true;
	}

	print_fail('Expected updated name, phone, and email.');
	return false;
}

function test_activate_restores_login_access() {
	global $user_model, $current_test_user_id, $current_test_email, $test_password;

	print_test_header(__FUNCTION__);

	if (!is_int($current_test_user_id)) {
		print_fail('Could not locate the updated test user ID.');
		return false;
	}

	$activated = $user_model->activate($current_test_user_id);

	if (!$activated) {
		print_fail('Activate returned false.');
		return false;
	}

	$user = $user_model->login($current_test_email, $test_password);

	if (is_array($user) && $user['role'] === 'patient') {
		print_pass();
		return true;
	}

	print_fail('Expected the user to be able to log in after activation.');
	return false;
}

function test_change_password_updates_login_credentials() {
	global $user_model, $current_test_user_id, $current_test_email, $test_password, $test_new_password, $current_test_password;

	print_test_header(__FUNCTION__);

	if (!is_int($current_test_user_id)) {
		print_fail('Could not locate the test user ID for password change.');
		return false;
	}

	$changed = $user_model->change_password($current_test_user_id, 'testpass123', $test_new_password);

	if (!$changed) {
		print_fail('change_password returned false.');
		return false;
	}

	$old_login = $user_model->login($current_test_email, $test_password);
	$new_login = $user_model->login($current_test_email, $test_new_password);

	if ($old_login === false && is_array($new_login) && $new_login['role'] === 'patient') {
		$current_test_password = $test_new_password;
		print_pass();
		return true;
	}

	print_fail('Expected old password to fail and new password to work.');
	return false;
}

delete_test_patient($conn, $test_nic);


$created_user_id = test_can_register_a_new_patient();
test_duplicate_nic_is_rejected();
test_can_login_with_correct_password();
test_login_fails_with_wrong_password();
test_get_by_id_returns_user_data();
test_get_all_by_role_returns_patients();
test_update_changes_basic_user_info();
test_inactive_user_cannot_login();
test_activate_restores_login_access();
test_change_password_updates_login_credentials();

delete_test_patient($conn, $test_nic);