<?php
// This endpoint returns all active doctors for the landing page and booking form.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["error" => "Method not allowed"], 405);
}

$stmt = mysqli_prepare(
	$conn,
	"SELECT u.id AS user_id, u.full_name, d.specialisation, d.working_days, d.bio FROM doctors d INNER JOIN users u ON d.user_id = u.id WHERE u.role = 'doctor' AND u.status = 'active' ORDER BY u.full_name ASC"
);
	mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$doctors = $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
mysqli_stmt_close($stmt);

respond_json($doctors);