<?php
// This endpoint returns system audit logs for administrative monitoring.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

require_role('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = isset($_GET['limit']) ? min(100, max(5, (int)$_GET['limit'])) : 25;
$offset = ($page - 1) * $limit;

$action_filter = trim($_GET['action'] ?? '');
$search = trim($_GET['search'] ?? '');
$date = trim($_GET['date'] ?? '');

$where_clauses = [];
$params = [];
$types = "";

if ($action_filter !== '') {
	$where_clauses[] = "a.action = ?";
	$params[] = $action_filter;
	$types .= "s";
}

if ($search !== '') {
	$where_clauses[] = "(a.description LIKE ? OR a.action LIKE ?)";
	$search_param = "%" . $search . "%";
	$params[] = $search_param;
	$params[] = $search_param;
	$types .= "ss";
}

if ($date !== '') {
	$where_clauses[] = "DATE(a.created_at) = ?";
	$params[] = $date;
	$types .= "s";
}

$where_sql = !empty($where_clauses) ? "WHERE " . implode(" AND ", $where_clauses) : "";

// Count total matching logs
$count_sql = "SELECT COUNT(*) AS total FROM activity_log a {$where_sql}";
$count_stmt = mysqli_prepare($conn, $count_sql);
if ($count_stmt) {
	if ($types !== '') {
		mysqli_stmt_bind_param($count_stmt, $types, ...$params);
	}
	mysqli_stmt_execute($count_stmt);
	$count_res = mysqli_stmt_get_result($count_stmt);
	$total_records = $count_res ? (int)mysqli_fetch_assoc($count_res)['total'] : 0;
	mysqli_stmt_close($count_stmt);
} else {
	$total_records = 0;
}

// Fetch page logs with user information
$log_sql = "
	SELECT 
		a.id,
		a.user_id,
		a.action,
		a.description,
		a.created_at,
		COALESCE(adm.full_name, doc.full_name, rec.full_name, pat.full_name, 'System User') AS user_name,
		CASE 
			WHEN adm.id IS NOT NULL THEN 'admin'
			WHEN doc.id IS NOT NULL THEN 'doctor'
			WHEN rec.id IS NOT NULL THEN 'receptionist'
			WHEN pat.id IS NOT NULL THEN 'patient'
			ELSE 'system'
		END AS user_role
	FROM activity_log a
	LEFT JOIN admin adm ON a.user_id = adm.id
	LEFT JOIN doctors doc ON a.user_id = doc.id
	LEFT JOIN receptionist rec ON a.user_id = rec.id
	LEFT JOIN patients pat ON a.user_id = pat.id
	{$where_sql}
	ORDER BY a.created_at DESC, a.id DESC
	LIMIT ? OFFSET ?
";

$log_stmt = mysqli_prepare($conn, $log_sql);
$logs = [];
if ($log_stmt) {
	$fetch_types = $types . "ii";
	$fetch_params = array_merge($params, [$limit, $offset]);
	mysqli_stmt_bind_param($log_stmt, $fetch_types, ...$fetch_params);
	mysqli_stmt_execute($log_stmt);
	$res = mysqli_stmt_get_result($log_stmt);
	$logs = $res ? mysqli_fetch_all($res, MYSQLI_ASSOC) : [];
	mysqli_stmt_close($log_stmt);
}

// Distinct actions for UI filter dropdown
$distinct_actions_res = mysqli_query($conn, "SELECT DISTINCT action FROM activity_log ORDER BY action ASC");
$distinct_actions = [];
if ($distinct_actions_res) {
	while ($row = mysqli_fetch_assoc($distinct_actions_res)) {
		if (!empty($row['action'])) {
			$distinct_actions[] = $row['action'];
		}
	}
}

respond_json([
	"success" => true,
	"logs" => $logs,
	"total" => $total_records,
	"page" => $page,
	"limit" => $limit,
	"pages" => $total_records > 0 ? (int)ceil($total_records / $limit) : 1,
	"available_actions" => $distinct_actions
]);
?>