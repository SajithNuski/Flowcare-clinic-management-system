<?php
// This endpoint manages clinic announcements for both public viewing and admin editing.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	$stmt = mysqli_prepare(
		$conn,
		"SELECT a.id, a.title, a.message, a.created_by, a.created_at, u.full_name AS created_by_name FROM announcements a INNER JOIN admin u ON a.created_by = u.id ORDER BY a.created_at DESC, a.id DESC"
	);
	mysqli_stmt_execute($stmt);
	$result = mysqli_stmt_get_result($stmt);
	$announcements = $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
	mysqli_stmt_close($stmt);

	respond_json(["success" => true, "announcements" => $announcements]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

require_role('admin');

$data = get_request_body();
$action = trim($data['action'] ?? '');

if ($action === 'create') {
	$title = trim($data['title'] ?? '');
	$message = trim($data['message'] ?? '');

	if ($title === '' || $message === '') {
		respond_json(["success" => false, "error" => "Title and message are required"], 400);
	}

	$stmt = mysqli_prepare($conn, "INSERT INTO announcements (title, message, created_by) VALUES (?, ?, ?)");
	mysqli_stmt_bind_param($stmt, "ssi", $title, $message, $_SESSION['user_id']);

	if (!mysqli_stmt_execute($stmt)) {
		mysqli_stmt_close($stmt);
		respond_json(["success" => false, "error" => "Could not create announcement"], 400);
	}

	$announcement_id = mysqli_insert_id($conn);
	mysqli_stmt_close($stmt);
	log_activity($conn, (int) $_SESSION['user_id'], 'announcement_create', 'Created announcement ' . $title);

	respond_json(["success" => true, "message" => "Announcement created", "announcement_id" => $announcement_id]);
}

if ($action === 'delete') {
	$announcement_id = isset($data['id']) ? (int) $data['id'] : 0;

	if ($announcement_id <= 0) {
		respond_json(["success" => false, "error" => "id is required"], 400);
	}

	$stmt = mysqli_prepare($conn, "DELETE FROM announcements WHERE id = ?");
	mysqli_stmt_bind_param($stmt, "i", $announcement_id);

	if (!mysqli_stmt_execute($stmt)) {
		mysqli_stmt_close($stmt);
		respond_json(["success" => false, "error" => "Could not delete announcement"], 400);
	}

	mysqli_stmt_close($stmt);
	log_activity($conn, (int) $_SESSION['user_id'], 'announcement_delete', 'Deleted announcement #' . $announcement_id);

	respond_json(["success" => true, "message" => "Announcement deleted"]);
}

respond_json(["success" => false, "error" => "Invalid action"], 400);