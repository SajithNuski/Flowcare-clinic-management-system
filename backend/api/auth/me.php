<?php
// This endpoint returns the currently logged-in user's profile data.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["error" => "Method not allowed"], 405);
}

if (!isset($_SESSION['user_id'])) {
	respond_json(["error" => "Not logged in"], 401);
}

require_once __DIR__ . '/../../models/User.php';

$user = new User($conn);
$current_user = $user->get_by_id((int) $_SESSION['user_id'], $_SESSION['role']);

if ($current_user === false) {
	respond_json(["error" => "Not logged in"], 401);
}

unset($current_user['password']);

respond_json([
	"success" => true,
	"user" => $current_user,
]);