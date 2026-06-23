<?php
// This endpoint returns today's doctor dashboard stats, live queue, and recent consultations.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if (!isset($_SESSION['user_id'], $_SESSION['role']) || $_SESSION['role'] !== 'doctor') {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

$today = date('Y-m-d');
$user_id = (int) $_SESSION['user_id'];

// 1. Get doctor details and user details (name)
$doc_stmt = mysqli_prepare($conn, "SELECT d.id, d.specialisation, d.bio, d.full_name FROM doctors d WHERE d.id = ? LIMIT 1");
mysqli_stmt_bind_param($doc_stmt, "i", $user_id);
mysqli_stmt_execute($doc_stmt);
$doc_result = mysqli_stmt_get_result($doc_stmt);
$doc_row = $doc_result ? mysqli_fetch_assoc($doc_result) : false;
mysqli_stmt_close($doc_stmt);

if (!$doc_row) {
	respond_json(["success" => false, "error" => "Doctor record not found"], 404);
}
$doctor_id = (int) $doc_row['id'];
$specialisation = $doc_row['specialisation'];
$full_name = $doc_row['full_name'];

// 2. Total unique patients seen by this doctor
$pt_stmt = mysqli_prepare($conn, "SELECT COUNT(DISTINCT patient_id) AS total FROM consultations WHERE doctor_id = ?");
mysqli_stmt_bind_param($pt_stmt, "i", $user_id);
mysqli_stmt_execute($pt_stmt);
$pt_result = mysqli_stmt_get_result($pt_stmt);
$total_patients = $pt_result ? (int) mysqli_fetch_assoc($pt_result)['total'] : 0;
mysqli_stmt_close($pt_stmt);

// 3. Appointments today (and how many are completed)
$app_stmt = mysqli_prepare($conn, "SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed FROM appointments WHERE doctor_id = ? AND appointment_date = ?");
mysqli_stmt_bind_param($app_stmt, "is", $doctor_id, $today);
mysqli_stmt_execute($app_stmt);
$app_result = mysqli_stmt_get_result($app_stmt);
$app_row = $app_result ? mysqli_fetch_assoc($app_result) : ['total' => 0, 'completed' => 0];
mysqli_stmt_close($app_stmt);

$appointments_today = (int) $app_row['total'];
$completed_today = (int) $app_row['completed'];

// 4. Live Queue (waiting or in_consultation)
// Note: we fetch BOTH 'waiting' and 'in_consultation' patients so the doctor can interact with them.
$q_stmt = mysqli_prepare($conn, "SELECT q.id AS queue_id, q.patient_id, q.doctor_id, q.queue_number, q.date, q.status, q.check_in_time, u.full_name AS patient_name, u.phone AS patient_phone FROM queue q INNER JOIN patients u ON q.patient_id = u.id WHERE q.doctor_id = ? AND q.date = ? AND q.status IN ('waiting', 'in_consultation') ORDER BY CASE WHEN q.status = 'in_consultation' THEN 0 ELSE 1 END, q.queue_number ASC");
mysqli_stmt_bind_param($q_stmt, "is", $doctor_id, $today);
mysqli_stmt_execute($q_stmt);
$q_result = mysqli_stmt_get_result($q_stmt);
$live_queue = $q_result ? mysqli_fetch_all($q_result, MYSQLI_ASSOC) : [];
mysqli_stmt_close($q_stmt);

// 5. Recent Consultations
require_once __DIR__ . '/../../models/Consultation.php';
$consultation_model = new Consultation($conn);
$recent_consultations = $consultation_model->get_by_doctor($user_id);
if (is_array($recent_consultations)) {
	$recent_consultations = array_slice($recent_consultations, 0, 5);
}

// 6. Clinic insights
$clinic_capacity = 20;
$clinic_load = $appointments_today > 0 ? min(100, round(($appointments_today / $clinic_capacity) * 100)) : 0;
$patient_satisfaction = 4.8;

respond_json([
	"success" => true,
	"doctor" => [
		"id" => $doctor_id,
		"user_id" => $user_id,
		"full_name" => $full_name,
		"specialisation" => $specialisation,
		"bio" => $doc_row['bio']
	],
	"stats" => [
		"total_patients" => $total_patients,
		"appointments_today" => $appointments_today,
		"completed_today" => $completed_today
	],
	"queue" => $live_queue,
	"recent_consultations" => $recent_consultations ?: [],
	"clinic_insights" => [
		"clinic_load" => $clinic_load,
		"patient_satisfaction" => $patient_satisfaction
	]
]);
?>