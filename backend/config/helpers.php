<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start(); // Start PHP session — must be called before any session use
}

// ============================================================
// respond_json()
// This is how ALL our API endpoints send data back to React
// We always return JSON — never HTML from API files
// ============================================================
function respond_json($data, $status_code = 200) {
	header('Content-Type: application/json'); // Tell browser this is JSON
	http_response_code($status_code);         // Set the HTTP status code
	echo json_encode($data);                  // Convert PHP array to JSON string
	exit();                                   // Stop any further output
}

// ============================================================
// get_request_body()
// React sends data as JSON in the request body (not as form data)
// This function reads and decodes that JSON
// ============================================================
function get_request_body() {
	// php://input is a special stream that reads the raw request body
	$raw = file_get_contents("php://input");
	// json_decode converts JSON string to PHP array (true = associative array)
	$data = json_decode($raw, true);
	// Accept either JSON bodies or classic form submissions
	if (is_array($data)) {
		return $data;
	}

	if (!empty($_POST)) {
		return $_POST;
	}

	// If decoding failed or body was empty, return empty array
	// Save debugging info for callers that want to inspect the raw body or JSON error
	$GLOBALS['last_raw_request_body'] = $raw;
	$GLOBALS['last_json_error'] = json_last_error_msg();

	return [];
}

// ============================================================
// require_role()
// Call this at the top of any endpoint that needs authentication
// Example: require_role('doctor') — only doctors can access
// ============================================================
function require_role($required_role) {
	// Check if a session exists (user is logged in)
	if (!isset($_SESSION['user_id'])) {
		respond_json(["error" => "You must be logged in."], 401);
	}
	// Check if the user has the correct role
	if ($_SESSION['role'] !== $required_role) {
		respond_json(["error" => "Access denied. You do not have permission."], 403);
	}
	// If we reach here, the user is logged in and has the correct role
}

// Allow multiple roles — e.g. require_any_role(['doctor', 'admin'])
function require_any_role($roles_array) {
	if (!isset($_SESSION['user_id'])) {
		respond_json(["error" => "You must be logged in."], 401);
	}
	if (!in_array($_SESSION['role'], $roles_array)) {
		respond_json(["error" => "Access denied."], 403);
	}
}

// ============================================================
// log_activity()
// Records every important action in the system
// Used to track who did what and when — visible in admin panel
// ============================================================
function log_activity($conn, $user_id, $action, $description) {
	// Use a prepared statement to safely insert — never build SQL with string concatenation
	// Prepared statements prevent SQL injection attacks
	$stmt = mysqli_prepare($conn,
		"INSERT INTO activity_log (user_id, action, description) VALUES (?, ?, ?)"
	);
	mysqli_stmt_bind_param($stmt, "iss", $user_id, $action, $description);
	mysqli_stmt_execute($stmt);
	mysqli_stmt_close($stmt);
}
?>