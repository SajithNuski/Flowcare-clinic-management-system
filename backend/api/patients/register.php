<?php
// This endpoint allows receptionist/admin to register a new basic patient record.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

// 1. Authenticate role
if (!isset($_SESSION['user_id'], $_SESSION['role']) || !in_array($_SESSION['role'], ['receptionist', 'admin'], true)) {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

$data = get_request_body();

$full_name = trim($data['full_name'] ?? '');
$nic = trim($data['nic'] ?? '');
$date_of_birth = trim($data['date_of_birth'] ?? '');
$gender = trim($data['gender'] ?? '');
$phone = trim($data['phone'] ?? '');

// 2. Validate input fields
if ($full_name === '' || $nic === '' || $date_of_birth === '' || $gender === '' || $phone === '') {
	respond_json(["success" => false, "error" => "All required fields must be filled."], 400);
}

// Validate NIC format
if (!preg_match('/^(?:\d{9}[VvXx]|\d{12})$/', $nic)) {
	respond_json(["success" => false, "error" => "Invalid Sri Lankan NIC format."], 400);
}

// Validate phone format
if (!preg_match('/^07\d{8}$/', $phone)) {
	respond_json(["success" => false, "error" => "Phone number must start with 07 and contain 10 digits."], 400);
}

// Validate date of birth not in the future
$dob_time = strtotime($date_of_birth);
if ($dob_time === false || $dob_time > time()) {
	respond_json(["success" => false, "error" => "Date of Birth cannot be in the future."], 400);
}

// 3. Check duplicate NIC in patients table
$stmt = mysqli_prepare($conn, "SELECT id, full_name, nic, email, phone, date_of_birth, gender, status, medical_history, allergies, blood_group, emergency_contact, created_at FROM patients WHERE nic = ? LIMIT 1");
mysqli_stmt_bind_param($stmt, "s", $nic);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$existing_patient = $result ? mysqli_fetch_assoc($result) : null;
mysqli_stmt_close($stmt);

if ($existing_patient) {
	// Cast ID
	$existing_patient['id'] = (int) $existing_patient['id'];
	respond_json([
		"success" => false,
		"exists" => true,
		"patient" => $existing_patient,
		"error" => "A patient with NIC {$nic} already exists in the system."
	]);
}

// Optional check: check other tables for conflict just to be clean, but if there's no patient record, we can create one.
$tables = ['admin', 'doctors', 'receptionist'];
foreach ($tables as $t) {
	$stmt = mysqli_prepare($conn, "SELECT id FROM $t WHERE nic = ? LIMIT 1");
	mysqli_stmt_bind_param($stmt, "s", $nic);
	mysqli_stmt_execute($stmt);
	$res = mysqli_stmt_get_result($stmt);
	$found = $res ? mysqli_fetch_assoc($res) : null;
	mysqli_stmt_close($stmt);
	if ($found) {
		respond_json(["success" => false, "error" => "This NIC is registered to a staff member."], 400);
	}
}

// 4. Create new patient record (email and password stay null)
$stmt = mysqli_prepare($conn, "INSERT INTO patients (full_name, nic, date_of_birth, gender, phone, email, password, status) VALUES (?, ?, ?, ?, ?, NULL, NULL, 'active')");
mysqli_stmt_bind_param($stmt, "sssss", $full_name, $nic, $date_of_birth, $gender, $phone);

if (!mysqli_stmt_execute($stmt)) {
	respond_json(["success" => false, "error" => "Registration failed: " . mysqli_error($conn)], 500);
}

$new_patient_id = mysqli_insert_id($conn);
mysqli_stmt_close($stmt);

// Fetch the newly created patient details to return
$stmt = mysqli_prepare($conn, "SELECT id, full_name, nic, email, phone, date_of_birth, gender, status, medical_history, allergies, blood_group, emergency_contact, created_at FROM patients WHERE id = ? LIMIT 1");
mysqli_stmt_bind_param($stmt, "i", $new_patient_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$new_patient = $result ? mysqli_fetch_assoc($result) : null;
mysqli_stmt_close($stmt);

if ($new_patient) {
	$new_patient['id'] = (int) $new_patient['id'];
}

respond_json([
	"success" => true,
	"patient" => $new_patient,
	"message" => "Patient registered successfully."
]);
?>
