<?php
// This endpoint lets any logged-in user change their password.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

if (!isset($_SESSION['user_id'], $_SESSION['role'])) {
	respond_json(["success" => false, "error" => "Not logged in"], 401);
}

require_once __DIR__ . '/../../models/User.php';

$data = get_request_body();
$user_id = (int) $_SESSION['user_id'];
$role = $_SESSION['role'];

$old_password = $data['old_password'] ?? '';
$new_password = $data['new_password'] ?? '';

if ($old_password === '' || $new_password === '') {
	respond_json(["success" => false, "error" => "Both current and new passwords are required."], 400);
}

// Enforce password rules on the new password
if (strlen($new_password) < 8 || !preg_match('/[A-Z]/', $new_password) || !preg_match('/[a-z]/', $new_password) || !preg_match('/[0-9]/', $new_password) || !preg_match('/[!@#\$%\^&\*\(\)\-_=+\[\]{};:\'"\\|,.<>\/?]/', $new_password)) {
	respond_json(["success" => false, "error" => "Password does not meet complexity requirements. It must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols."], 400);
}

if ($old_password === $new_password) {
	respond_json(["success" => false, "error" => "New password cannot be the same as current password."], 400);
}

$user = new User($conn);
$changed = $user->change_password($user_id, $old_password, $new_password, $role);

if ($changed === false) {
	respond_json(["success" => false, "error" => $user->last_error ?: "Failed to change password."], 400);
}

respond_json(["success" => true, "message" => "Password updated successfully!"]);
?>
