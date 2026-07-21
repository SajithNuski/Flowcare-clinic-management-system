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
$preset = trim($_GET['preset'] ?? 'this_month');
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

$response = [
	'preset' => $preset,
	'date_from' => $date_from,
	'date_to' => $date_to,
	'doctor_id' => $doctor_id,
];

// Helper to get doctor filter clause
$doc_clause_appt = $doctor_id > 0 ? " AND doctor_id = $doctor_id " : "";
$doc_clause_pay  = $doctor_id > 0 ? " AND p.doctor_id = $doctor_id " : "";
$doc_clause_q    = $doctor_id > 0 ? " AND q.doctor_id = $doctor_id " : "";

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
	WHERE appointment_date BETWEEN '$date_from' AND '$date_to' {$doc_clause_appt}
";
$res = mysqli_query($conn, $appt_summary_sql);
$appt_summary = $res ? mysqli_fetch_assoc($res) : [
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
	WHERE appointment_date BETWEEN '$date_from' AND '$date_to' {$doc_clause_appt}
	GROUP BY appointment_date
	ORDER BY appointment_date ASC
";
$res_trend = mysqli_query($conn, $appt_trend_sql);
$appt_trend_rows = $res_trend ? mysqli_fetch_all($res_trend, MYSQLI_ASSOC) : [];

// Fill date gap for trend line chart
$period_start = new DateTime($date_from);
$period_end = new DateTime($date_to);
$period_end->modify('+1 day');
$period = new DatePeriod($period_start, new DateInterval('P1D'), $period_end);

$trend_map = [];
foreach ($appt_trend_rows as $r) {
	$trend_map[$r['date']] = $r;
}

$appointment_trends = [];
foreach ($period as $day) {
	$d_str = $day->format('Y-m-d');
	if (isset($trend_map[$d_str])) {
		$appointment_trends[] = [
			'date' => $d_str,
			'booked' => (int)$trend_map[$d_str]['booked'],
			'completed' => (int)$trend_map[$d_str]['completed'],
			'cancelled' => (int)$trend_map[$d_str]['cancelled'],
			'no_show' => (int)$trend_map[$d_str]['no_show'],
			'total' => (int)$trend_map[$d_str]['total'],
		];
	} else {
		$appointment_trends[] = [
			'date' => $d_str,
			'booked' => 0,
			'completed' => 0,
			'cancelled' => 0,
			'no_show' => 0,
			'total' => 0,
		];
	}
}

$tot_appts = (int)$appt_summary['total_appointments'];
$comp_appts = (int)$appt_summary['count_completed'];
$canc_appts = (int)$appt_summary['count_cancelled'];

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
$rev_summary_sql = "
	SELECT 
		COALESCE(SUM(amount), 0) AS total_revenue,
		COUNT(*) AS total_transactions
	FROM payments p
	WHERE p.payment_date BETWEEN '$date_from' AND '$date_to' {$doc_clause_pay}
";
$res = mysqli_query($conn, $rev_summary_sql);
$rev_summary = $res ? mysqli_fetch_assoc($res) : ['total_revenue' => 0, 'total_transactions' => 0];

// Revenue today & this month summary
$rev_today_sql = "SELECT COALESCE(SUM(amount), 0) AS amount FROM payments p WHERE p.payment_date = '$today' {$doc_clause_pay}";
$res_today = mysqli_query($conn, $rev_today_sql);
$rev_today = $res_today ? (float)mysqli_fetch_assoc($res_today)['amount'] : 0;

$m_start = date('Y-m-01');
$m_end = date('Y-m-t');
$rev_month_sql = "SELECT COALESCE(SUM(amount), 0) AS amount FROM payments p WHERE p.payment_date BETWEEN '$m_start' AND '$m_end' {$doc_clause_pay}";
$res_month = mysqli_query($conn, $rev_month_sql);
$rev_month = $res_month ? (float)mysqli_fetch_assoc($res_month)['amount'] : 0;

// Revenue breakdown by payment method
$pay_method_sql = "
	SELECT 
		COALESCE(p.payment_method, 'cash') AS payment_method,
		COALESCE(SUM(p.amount), 0) AS total_amount,
		COUNT(*) AS count
	FROM payments p
	WHERE p.payment_date BETWEEN '$date_from' AND '$date_to' {$doc_clause_pay}
	GROUP BY p.payment_method
";
$res_method = mysqli_query($conn, $pay_method_sql);
$by_payment_method = $res_method ? mysqli_fetch_all($res_method, MYSQLI_ASSOC) : [];

// Revenue breakdown by doctor
$pay_doc_sql = "
	SELECT 
		d.id AS doctor_id,
		d.full_name AS doctor_name,
		d.specialisation,
		COALESCE(SUM(p.amount), 0) AS total_revenue,
		COUNT(p.id) AS transaction_count
	FROM doctors d
	LEFT JOIN payments p ON d.id = p.doctor_id AND p.payment_date BETWEEN '$date_from' AND '$date_to'
	" . ($doctor_id > 0 ? "WHERE d.id = $doctor_id" : "") . "
	GROUP BY d.id, d.full_name, d.specialisation
	ORDER BY total_revenue DESC
";
$res_doc = mysqli_query($conn, $pay_doc_sql);
$by_doctor_revenue = $res_doc ? mysqli_fetch_all($res_doc, MYSQLI_ASSOC) : [];

// Revenue daily trend
$rev_trend_sql = "
	SELECT 
		p.payment_date AS date,
		COALESCE(SUM(p.amount), 0) AS total_revenue
	FROM payments p
	WHERE p.payment_date BETWEEN '$date_from' AND '$date_to' {$doc_clause_pay}
	GROUP BY p.payment_date
	ORDER BY p.payment_date ASC
";
$res_rev_trend = mysqli_query($conn, $rev_trend_sql);
$rev_trend_rows = $res_rev_trend ? mysqli_fetch_all($res_rev_trend, MYSQLI_ASSOC) : [];

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
	LEFT JOIN queue q ON d.id = q.doctor_id AND q.date BETWEEN '$date_from' AND '$date_to'
	" . ($doctor_id > 0 ? "WHERE d.id = $doctor_id" : "") . "
	GROUP BY d.id, d.full_name, d.specialisation
	ORDER BY completed_count DESC
";
$res_perf = mysqli_query($conn, $doc_perf_sql);
$doctor_performance = $res_perf ? mysqli_fetch_all($res_perf, MYSQLI_ASSOC) : [];

$response['doctor_performance'] = array_map(function($row) {
	return [
		'doctor_id' => (int)$row['doctor_id'],
		'doctor_name' => $row['doctor_name'],
		'specialisation' => $row['specialisation'],
		'completed_count' => (int)$row['completed_count'],
		'no_show_count' => (int)$row['no_show_count'],
		'waiting_count' => (int)$row['waiting_count'],
		'in_consultation_count' => (int)$row['in_consultation_count'],
		'total_patients_seen' => (int)$row['total_patients_seen'],
		'avg_duration_mins' => $row['avg_duration_mins'] !== null ? (float)$row['avg_duration_mins'] : 0,
	];
}, $doctor_performance);

// -----------------------------------------------------------------------------
// SECTION 4: PATIENT DEMOGRAPHICS
// -----------------------------------------------------------------------------
// Gender distribution
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
$res_gender = mysqli_query($conn, $gender_sql);
$gender_distribution = $res_gender ? mysqli_fetch_all($res_gender, MYSQLI_ASSOC) : [];

// Age range distribution
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
$res_age = mysqli_query($conn, $age_sql);
$age_distribution = $res_age ? mysqli_fetch_all($res_age, MYSQLI_ASSOC) : [];

$patient_count_res = mysqli_query($conn, "SELECT COUNT(*) AS total FROM patients");
$total_patients = $patient_count_res ? (int)mysqli_fetch_assoc($patient_count_res)['total'] : 0;

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
$settings_res = mysqli_query($conn, "SELECT setting_key, setting_value FROM clinic_settings");
$settings_rows = $settings_res ? mysqli_fetch_all($settings_res, MYSQLI_ASSOC) : [];
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

$docs_res = mysqli_query($conn, "SELECT id, full_name, specialisation FROM doctors ORDER BY full_name ASC");
$response['doctors_list'] = $docs_res ? mysqli_fetch_all($docs_res, MYSQLI_ASSOC) : [];

respond_json(["success" => true, "reports" => $response]);
?>