<?php
// This endpoint manages patients for the admin panel.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

require_role('admin');

$user_model = new User($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	$stmt = mysqli_prepare(
		$conn,
		"SELECT id, full_name, nic, date_of_birth, gender, phone, email, status, medical_history, allergies, blood_group, emergency_contact, created_at 
		 FROM patients
		 ORDER BY created_at DESC"
	);
	
	if (!$stmt) {
		respond_json(["success" => false, "error" => mysqli_error($conn)], 500);
	}
	
	mysqli_stmt_execute($stmt);
	$result = mysqli_stmt_get_result($stmt);
	$patients = $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
	mysqli_stmt_close($stmt);

	respond_json(["success" => true, "patients" => $patients]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	$data = get_request_body();
	$action = trim($data['action'] ?? '');

	if ($action === 'toggle_status') {
		$patient_id = isset($data['patient_id']) ? (int) $data['patient_id'] : 0;

		if ($patient_id <= 0) {
			respond_json(["success" => false, "error" => "patient_id is required"], 400);
		}

		$target = $user_model->get_by_id($patient_id, 'patient');

		if ($target === false) {
			respond_json(["success" => false, "error" => "Patient not found"], 404);
		}

		$new_status = $target['status'] === 'active' ? 'inactive' : 'active';
		
		if ($new_status === 'inactive') {
			$status_updated = $user_model->deactivate($patient_id, 'patient');
		} else {
			$status_updated = $user_model->activate($patient_id, 'patient');
		}

		if (!$status_updated) {
			respond_json(["success" => false, "error" => "Could not update status"], 400);
		}

		log_activity($conn, (int) $_SESSION['user_id'], 'admin_toggle_patient_status', 'Toggled status for patient #' . $patient_id . ' to ' . $new_status);

		respond_json(["success" => true, "message" => "Patient status updated", "status" => $new_status]);
	}

	respond_json(["success" => false, "error" => "Invalid action"], 400);
}

respond_json(["success" => false, "error" => "Method not allowed"], 405);
?>
