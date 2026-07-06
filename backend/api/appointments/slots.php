<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["error" => "Method not allowed"], 405);
}

$doctor_id = isset($_GET['doctor_id']) ? (int) $_GET['doctor_id'] : 0;
$date = trim($_GET['date'] ?? '');

if ($doctor_id <= 0 || $date === '') {
	respond_json(["error" => "doctor_id and date are required"], 400);
}

$date_object = DateTime::createFromFormat('Y-m-d', $date);
if (!$date_object || $date_object->format('Y-m-d') !== $date) {
	respond_json(["error" => "Invalid date"], 400);
}

$stmt = mysqli_prepare(
	$conn,
	"SELECT working_time FROM doctors WHERE id = ? LIMIT 1"
);
mysqli_stmt_bind_param($stmt, "i", $doctor_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$row = $result ? mysqli_fetch_assoc($result) : null;
mysqli_stmt_close($stmt);

$slots = [];
if ($row && !empty($row['working_time'])) {
	$slots[] = $row['working_time'];
} else {
	$slots[] = '09:00-17:00';
}

respond_json($slots);