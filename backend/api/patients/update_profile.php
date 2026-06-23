<?php
// This endpoint updates the logged-in patient's profile and medical details.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'patient') {
	respond_json(["success" => false, "error" => "Access denied. Only patients can access this endpoint."], 403);
}

require_once __DIR__ . '/../../models/User.php';

$data = get_request_body();
$user_id = (int) $_SESSION['user_id'];

$full_name = trim($data['full_name'] ?? '');
$phone = trim($data['phone'] ?? '');
$email = trim($data['email'] ?? '');
$gender = trim($data['gender'] ?? '');
$date_of_birth = trim($data['date_of_birth'] ?? '');

$medical_history = isset($data['medical_history']) ? trim($data['medical_history']) : null;
$allergies = isset($data['allergies']) ? trim($data['allergies']) : null;
$blood_group = isset($data['blood_group']) ? trim($data['blood_group']) : null;
$emergency_contact = isset($data['emergency_contact']) ? trim($data['emergency_contact']) : null;

if ($full_name === '' || $phone === '' || $gender === '' || $date_of_birth === '') {
	respond_json(["success" => false, "error" => "Full name, phone, gender, and date of birth are required."], 400);
}

if (!preg_match('/^07\d{8}$/', $phone)) {
	respond_json(["success" => false, "error" => "Phone number must start with 07 and contain 10 digits."], 400);
}

$user = new User($conn);
$updated = $user->update_patient_profile(
	$user_id,
	$full_name,
	$phone,
	$email ?: null,
	$gender,
	$date_of_birth,
	$medical_history,
	$allergies,
	$blood_group,
	$emergency_contact
);

if ($updated === false) {
	respond_json(["success" => false, "error" => $user->last_error ?: "Could not update profile."], 400);
}

respond_json(["success" => true, "message" => "Profile updated successfully!"]);
?>
