<?php
// This endpoint returns comprehensive administrative report and analytics data.

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

// 1. Parse filter parameters
$preset = trim($_GET['preset'] ?? '');
if ($preset === '' && isset($_GET['date_from'], $_GET['date_to'])) {
	$preset = 'custom';
}
if ($preset === '') {
	$preset = 'this_month';
}
$doctor_id = isset($_GET['doctor_id']) ? (int)$_GET['doctor_id'] : 0;

$today = date('Y-m-d');
$date_from = $today;
$date_to = $today;

switch ($preset) {
	case 'today':
		$date_from = $today;
		$date_to = $today;
		break;
	case 'this_week':
		// Monday of this week to today/Sunday
		$date_from = date('Y-m-d', strtotime('monday this week'));
		$date_to = date('Y-m-d', strtotime('sunday this week'));
		break;
	case 'last_7_days':
		$date_from = date('Y-m-d', strtotime('-6 days'));
		$date_to = $today;
		break;
	case 'this_month':
		$date_from = date('Y-m-01');
		$date_to = date('Y-m-t');
		break;
	case 'last_30_days':
		$date_from = date('Y-m-d', strtotime('-30 days'));
		$date_to = $today;
		break;
	case 'this_year':
		$date_from = date('Y-01-01');
		$date_to = date('Y-12-31');
		break;
	case 'custom':
		$date_from = trim($_GET['date_from'] ?? $today);
		$date_to = trim($_GET['date_to'] ?? $today);
		break;
	default:
		$date_from = date('Y-m-01');
		$date_to = date('Y-m-t');
		break;
}

$from_obj = DateTime::createFromFormat('Y-m-d', $date_from);
$to_obj = DateTime::createFromFormat('Y-m-d', $date_to);
if (!$from_obj || $from_obj->format('Y-m-d') !== $date_from || !$to_obj || $to_obj->format('Y-m-d') !== $date_to) {
	respond_json(["error" => "Invalid date format"], 400);
}
if ($from_obj > $to_obj) {
	respond_json(["error" => "date_from cannot be after date_to"], 400);
}

// Prepared statement helpers for reports
function fetch_prepared_all($conn, $sql, $types = '', $params = []) {
	$stmt = mysqli_prepare($conn, $sql);
	if (!$stmt) return [];
	if ($types !== '' && !empty($params)) {
		mysqli_stmt_bind_param($stmt, $types, ...$params);
	}
	if (!mysqli_stmt_execute($stmt)) {
		mysqli_stmt_close($stmt);
		return [];
	}
	$result = mysqli_stmt_get_result($stmt);
	$rows = $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
	mysqli_stmt_close($stmt);
	return $rows;
}

function fetch_prepared_one($conn, $sql, $types = '', $params = []) {
	$rows = fetch_prepared_all($conn, $sql, $types, $params);
	return !empty($rows) ? $rows[0] : null;
}

$response = [
	'preset' => $preset,
	'date_from' => $date_from,
	'date_to' => $date_to,
	'doctor_id' => $doctor_id,
];

// -----------------------------------------------------------------------------
// SECTION 1: APPOINTMENT TRENDS & STATUS BREAKDOWN
// -----------------------------------------------------------------------------
$appt_summary_sql = "
	SELECT 
		COUNT(*) AS total_appointments,
		COALESCE(SUM(CASE WHEN status IN ('confirmed', 'booked') THEN 1 ELSE 0 END), 0) AS count_booked,
		COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS count_completed,
		COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS count_cancelled,
		COALESCE(SUM(CASE WHEN status IN ('no_show', 'missed') THEN 1 ELSE 0 END), 0) AS count_no_show
	FROM appointments
	WHERE appointment_date BETWEEN ? AND ? " . ($doctor_id > 0 ? " AND doctor_id = ? " : "");

$appt_params = [$date_from, $date_to];
$appt_types = "ss";
if ($doctor_id > 0) {
	$appt_params[] = $doctor_id;
	$appt_types .= "i";
}

$appt_summary = fetch_prepared_one($conn, $appt_summary_sql, $appt_types, $appt_params) ?: [
	'total_appointments' => 0, 'count_booked' => 0, 'count_completed' => 0, 'count_cancelled' => 0, 'count_no_show' => 0
];

$appt_trend_sql = "
	SELECT 
		appointment_date AS date,
		COALESCE(SUM(CASE WHEN status IN ('confirmed', 'booked') THEN 1 ELSE 0 END), 0) AS booked,
		COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
		COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled,
		COALESCE(SUM(CASE WHEN status IN ('no_show', 'missed') THEN 1 ELSE 0 END), 0) AS no_show,
		COUNT(*) AS total
	FROM appointments
	WHERE appointment_date BETWEEN ? AND ? " . ($doctor_id > 0 ? " AND doctor_id = ? " : "") . "
	GROUP BY appointment_date
	ORDER BY appointment_date ASC
";
$appt_trend_rows = fetch_prepared_all($conn, $appt_trend_sql, $appt_types, $appt_params);

// Fill date gap for trend line chart
$period_start = new DateTime($date_from);
$period_end = new DateTime($date_to);
$period_end->modify('+1 day');
$period = new DatePeriod($period_start, new DateInterval('P1D'), $period_end);

$trend_map = [];
foreach ($appt_trend_rows as $r) {
	$trend_map[$r['date']] = $r;
}

// Completed consultations per day from consultations table
$c_trend_rows = fetch_prepared_all($conn, "SELECT DATE(created_at) AS date, COUNT(*) AS count FROM consultations WHERE DATE(created_at) BETWEEN ? AND ? GROUP BY DATE(created_at)", "ss", [$date_from, $date_to]);
$c_trend_map = [];
foreach ($c_trend_rows as $row) {
	$c_trend_map[$row['date']] = (int)$row['count'];
}

// Completed queue per day
$q_trend_rows = fetch_prepared_all($conn, "SELECT date, COUNT(*) AS count FROM queue WHERE status = 'completed' AND date BETWEEN ? AND ? GROUP BY date", "ss", [$date_from, $date_to]);
$q_trend_map = [];
foreach ($q_trend_rows as $row) {
	$q_trend_map[$row['date']] = (int)$row['count'];
}

$appointment_trends = [];
foreach ($period as $day) {
	$d_str = $day->format('Y-m-d');
	$booked_count = (int)($trend_map[$d_str]['booked'] ?? 0);
	$appt_completed = (int)($trend_map[$d_str]['completed'] ?? 0);
	$cancelled_count = (int)($trend_map[$d_str]['cancelled'] ?? 0);
	$noshow_count = (int)($trend_map[$d_str]['no_show'] ?? 0);
	$appt_total = (int)($trend_map[$d_str]['total'] ?? 0);

	$consult_count = $c_trend_map[$d_str] ?? ($q_trend_map[$d_str] ?? $appt_completed);
	$total_completed = max($consult_count, $appt_completed);

	$appointment_trends[] = [
		'date' => $d_str,
		'booked' => $booked_count,
		'completed' => $total_completed,
		'cancelled' => $cancelled_count,
		'no_show' => $noshow_count,
		'total' => $appt_total > 0 ? $appt_total : $total_completed,
		'count' => $total_completed,
	];
}

$tot_appts = (int)$appt_summary['total_appointments'];
$comp_appts = (int)$appt_summary['count_completed'];
$canc_appts = (int)$appt_summary['count_cancelled'];

// Total consultations and walkins in period
$tot_c_row = fetch_prepared_one($conn, "SELECT COUNT(*) AS total FROM consultations WHERE DATE(created_at) BETWEEN ? AND ?", "ss", [$date_from, $date_to]);
$total_consultations = $tot_c_row ? (int)$tot_c_row['total'] : 0;
if ($total_consultations === 0) {
	$tot_q_row = fetch_prepared_one($conn, "SELECT COUNT(*) AS total FROM queue WHERE status = 'completed' AND date BETWEEN ? AND ?", "ss", [$date_from, $date_to]);
	$total_consultations = $tot_q_row ? (int)$tot_q_row['total'] : 0;
}
if ($total_consultations === 0) {
	$total_consultations = $comp_appts;
}

$walkin_row = fetch_prepared_one($conn, "SELECT COUNT(*) AS total FROM queue q LEFT JOIN payments p ON q.id = p.queue_id WHERE (p.appointment_id IS NULL OR p.appointment_id = 0) AND q.date BETWEEN ? AND ?", "ss", [$date_from, $date_to]);
$total_walkins = $walkin_row ? (int)$walkin_row['total'] : 0;

$response['total_consultations'] = $total_consultations;
$response['total_walkins'] = $total_walkins;
$response['daily_trend'] = $appointment_trends;

$response['appointment_stats'] = [
	'total' => $tot_appts,
	'booked' => (int)$appt_summary['count_booked'],
	'completed' => $comp_appts,
	'cancelled' => $canc_appts,
	'no_show' => (int)$appt_summary['count_no_show'],
	'completion_rate' => $tot_appts > 0 ? round(($comp_appts / $tot_appts) * 100, 1) : 0,
	'cancellation_rate' => $tot_appts > 0 ? round(($canc_appts / $tot_appts) * 100, 1) : 0,
	'daily_trend' => $appointment_trends,
];

// -----------------------------------------------------------------------------
// SECTION 2: REVENUE ANALYSIS
// -----------------------------------------------------------------------------
$pay_filter_sql = $doctor_id > 0 ? " AND p.doctor_id = ? " : "";
$pay_params = [$date_from, $date_to];
$pay_types = "ss";
if ($doctor_id > 0) {
	$pay_params[] = $doctor_id;
	$pay_types .= "i";
}

$rev_summary_sql = "
	SELECT 
		COALESCE(SUM(p.amount), 0) AS total_revenue,
		COUNT(*) AS total_transactions
	FROM payments p
	WHERE p.payment_date BETWEEN ? AND ? {$pay_filter_sql}
";
$rev_summary = fetch_prepared_one($conn, $rev_summary_sql, $pay_types, $pay_params) ?: ['total_revenue' => 0, 'total_transactions' => 0];

// Revenue today & this month summary
$rev_today_sql = "SELECT COALESCE(SUM(amount), 0) AS amount FROM payments p WHERE p.payment_date = ? " . ($doctor_id > 0 ? " AND p.doctor_id = ? " : "");
$today_params = [$today];
$today_types = "s";
if ($doctor_id > 0) {
	$today_params[] = $doctor_id;
	$today_types .= "i";
}
$today_row = fetch_prepared_one($conn, $rev_today_sql, $today_types, $today_params);
$rev_today = $today_row ? (float)$today_row['amount'] : 0;

$m_start = date('Y-m-01');
$m_end = date('Y-m-t');
$rev_month_sql = "SELECT COALESCE(SUM(amount), 0) AS amount FROM payments p WHERE p.payment_date BETWEEN ? AND ? " . ($doctor_id > 0 ? " AND p.doctor_id = ? " : "");
$month_params = [$m_start, $m_end];
$month_types = "ss";
if ($doctor_id > 0) {
	$month_params[] = $doctor_id;
	$month_types .= "i";
}
$month_row = fetch_prepared_one($conn, $rev_month_sql, $month_types, $month_params);
$rev_month = $month_row ? (float)$month_row['amount'] : 0;

// Revenue breakdown by payment method
$pay_method_sql = "
	SELECT 
		COALESCE(p.payment_method, 'cash') AS payment_method,
		COALESCE(SUM(p.amount), 0) AS total_amount,
		COUNT(*) AS count
	FROM payments p
	WHERE p.payment_date BETWEEN ? AND ? {$pay_filter_sql}
	GROUP BY p.payment_method
";
$by_payment_method = fetch_prepared_all($conn, $pay_method_sql, $pay_types, $pay_params);

// Revenue breakdown by doctor
$pay_doc_sql = "
	SELECT 
		d.id AS doctor_id,
		d.full_name AS doctor_name,
		d.specialisation,
		COALESCE(SUM(p.amount), 0) AS total_revenue,
		COUNT(p.id) AS transaction_count
	FROM doctors d
	LEFT JOIN payments p ON d.id = p.doctor_id AND p.payment_date BETWEEN ? AND ?
	" . ($doctor_id > 0 ? "WHERE d.id = ?" : "") . "
	GROUP BY d.id, d.full_name, d.specialisation
	ORDER BY total_revenue DESC
";
$by_doctor_revenue = fetch_prepared_all($conn, $pay_doc_sql, $pay_types, $pay_params);

// Revenue daily trend
$rev_trend_sql = "
	SELECT 
		p.payment_date AS date,
		COALESCE(SUM(p.amount), 0) AS total_revenue
	FROM payments p
	WHERE p.payment_date BETWEEN ? AND ? {$pay_filter_sql}
	GROUP BY p.payment_date
	ORDER BY p.payment_date ASC
";
$rev_trend_rows = fetch_prepared_all($conn, $rev_trend_sql, $pay_types, $pay_params);

$rev_map = [];
foreach ($rev_trend_rows as $r) {
	$rev_map[$r['date']] = (float)$r['total_revenue'];
}

$revenue_daily_trend = [];
foreach ($period as $day) {
	$d_str = $day->format('Y-m-d');
	$revenue_daily_trend[] = [
		'date' => $d_str,
		'revenue' => $rev_map[$d_str] ?? 0,
	];
}

$response['revenue_stats'] = [
	'total_revenue' => (float)$rev_summary['total_revenue'],
	'total_transactions' => (int)$rev_summary['total_transactions'],
	'revenue_today' => $rev_today,
	'revenue_this_month' => $rev_month,
	'by_payment_method' => $by_payment_method,
	'by_doctor' => $by_doctor_revenue,
	'daily_trend' => $revenue_daily_trend,
];

// -----------------------------------------------------------------------------
// SECTION 3: DOCTOR PERFORMANCE STATS
// -----------------------------------------------------------------------------
$doc_perf_sql = "
	SELECT 
		d.id AS doctor_id,
		d.full_name AS doctor_name,
		d.specialisation,
		COALESCE(SUM(CASE WHEN q.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_count,
		COALESCE(SUM(CASE WHEN q.status = 'no_show' THEN 1 ELSE 0 END), 0) AS no_show_count,
		COALESCE(SUM(CASE WHEN q.status = 'waiting' THEN 1 ELSE 0 END), 0) AS waiting_count,
		COALESCE(SUM(CASE WHEN q.status = 'in_consultation' THEN 1 ELSE 0 END), 0) AS in_consultation_count,
		COUNT(q.id) AS total_patients_seen,
		ROUND(AVG(CASE WHEN q.status = 'completed' AND q.check_in_time IS NOT NULL AND q.completed_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, q.check_in_time, q.completed_time) ELSE NULL END), 1) AS avg_duration_mins
	FROM doctors d
	LEFT JOIN queue q ON d.id = q.doctor_id AND q.date BETWEEN ? AND ?
	" . ($doctor_id > 0 ? "WHERE d.id = ?" : "") . "
	GROUP BY d.id, d.full_name, d.specialisation
	ORDER BY completed_count DESC
";
$doc_perf_params = [$date_from, $date_to];
$doc_perf_types = "ss";
if ($doctor_id > 0) {
	$doc_perf_params[] = $doctor_id;
	$doc_perf_types .= "i";
}
$doctor_performance = fetch_prepared_all($conn, $doc_perf_sql, $doc_perf_types, $doc_perf_params);

$response['doctor_performance'] = array_map(function($row) {
	return [
		'doctor_id' => (int)$row['doctor_id'],
		'doctor_name' => $row['doctor_name'],
		'specialisation' => $row['specialisation'],
		'completed_count' => (int)$row['completed_count'],
		'total_completed' => (int)$row['completed_count'],
		'no_show_count' => (int)$row['no_show_count'],
		'waiting_count' => (int)$row['waiting_count'],
		'in_consultation_count' => (int)$row['in_consultation_count'],
		'total_patients_seen' => (int)$row['total_patients_seen'],
		'avg_duration_mins' => $row['avg_duration_mins'] !== null ? (float)$row['avg_duration_mins'] : 0,
	];
}, $doctor_performance);

$response['per_doctor'] = $response['doctor_performance'];

// -----------------------------------------------------------------------------
// SECTION 4: PATIENT DEMOGRAPHICS
// -----------------------------------------------------------------------------
$gender_sql = "
	SELECT 
		CASE 
			WHEN LOWER(gender) IN ('male', 'm') THEN 'Male'
			WHEN LOWER(gender) IN ('female', 'f') THEN 'Female'
			ELSE 'Other / Unspecified'
		END AS gender_label,
		COUNT(*) AS total
	FROM patients
	GROUP BY gender_label
";
$gender_distribution = fetch_prepared_all($conn, $gender_sql);

$age_sql = "
	SELECT 
		CASE 
			WHEN date_of_birth IS NULL OR date_of_birth = '' OR date_of_birth = '0000-00-00' THEN 'Unknown'
			WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) <= 18 THEN '0-18 Years'
			WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 19 AND 35 THEN '19-35 Years'
			WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 36 AND 50 THEN '36-50 Years'
			WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 51 AND 65 THEN '51-65 Years'
			ELSE '65+ Years'
		END AS age_group,
		COUNT(*) AS total
	FROM patients
	GROUP BY age_group
	ORDER BY 
		CASE age_group 
			WHEN '0-18 Years' THEN 1 
			WHEN '19-35 Years' THEN 2 
			WHEN '36-50 Years' THEN 3 
			WHEN '51-65 Years' THEN 4 
			WHEN '65+ Years' THEN 5 
			ELSE 6 
		END ASC
";
$age_distribution = fetch_prepared_all($conn, $age_sql);

$patient_count_row = fetch_prepared_one($conn, "SELECT COUNT(*) AS total FROM patients");
$total_patients = $patient_count_row ? (int)$patient_count_row['total'] : 0;

$response['demographics'] = [
	'total_registered_patients' => $total_patients,
	'gender_distribution' => array_map(function($g) {
		return ['gender' => $g['gender_label'], 'total' => (int)$g['total']];
	}, $gender_distribution),
	'age_distribution' => array_map(function($a) {
		return ['age_group' => $a['age_group'], 'total' => (int)$a['total']];
	}, $age_distribution),
];

// -----------------------------------------------------------------------------
// SECTION 5: CLINIC INFORMATION & LIST OF DOCTORS
// -----------------------------------------------------------------------------
$settings_rows = fetch_prepared_all($conn, "SELECT setting_key, setting_value FROM clinic_settings");
$clinic_info = [
	'clinic_name' => 'FlowCare Medical Center',
	'clinic_phone' => '',
	'clinic_email' => '',
	'clinic_address' => '',
];
foreach ($settings_rows as $s) {
	if (isset($clinic_info[$s['setting_key']])) {
		$clinic_info[$s['setting_key']] = $s['setting_value'];
	}
}
$response['clinic_info'] = $clinic_info;

$response['doctors_list'] = fetch_prepared_all($conn, "SELECT id, full_name, specialisation FROM doctors ORDER BY full_name ASC");

respond_json(["success" => true, "reports" => $response]);
?>