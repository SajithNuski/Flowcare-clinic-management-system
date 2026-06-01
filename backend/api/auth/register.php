<?php
// This endpoint creates a new patient account for FlowCare.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

require_once __DIR__ . '/../../models/User.php';

$data = get_request_body();

// Debugging helpers: capture the raw request body and json error
$raw_body = file_get_contents('php://input');
$json_error = null;

// Try to decode here for logging
$decoded = json_decode($raw_body, true);
if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
	$json_error = json_last_error_msg();
}

// Gather request headers
$headers = function_exists('getallheaders') ? getallheaders() : [];

// Log detailed request info
$logPath = __DIR__ . '/../../logs/register_debug.log';
@file_put_contents($logPath, date('c') . "\nHEADERS:" . var_export($headers, true) . "\nCONTENT_LENGTH:" . ($_SERVER['CONTENT_LENGTH'] ?? 'n/a') . "\nRAW_BODY:" . var_export($raw_body, true) . "\nJSON_ERROR:" . var_export($json_error, true) . "\nDECODED:" . var_export($decoded, true) . "\n\n", FILE_APPEND);

$full_name = trim($data['full_name'] ?? '');
$nic = trim($data['nic'] ?? '');
$date_of_birth = trim($data['date_of_birth'] ?? '');
$gender = trim($data['gender'] ?? '');
$phone = trim($data['phone'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if ($full_name === '' || $nic === '' || $date_of_birth === '' || $gender === '' || $phone === '' || $password === '') {
	respond_json(["success" => false, "error" => "All required fields must be filled.", "debug" => ["raw_body" => $raw_body, "json_error" => $json_error, "_post" => $_POST]], 400);
}

// Enforce server-side password rules: min 8 chars, upper, lower, digit, special
$pwd = $password;
if (strlen($pwd) < 8 || !preg_match('/[A-Z]/', $pwd) || !preg_match('/[a-z]/', $pwd) || !preg_match('/[0-9]/', $pwd) || !preg_match('/[!@#\$%\^&\*\(\)\-_=+\[\]{};:\'"\\|,.<>\/?]/', $pwd)) {
	respond_json(["success" => false, "error" => "Password does not meet complexity requirements. It must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols."], 400);
}

if (!preg_match('/^07\d{8}$/', $phone)) {
	respond_json(["success" => false, "error" => "Phone number must start with 07 and contain 10 digits."], 400);
}

$nic_is_valid = preg_match('/^(?:\d{9}[VvXx]|\d{12})$/', $nic);

if (!$nic_is_valid) {
	respond_json(["success" => false, "error" => "Invalid Sri Lankan NIC format."], 400);
}

$user = new User($conn);
$user_id = $user->register($full_name, $nic, $date_of_birth, $gender, $phone, $email ?: null, $password, 'patient');

if ($user_id === false) {
	// Return the model's last_error to help debugging client-side issues
	if ($user->last_error === 'NIC already exists') {
		$response_error = 'NIC already registered';
	} elseif ($user->last_error === 'Email already exists') {
		$response_error = 'Email already registered';
	} elseif ($user->last_error === 'Password hashing failed') {
		$response_error = 'Unable to create account';
	} else {
		$response_error = 'Registration failed';
	}
	respond_json(["success" => false, "error" => $response_error, "detail" => $user->last_error], 400);
}

respond_json(["success" => true, "message" => "Account created. Please log in."]);