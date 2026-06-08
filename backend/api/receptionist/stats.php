<?php
// This endpoint returns today's receptionist stats.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if (!isset($_SESSION['user_id'], $_SESSION['role']) || !in_array($_SESSION['role'], ['receptionist', 'admin'], true)) {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

$today = date('Y-m-d');

// 1. inQueue: waiting or in_consultation
$stmt = mysqli_prepare($conn, "SELECT COUNT(*) AS total FROM queue WHERE date = ? AND status IN ('waiting', 'in_consultation')");
mysqli_stmt_bind_param($stmt, "s", $today);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$inQueue = $result ? mysqli_stmt_get_result_row_val($result) : 0;
mysqli_stmt_close($stmt);

// Helper function to get row value since mysqli_fetch_assoc is standard
function get_count($conn, $sql, $date) {
	$stmt = mysqli_prepare($conn, $sql);
	mysqli_stmt_bind_param($stmt, "s", $date);
	mysqli_stmt_execute($stmt);
	$result = mysqli_stmt_get_result($stmt);
	$row = $result ? mysqli_fetch_assoc($result) : null;
	mysqli_stmt_close($stmt);
	return $row ? (int) $row['total'] : 0;
}

$inQueue = get_count($conn, "SELECT COUNT(*) AS total FROM queue WHERE date = ? AND status IN ('waiting', 'in_consultation')", $today);
$checkedInToday = get_count($conn, "SELECT COUNT(*) AS total FROM queue WHERE date = ?", $today);
$pendingArrival = get_count($conn, "SELECT COUNT(*) AS total FROM appointments WHERE appointment_date = ? AND status IN ('confirmed', 'rescheduled')", $today);
$noShowsToday = get_count($conn, "SELECT COUNT(*) AS total FROM appointments WHERE appointment_date = ? AND status = 'no_show'", $today);

respond_json([
	"success" => true,
	"stats" => [
		"inQueue" => $inQueue,
		"checkedInToday" => $checkedInToday,
		"pendingArrival" => $pendingArrival,
		"noShowsToday" => $noShowsToday
	]
]);
?>
