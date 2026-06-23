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
	"SELECT d.id AS doctor_id, d.id AS user_id, d.full_name, d.specialisation, d.working_days, d.bio FROM doctors d WHERE d.status = 'active' ORDER BY d.full_name ASC"
);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$doctors = $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
mysqli_stmt_close($stmt);

respond_json($doctors);