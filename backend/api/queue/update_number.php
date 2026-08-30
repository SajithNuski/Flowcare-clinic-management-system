<?php
// This endpoint updates a patient's queue number in the database.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

if (!isset($_SESSION['user_id'], $_SESSION['role']) || !in_array($_SESSION['role'], ['receptionist', 'doctor', 'admin'])) {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

require_once __DIR__ . '/../../models/Queue.php';

$data = get_request_body();
$queue_id = isset($data['queue_id']) ? (int) $data['queue_id'] : 0;
$queue_number = isset($data['queue_number']) ? (int) $data['queue_number'] : 0;

if ($queue_id <= 0 || $queue_number <= 0) {
	respond_json(["success" => false, "error" => "Valid queue_id and queue_number are required"], 400);
}

$queue = new Queue($conn);
$updated = $queue->update_queue_number($queue_id, $queue_number);

if (!$updated) {
	respond_json(["success" => false, "error" => "Failed to update queue number"], 400);
}

log_activity($conn, (int) $_SESSION['user_id'], 'update_queue_number', "Updated queue entry ID {$queue_id} to Queue #{$queue_number}");

respond_json([
	"success" => true,
	"message" => "Queue number updated successfully",
	"queue_id" => $queue_id,
	"queue_number" => $queue_number
]);
?>
