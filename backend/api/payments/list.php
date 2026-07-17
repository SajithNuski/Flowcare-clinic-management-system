<?php
// This endpoint returns payment records for receptionist and admin.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

if (!isset($_SESSION['user_id'], $_SESSION['role'])) {
	respond_json(["success" => false, "error" => "Not logged in"], 401);
}

if ($_SESSION['role'] !== 'receptionist' && $_SESSION['role'] !== 'admin') {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

require_once __DIR__ . '/../../models/Payment.php';

$payment = new Payment($conn);
$date = isset($_GET['date']) ? trim($_GET['date']) : '';

if ($date !== '') {
	$date_object = DateTime::createFromFormat('Y-m-d', $date);
	if (!$date_object || $date_object->format('Y-m-d') !== $date) {
		respond_json(["success" => false, "error" => "Invalid date format"], 400);
	}
	$payments = $payment->get_history($date);
} else {
	$payments = $payment->get_history();
}

respond_json(["success" => true, "payments" => $payments ?: []]);
?>
