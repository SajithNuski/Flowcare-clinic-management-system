<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

require_role('admin');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	$sql = "SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.appointment_time AS time_slot, a.visit_reason, a.notes, a.status, a.created_at, 
	               COALESCE(a.patient_name, p.full_name) AS patient_name, p.phone AS patient_phone, p.email AS patient_email, p.nic AS patient_nic,
	               d.full_name AS doctor_name, d.phone AS doctor_phone, d.specialisation AS doctor_specialisation
	        FROM appointments a
	        INNER JOIN patients p ON a.patient_id = p.id
	        INNER JOIN doctors d ON a.doctor_id = d.id
	        ORDER BY a.appointment_date DESC, a.appointment_time DESC";
	        
	$stmt = mysqli_prepare($conn, $sql);
	
	if (!$stmt) {
		respond_json(["success" => false, "error" => mysqli_error($conn)], 500);
	}
	
	mysqli_stmt_execute($stmt);
	$result = mysqli_stmt_get_result($stmt);
	$appointments = $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
	mysqli_stmt_close($stmt);

	respond_json(["success" => true, "appointments" => $appointments]);
}

respond_json(["success" => false, "error" => "Method not allowed"], 405);
?>
