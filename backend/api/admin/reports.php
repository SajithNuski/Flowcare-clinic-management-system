<?php
// This endpoint returns administrative report data for charts and summary cards.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

require_role('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["error" => "Method not allowed"], 405);
}

$date_from = trim($_GET['date_from'] ?? date('Y-m-d'));
$date_to = trim($_GET['date_to'] ?? date('Y-m-d'));

$from_object = DateTime::createFromFormat('Y-m-d', $date_from);
$to_object = DateTime::createFromFormat('Y-m-d', $date_to);

if (!$from_object || $from_object->format('Y-m-d') !== $date_from || !$to_object || $to_object->format('Y-m-d') !== $date_to) {
	respond_json(["error" => "Invalid date range"], 400);
}

if ($from_object > $to_object) {
	respond_json(["error" => "date_from cannot be after date_to"], 400);
}

$reports = [];

$summary_stmt = mysqli_prepare(
	$conn,
	"SELECT COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS total_consultations, COALESCE(SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END), 0) AS total_no_shows FROM queue WHERE date BETWEEN ? AND ?"
);
mysqli_stmt_bind_param($summary_stmt, "ss", $date_from, $date_to);
mysqli_stmt_execute($summary_stmt);
$summary_result = mysqli_stmt_get_result($summary_stmt);
$summary = $summary_result ? mysqli_fetch_assoc($summary_result) : ['total_consultations' => 0, 'total_no_shows' => 0];
mysqli_stmt_close($summary_stmt);

$walkin_stmt = mysqli_prepare(
	$conn,
	"SELECT COUNT(*) AS total_walkins FROM queue q WHERE q.date BETWEEN ? AND ? AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = q.patient_id AND a.doctor_id = q.doctor_id AND a.appointment_date = q.date)"
);
mysqli_stmt_bind_param($walkin_stmt, "ss", $date_from, $date_to);
mysqli_stmt_execute($walkin_stmt);
$walkin_result = mysqli_stmt_get_result($walkin_stmt);
$walkins = $walkin_result ? mysqli_fetch_assoc($walkin_result) : ['total_walkins' => 0];
mysqli_stmt_close($walkin_stmt);

$avg_wait_stmt = mysqli_prepare(
	$conn,
	"SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, check_in_time, completed_time)), 2) AS avg_wait_time FROM queue WHERE date BETWEEN ? AND ? AND status = 'completed' AND completed_time IS NOT NULL"
);
mysqli_stmt_bind_param($avg_wait_stmt, "ss", $date_from, $date_to);
mysqli_stmt_execute($avg_wait_stmt);
$avg_wait_result = mysqli_stmt_get_result($avg_wait_stmt);
$avg_wait = $avg_wait_result ? mysqli_fetch_assoc($avg_wait_result) : ['avg_wait_time' => null];
mysqli_stmt_close($avg_wait_stmt);

$doctor_stmt = mysqli_prepare(
	$conn,
	"SELECT q.doctor_id, du.full_name AS doctor_name, COUNT(*) AS total_completed, COALESCE(AVG(TIMESTAMPDIFF(MINUTE, q.check_in_time, q.completed_time)), 0) AS avg_wait_time FROM queue q INNER JOIN doctors d ON q.doctor_id = d.id INNER JOIN users du ON d.user_id = du.id WHERE q.date BETWEEN ? AND ? AND q.status = 'completed' GROUP BY q.doctor_id, du.full_name ORDER BY du.full_name ASC"
);
mysqli_stmt_bind_param($doctor_stmt, "ss", $date_from, $date_to);
mysqli_stmt_execute($doctor_stmt);
$doctor_result = mysqli_stmt_get_result($doctor_stmt);
$per_doctor = $doctor_result ? mysqli_fetch_all($doctor_result, MYSQLI_ASSOC) : [];
mysqli_stmt_close($doctor_stmt);

$trend_stmt = mysqli_prepare(
	$conn,
	"SELECT date, COUNT(*) AS total FROM queue WHERE date BETWEEN ? AND ? AND status = 'completed' GROUP BY date ORDER BY date ASC"
);
mysqli_stmt_bind_param($trend_stmt, "ss", $date_from, $date_to);
mysqli_stmt_execute($trend_stmt);
$trend_result = mysqli_stmt_get_result($trend_stmt);
$trend_rows = $trend_result ? mysqli_fetch_all($trend_result, MYSQLI_ASSOC) : [];
mysqli_stmt_close($trend_stmt);
	$trend_map = [];
foreach ($trend_rows as $row) {
	$trend_map[$row['date']] = (int) $row['total'];
}

$daily_trend = [];
$period_start = new DateTime($date_from);
$period_end = new DateTime($date_to);
$period_end->modify('+1 day');
$period = new DatePeriod($period_start, new DateInterval('P1D'), $period_end);
foreach ($period as $day) {
	$day_string = $day->format('Y-m-d');
	$daily_trend[] = [
		'date' => $day_string,
		'count' => $trend_map[$day_string] ?? 0,
	];
}

$reports['date_from'] = $date_from;
$reports['date_to'] = $date_to;
$reports['total_consultations'] = (int) $summary['total_consultations'];
$reports['total_no_shows'] = (int) $summary['total_no_shows'];
$reports['total_walkins'] = (int) $walkins['total_walkins'];
$reports['avg_wait_time'] = $avg_wait['avg_wait_time'] !== null ? (float) $avg_wait['avg_wait_time'] : null;
$reports['per_doctor'] = $per_doctor;
$reports['daily_trend'] = $daily_trend;

respond_json($reports);