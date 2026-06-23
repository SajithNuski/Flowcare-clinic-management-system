<?php
// This endpoint retrieves patient info by NIC for receptionist check-in.

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

$query_val = trim($_GET['q'] ?? $_GET['nic'] ?? '');

if ($query_val === '') {
	respond_json(["success" => false, "error" => "Query is required"], 400);
}

$search_param = "%" . $query_val . "%";
$stmt = mysqli_prepare(
	$conn,
	"SELECT id, full_name, nic, email, phone, date_of_birth, gender FROM patients WHERE nic = ? OR full_name LIKE ? OR nic LIKE ? LIMIT 10"
);
mysqli_stmt_bind_param($stmt, "sss", $query_val, $search_param, $search_param);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$patients = $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
mysqli_stmt_close($stmt);

$mapped = [];
foreach ($patients as $p) {
	$mapped[] = [
		"id" => (int) $p['id'],
		"full_name" => $p['full_name'],
		"nic" => $p['nic'],
		"email" => $p['email'],
		"phone" => $p['phone'],
		"date_of_birth" => $p['date_of_birth'],
		"gender" => $p['gender']
	];
}

respond_json([
	"success" => true,
	"patient" => !empty($mapped) ? $mapped[0] : null,
	"patients" => $mapped
]);
?>