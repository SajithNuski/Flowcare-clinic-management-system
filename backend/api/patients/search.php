<?php
// This endpoint retrieves patient info by NIC, Name, or Phone for receptionist search and check-in.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if (!isset($_SESSION['user_id'], $_SESSION['role']) || !in_array($_SESSION['role'], ['receptionist', 'admin', 'doctor'], true)) {
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
	"SELECT id, full_name, nic, email, phone, date_of_birth, gender, photo_url, medical_history, allergies, blood_group, emergency_contact, status, created_at 
	 FROM patients 
	 WHERE nic = ? OR full_name LIKE ? OR nic LIKE ? OR phone LIKE ? 
	 ORDER BY (nic = ?) DESC, full_name ASC 
	 LIMIT 25"
);
mysqli_stmt_bind_param($stmt, "sssss", $query_val, $search_param, $search_param, $search_param, $query_val);
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
		"gender" => $p['gender'],
		"photo_url" => $p['photo_url'],
		"medical_history" => $p['medical_history'],
		"allergies" => $p['allergies'],
		"blood_group" => $p['blood_group'],
		"emergency_contact" => $p['emergency_contact'],
		"status" => $p['status'] ?? 'active',
		"created_at" => $p['created_at'],
	];
}

respond_json([
	"success" => true,
	"patient" => !empty($mapped) ? $mapped[0] : null,
	"patients" => $mapped
]);
?>