<?php
// This endpoint manages doctor and receptionist users for the admin panel.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

require_role('admin');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	$stmt = mysqli_prepare(
		$conn,
		"SELECT id, full_name, nic, date_of_birth, gender, phone, address, email, 'doctor' AS role, status, created_at, id AS doctor_id, specialisation, working_days, working_time, bio FROM doctors
		 UNION ALL
		 SELECT id, full_name, nic, date_of_birth, gender, phone, address, email, 'receptionist' AS role, status, created_at, NULL AS doctor_id, NULL AS specialisation, NULL AS working_days, NULL AS working_time, NULL AS bio FROM receptionist
		 ORDER BY role ASC, full_name ASC"
	);
	mysqli_stmt_execute($stmt);
	$result = mysqli_stmt_get_result($stmt);
	$users = $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
	mysqli_stmt_close($stmt);

	respond_json(["success" => true, "users" => $users]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

require_once __DIR__ . '/../../models/User.php';

$data = get_request_body();
$action = trim($data['action'] ?? '');
$user_model = new User($conn);

if ($action === 'create') {
	$full_name = trim($data['full_name'] ?? '');
	$email = trim($data['email'] ?? '');
	$password = $data['password'] ?? '';
	$role = trim($data['role'] ?? '');
	$phone = trim($data['phone'] ?? '');
	$nic = trim($data['nic'] ?? '');
	$address = trim($data['address'] ?? '');
	$date_of_birth = trim($data['date_of_birth'] ?? '1990-01-01');
	$gender = trim($data['gender'] ?? 'other');
	$specialisation = trim($data['specialisation'] ?? '');
	$working_days = trim($data['working_days'] ?? 'Mon,Tue,Wed,Thu,Fri');
	$working_time = trim($data['working_time'] ?? '');

	if ($full_name === '' || $email === '' || $password === '' || $role === '' || $phone === '' || $nic === '' || $address === '') {
		respond_json(["success" => false, "error" => "Required fields are missing"], 400);
	}

	if (!in_array($role, ['doctor', 'receptionist'], true)) {
		respond_json(["success" => false, "error" => "Invalid role"], 400);
	}

	if ($role === 'doctor' && $specialisation === '') {
		respond_json(["success" => false, "error" => "Doctor specialisation is required"], 400);
	}

	// Password complexity check
	if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password) || !preg_match('/[!@#\$%\^&\*\(\)\-_=+\[\]{};:\'"\\|,.<>\/?]/', $password)) {
		respond_json(["success" => false, "error" => "Password does not meet complexity requirements. It must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols."], 400);
	}

	// Phone number check
	if (!preg_match('/^07\d{8}$/', $phone)) {
		respond_json(["success" => false, "error" => "Phone number must start with 07 and contain 10 digits."], 400);
	}

	// NIC validation
	if (!preg_match('/^(?:\d{9}[VvXx]|\d{12})$/', $nic)) {
		respond_json(["success" => false, "error" => "Invalid Sri Lankan NIC format."], 400);
	}

	mysqli_begin_transaction($conn);

	$user_id = $user_model->register($full_name, $nic, $date_of_birth, $gender, $phone, $email, $password, $role);

	if ($user_id === false) {
		mysqli_rollback($conn);
		$err_msg = 'Could not create user';
		if ($user_model->last_error === 'NIC already exists') {
			$err_msg = 'NIC already registered';
		} elseif ($user_model->last_error === 'Email already exists') {
			$err_msg = 'Email already registered';
		} else {
			$err_msg = $user_model->last_error ?: 'Could not create user';
		}
		respond_json(["success" => false, "error" => $err_msg], 400);
	}

	if ($role === 'doctor') {
		$stmt = mysqli_prepare($conn, "UPDATE doctors SET specialisation = ?, working_days = ?, working_time = ?, address = ?, bio = ? WHERE id = ?");
		$bio = trim($data['bio'] ?? '');
		mysqli_stmt_bind_param($stmt, "sssssi", $specialisation, $working_days, $working_time, $address, $bio, $user_id);

		if (!mysqli_stmt_execute($stmt)) {
			mysqli_stmt_close($stmt);
			mysqli_rollback($conn);
			respond_json(["success" => false, "error" => "Could not update doctor profile"], 400);
		}

		mysqli_stmt_close($stmt);
	} else if ($role === 'receptionist') {
		$stmt = mysqli_prepare($conn, "UPDATE receptionist SET address = ? WHERE id = ?");
		mysqli_stmt_bind_param($stmt, "si", $address, $user_id);

		if (!mysqli_stmt_execute($stmt)) {
			mysqli_stmt_close($stmt);
			mysqli_rollback($conn);
			respond_json(["success" => false, "error" => "Could not update receptionist profile"], 400);
		}

		mysqli_stmt_close($stmt);
	}

	mysqli_commit($conn);
	log_activity($conn, (int) $_SESSION['user_id'], 'admin_create_user', 'Created ' . $role . ' account for ' . $full_name);

	respond_json(["success" => true, "message" => "User created", "user_id" => $user_id]);
}

if ($action === 'toggle_status') {
	$target_user_id = isset($data['user_id']) ? (int) $data['user_id'] : 0;
	$target_role = isset($data['role']) ? trim($data['role']) : '';

	if ($target_user_id <= 0) {
		respond_json(["success" => false, "error" => "user_id is required"], 400);
	}

	if ($target_role !== '') {
		$target = $user_model->get_by_id($target_user_id, $target_role);
	} else {
		$target = $user_model->get_by_id($target_user_id);
	}

	if ($target === false || !in_array($target['role'], ['doctor', 'receptionist'], true)) {
		respond_json(["success" => false, "error" => "User not found"], 404);
	}

	$new_status = $target['status'] === 'active' ? 'inactive' : 'active';
	
	if ($new_status === 'inactive') {
		$status_updated = $user_model->deactivate($target_user_id, $target['role']);
	} else {
		$status_updated = $user_model->activate($target_user_id, $target['role']);
	}

	if (!$status_updated) {
		respond_json(["success" => false, "error" => "Could not update status"], 400);
	}

	log_activity($conn, (int) $_SESSION['user_id'], 'admin_toggle_user_status', 'Toggled status for user #' . $target_user_id . ' (' . $target['role'] . ') to ' . $new_status);

	respond_json(["success" => true, "message" => "User status updated", "status" => $new_status]);
}

respond_json(["success" => false, "error" => "Invalid action"], 400);