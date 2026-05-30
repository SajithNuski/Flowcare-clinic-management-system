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
		"SELECT u.id, u.full_name, u.nic, u.date_of_birth, u.gender, u.phone, u.email, u.role, u.status, u.created_at, d.id AS doctor_id, d.specialisation, d.working_days, d.bio FROM users u LEFT JOIN doctors d ON u.id = d.user_id WHERE u.role IN ('doctor', 'receptionist') ORDER BY u.role ASC, u.full_name ASC"
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
	$date_of_birth = trim($data['date_of_birth'] ?? '1990-01-01');
	$gender = trim($data['gender'] ?? 'other');
	$specialisation = trim($data['specialisation'] ?? '');
	$working_days = trim($data['working_days'] ?? 'Mon,Tue,Wed,Thu,Fri');

	if ($full_name === '' || $email === '' || $password === '' || $role === '' || $phone === '') {
		respond_json(["success" => false, "error" => "Required fields are missing"], 400);
	}

	if (!in_array($role, ['doctor', 'receptionist'], true)) {
		respond_json(["success" => false, "error" => "Invalid role"], 400);
	}

	if ($nic === '') {
		$numeric = str_pad((string) (abs(crc32($email)) % 1000000000), 9, '0', STR_PAD_LEFT);
		$nic = $numeric . 'V';
	}

	if ($role === 'doctor' && $specialisation === '') {
		respond_json(["success" => false, "error" => "Doctor specialisation is required"], 400);
	}

	mysqli_begin_transaction($conn);

	$user_id = $user_model->register($full_name, $nic, $date_of_birth, $gender, $phone, $email, $password, $role);

	if ($user_id === false) {
		mysqli_rollback($conn);
		respond_json(["success" => false, "error" => $user_model->last_error === 'NIC already exists' ? 'NIC already registered' : 'Could not create user'], 400);
	}

	if ($role === 'doctor') {
		$stmt = mysqli_prepare($conn, "INSERT INTO doctors (user_id, specialisation, working_days, bio) VALUES (?, ?, ?, ?)");
		$bio = trim($data['bio'] ?? '');
		mysqli_stmt_bind_param($stmt, "isss", $user_id, $specialisation, $working_days, $bio);

		if (!mysqli_stmt_execute($stmt)) {
			mysqli_stmt_close($stmt);
			mysqli_rollback($conn);
			respond_json(["success" => false, "error" => "Could not create doctor profile"], 400);
		}

		mysqli_stmt_close($stmt);
	}

	mysqli_commit($conn);
	log_activity($conn, (int) $_SESSION['user_id'], 'admin_create_user', 'Created ' . $role . ' account for ' . $full_name);

	respond_json(["success" => true, "message" => "User created", "user_id" => $user_id]);
}

if ($action === 'toggle_status') {
	$target_user_id = isset($data['user_id']) ? (int) $data['user_id'] : 0;

	if ($target_user_id <= 0) {
		respond_json(["success" => false, "error" => "user_id is required"], 400);
	}

	if ($target_user_id === (int) $_SESSION['user_id']) {
		respond_json(["success" => false, "error" => "You cannot deactivate your own account"], 400);
	}

	$target = $user_model->get_by_id($target_user_id);

	if ($target === false || !in_array($target['role'], ['doctor', 'receptionist'], true)) {
		respond_json(["success" => false, "error" => "User not found"], 404);
	}

	$new_status = $target['status'] === 'active' ? 'inactive' : 'active';
	$stmt = mysqli_prepare($conn, "UPDATE users SET status = ? WHERE id = ?");
	mysqli_stmt_bind_param($stmt, "si", $new_status, $target_user_id);

	if (!mysqli_stmt_execute($stmt)) {
		mysqli_stmt_close($stmt);
		respond_json(["success" => false, "error" => "Could not update status"], 400);
	}

	mysqli_stmt_close($stmt);
	log_activity($conn, (int) $_SESSION['user_id'], 'admin_toggle_user_status', 'Toggled status for user #' . $target_user_id . ' to ' . $new_status);

	respond_json(["success" => true, "message" => "User status updated", "status" => $new_status]);
}

respond_json(["success" => false, "error" => "Invalid action"], 400);