<?php
// This endpoint updates the logged-in patient's profile and medical details.
// Supports multipart/form-data to upload files and update profile details.

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

$user_id = (int) $_SESSION['user_id'];

// Check if request is JSON or multipart/form-data
$content_type = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($content_type, 'application/json') !== false) {
	$data = get_request_body();
} else {
	$data = $_POST;
}

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

// Retrieve current patient info to check for existing photo
$user = new User($conn);
$curr_patient = $user->get_by_id($user_id, 'patient');
$old_photo_url = $curr_patient ? $curr_patient['photo_url'] : null;

$photo_url = null;
$has_upload = isset($_FILES['photo']) && $_FILES['photo']['error'] !== UPLOAD_ERR_NO_FILE;

if ($has_upload) {
	$file = $_FILES['photo'];
	
	if ($file['error'] !== UPLOAD_ERR_OK) {
		respond_json(["success" => false, "error" => "Failed to upload image. Error code: " . $file['error']], 400);
	}
	
	// Max size: 2MB
	if ($file['size'] > 2 * 1024 * 1024) {
		respond_json(["success" => false, "error" => "Only PNG or JPG images are allowed. File exceeds 2MB limit."], 400);
	}
	
	// Server-side MIME validation
	$finfo = finfo_open(FILEINFO_MIME_TYPE);
	$mime_type = finfo_file($finfo, $file['tmp_name']);
	finfo_close($finfo);
	
	$allowed_types = [
		'image/png' => 'png',
		'image/jpeg' => 'jpg',
		'image/jpg' => 'jpg'
	];
	
	if (!array_key_exists($mime_type, $allowed_types)) {
		respond_json(["success" => false, "error" => "Only PNG or JPG images are allowed"], 400);
	}
	
	$extension = $allowed_types[$mime_type];
	
	$upload_dir = __DIR__ . '/../../../uploads/patients/';
	if (!file_exists($upload_dir)) {
		mkdir($upload_dir, 0755, true);
	}
	
	// Safe unique filename
	$filename = 'patient_' . $user_id . '_' . time() . '.' . $extension;
	$dest_path = $upload_dir . $filename;
	
	$resized = false;
	if (extension_loaded('gd')) {
		list($orig_width, $orig_height) = getimagesize($file['tmp_name']);
		$max_dim = 800;
		if ($orig_width > $max_dim || $orig_height > $max_dim) {
			$ratio = $orig_width / $orig_height;
			if ($ratio > 1) {
				$new_width = $max_dim;
				$new_height = round($max_dim / $ratio);
			} else {
				$new_height = $max_dim;
				$new_width = round($max_dim * $ratio);
			}
			
			if ($extension === 'png') {
				$src_img = imagecreatefrompng($file['tmp_name']);
			} else {
				$src_img = imagecreatefromjpeg($file['tmp_name']);
			}
			
			if ($src_img) {
				$dst_img = imagecreatetruecolor($new_width, $new_height);
				if ($extension === 'png') {
					imagealphablending($dst_img, false);
					imagesavealpha($dst_img, true);
					$transparent = imagecolorallocatealpha($dst_img, 255, 255, 255, 127);
					imagefilledrectangle($dst_img, 0, 0, $new_width, $new_height, $transparent);
				}
				
				imagecopyresampled($dst_img, $src_img, 0, 0, 0, 0, $new_width, $new_height, $orig_width, $orig_height);
				
				if ($extension === 'png') {
					$saved = imagepng($dst_img, $dest_path);
				} else {
					$saved = imagejpeg($dst_img, $dest_path, 85);
				}
				
				imagedestroy($src_img);
				imagedestroy($dst_img);
				
				if ($saved) {
					$resized = true;
				}
			}
		}
	}
	
	if (!$resized) {
		if (!move_uploaded_file($file['tmp_name'], $dest_path)) {
			respond_json(["success" => false, "error" => "Failed to save uploaded image"], 500);
		}
	}
	
	$photo_url = '/uploads/patients/' . $filename;
}

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
	$emergency_contact,
	$has_upload ? $photo_url : null
);

if ($updated === false) {
	if ($has_upload && file_exists($dest_path)) {
		@unlink($dest_path);
	}
	respond_json(["success" => false, "error" => $user->last_error ?: "Could not update profile."], 400);
}

// Clean up old image if a new one was successfully uploaded
if ($has_upload && $old_photo_url) {
	if (strpos($old_photo_url, '/uploads/patients/') === 0) {
		$old_filename = basename($old_photo_url);
		$old_file_path = __DIR__ . '/../../../uploads/patients/' . $old_filename;
		if (file_exists($old_file_path)) {
			@unlink($old_file_path);
		}
	}
}

// Update session name for instant header/sidebar refresh
$_SESSION['name'] = $full_name;

respond_json(["success" => true, "message" => "Profile updated successfully!"]);
?>
