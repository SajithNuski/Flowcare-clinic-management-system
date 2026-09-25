<?php
require_once __DIR__ . '/jwt.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start(); // Start PHP session — must be called before any session use
}

/**
 * Resolves the authenticated user from either:
 * 1. HTTP Authorization Bearer token (tab-scoped, enables simultaneous multi-user logins)
 * 2. PHP Session $_SESSION (legacy/cookie fallback)
 */
function resolve_auth_context() {
	$auth_header = '';

	// Inspect Apache, Nginx, or standard PHP environment headers
	if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
		$auth_header = $_SERVER['HTTP_AUTHORIZATION'];
	} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
		$auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
	} elseif (function_exists('apache_request_headers')) {
		$headers = apache_request_headers();
		if (isset($headers['Authorization'])) {
			$auth_header = $headers['Authorization'];
		} elseif (isset($headers['authorization'])) {
			$auth_header = $headers['authorization'];
		}
	}

	if (!empty($auth_header)) {
		if (preg_match('/Bearer\s+(\S+)/i', $auth_header, $matches)) {
			$token = $matches[1];
			$payload = jwt_decode($token);
			if ($payload && isset($payload['uid'], $payload['role'])) {
				// Populate $_SESSION for this request lifecycle so all models continue to work
				$_SESSION['user_id'] = (int) $payload['uid'];
				$_SESSION['role'] = $payload['role'];
				$_SESSION['name'] = $payload['full_name'] ?? '';
				$_SESSION['full_name'] = $payload['full_name'] ?? '';
				$_SESSION['email'] = $payload['email'] ?? '';
				$_SESSION['is_token_auth'] = true;

				return [
					'id' => (int) $payload['uid'],
					'role' => $payload['role'],
					'full_name' => $payload['full_name'] ?? '',
					'email' => $payload['email'] ?? '',
				];
			}
		}

		// Client provided an explicit Authorization header that is invalid or expired
		$_SESSION = [];
		return null;
	}

	// Fallback to active PHP cookie session (legacy compatibility)
	if (isset($_SESSION['user_id'], $_SESSION['role'])) {
		return [
			'id' => (int) $_SESSION['user_id'],
			'role' => $_SESSION['role'],
			'full_name' => $_SESSION['full_name'] ?? ($_SESSION['name'] ?? ''),
			'email' => $_SESSION['email'] ?? '',
		];
	}

	return null;
}

// Automatically resolve authenticated user for this request thread
resolve_auth_context();

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
	$user = resolve_auth_context();
	if (!$user) {
		respond_json(["error" => "You must be logged in."], 401);
	}
	// Check if the user has the correct role
	if ($user['role'] !== $required_role) {
		respond_json(["error" => "Access denied. You do not have permission."], 403);
	}
}

// Allow multiple roles — e.g. require_any_role(['doctor', 'admin'])
function require_any_role($roles_array) {
	$user = resolve_auth_context();
	if (!$user) {
		respond_json(["error" => "You must be logged in."], 401);
	}
	if (!in_array($user['role'], $roles_array)) {
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