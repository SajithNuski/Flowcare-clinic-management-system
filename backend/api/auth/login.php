<?php
// This endpoint logs a user into FlowCare using their email or NIC.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

require_once __DIR__ . '/../../models/User.php';

$data = get_request_body();
$identifier = trim($data['identifier'] ?? '');
$password = $data['password'] ?? '';

if ($identifier === '' || $password === '') {
	respond_json(["success" => false, "error" => "Invalid credentials"], 401);
}

$user = new User($conn);
$logged_in_user = $user->login($identifier, $password);

if ($logged_in_user === false) {
	respond_json(["success" => false, "error" => "Invalid credentials"], 401);
}

$_SESSION['user_id'] = $logged_in_user['id'];
$_SESSION['role'] = $logged_in_user['role'];
$_SESSION['name'] = $logged_in_user['full_name'];

log_activity($conn, $logged_in_user['id'], 'login', 'User logged in');

respond_json([
	"success" => true,
	"user" => [
		"id" => $logged_in_user['id'],
		"full_name" => $logged_in_user['full_name'],
		"role" => $logged_in_user['role'],
		"email" => $logged_in_user['email'],
	],
]);