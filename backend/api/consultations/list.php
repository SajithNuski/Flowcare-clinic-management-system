<?php
// This endpoint returns consultations for the current user (patient or doctor).

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

require_once __DIR__ . '/../../models/Consultation.php';

$consultation = new Consultation($conn);
$role = $_SESSION['role'];
$user_id = (int)$_SESSION['user_id'];

if ($role === 'patient') {
	$list = $consultation->get_by_patient($user_id);
	respond_json(["success" => true, "consultations" => $list ?: []]);
}

if ($role === 'doctor') {
	if (isset($_GET['patient_id']) && (int)$_GET['patient_id'] > 0) {
		$p_id = (int)$_GET['patient_id'];
		$list = $consultation->get_by_patient($p_id);
		respond_json(["success" => true, "consultations" => $list ?: []]);
	}
	$date = isset($_GET['date']) ? trim($_GET['date']) : null;
	if ($date !== null && $date !== '') {
		$date_object = DateTime::createFromFormat('Y-m-d', $date);
		if (!$date_object || $date_object->format('Y-m-d') !== $date) {
			respond_json(["success" => false, "error" => "Invalid date format"], 400);
		}
	} else {
		$date = null;
	}
	$list = $consultation->get_by_doctor($user_id, $date);
	respond_json(["success" => true, "consultations" => $list ?: []]);
}

respond_json(["success" => false, "error" => "Access denied"], 403);
?>