<?php
// This endpoint updates the profile settings of the logged-in doctor.
// Supports multipart/form-data to upload files and update profile details.

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/db.php';
require_once __DIR__ . '/../../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if (!isset($_SESSION['user_id'], $_SESSION['role']) || $_SESSION['role'] !== 'doctor') {
	respond_json(["success" => false, "error" => "Access denied"], 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

$user_id = (int) $_SESSION['user_id'];

// Retrieve POST variables
$full_name = trim($_POST['full_name'] ?? '');
$specialisation = trim($_POST['specialisation'] ?? '');
$qualification = trim($_POST['qualification'] ?? '');
$experience_years = isset($_POST['experience_years']) ? (int)$_POST['experience_years'] : 0;
$bio = trim($_POST['bio'] ?? '');

// Server-side validation
if (empty($full_name)) {
	respond_json(["success" => false, "error" => "Name is required"], 400);
}
if (strlen($full_name) < 3 || strlen($full_name) > 100) {
	respond_json(["success" => false, "error" => "Name must be between 3 and 100 characters"], 400);
}
if (strlen($specialisation) > 100) {
	respond_json(["success" => false, "error" => "Specialty must not exceed 100 characters"], 400);
}
if (strlen($qualification) > 255) {
	respond_json(["success" => false, "error" => "Qualifications must not exceed 255 characters"], 400);
}
if ($experience_years < 0 || $experience_years > 60) {
	respond_json(["success" => false, "error" => "Invalid years of experience"], 400);
}

// Check for existing photo
$curr_stmt = mysqli_prepare($conn, "SELECT photo_url FROM doctors WHERE id = ?");
mysqli_stmt_bind_param($curr_stmt, "i", $user_id);
mysqli_stmt_execute($curr_stmt);
$curr_res = mysqli_stmt_get_result($curr_stmt);
$curr_row = mysqli_fetch_assoc($curr_res);
mysqli_stmt_close($curr_stmt);

$old_photo_url = $curr_row ? $curr_row['photo_url'] : null;
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
	
	$upload_dir = __DIR__ . '/../../../../uploads/doctors/';
	if (!file_exists($upload_dir)) {
		mkdir($upload_dir, 0755, true);
	}
	
	// Safe unique filename
	$filename = 'doctor_' . $user_id . '_' . time() . '.' . $extension;
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
	
	$photo_url = '/uploads/doctors/' . $filename;
}

// Perform Database Update
if ($has_upload) {
	$update_stmt = mysqli_prepare($conn, "UPDATE doctors SET full_name = ?, specialisation = ?, qualification = ?, experience_years = ?, bio = ?, photo_url = ? WHERE id = ?");
	mysqli_stmt_bind_param($update_stmt, "sssissi", $full_name, $specialisation, $qualification, $experience_years, $bio, $photo_url, $user_id);
} else {
	$update_stmt = mysqli_prepare($conn, "UPDATE doctors SET full_name = ?, specialisation = ?, qualification = ?, experience_years = ?, bio = ? WHERE id = ?");
	mysqli_stmt_bind_param($update_stmt, "sssisi", $full_name, $specialisation, $qualification, $experience_years, $bio, $user_id);
}

if (!mysqli_stmt_execute($update_stmt)) {
	respond_json(["success" => false, "error" => "Failed to update profile details in database"], 500);
}
mysqli_stmt_close($update_stmt);

// Clean up old image if a new one was successfully uploaded
if ($has_upload && $old_photo_url) {
	if (strpos($old_photo_url, '/uploads/doctors/') === 0) {
		$old_filename = basename($old_photo_url);
		$old_file_path = __DIR__ . '/../../../../uploads/doctors/' . $old_filename;
		if (file_exists($old_file_path)) {
			@unlink($old_file_path);
		}
	}
}

// Update session name for instant header/sidebar refresh
$_SESSION['name'] = $full_name;

// Get updated doctor row to return
$ret_stmt = mysqli_prepare($conn, "SELECT id, full_name, specialisation, qualification, experience_years, bio, photo_url, email FROM doctors WHERE id = ?");
mysqli_stmt_bind_param($ret_stmt, "i", $user_id);
mysqli_stmt_execute($ret_stmt);
$ret_res = mysqli_stmt_get_result($ret_stmt);
$updated_doctor = mysqli_fetch_assoc($ret_res);
mysqli_stmt_close($ret_stmt);

respond_json([
	"success" => true,
	"message" => "Profile updated successfully",
	"doctor" => $updated_doctor
]);
?>
