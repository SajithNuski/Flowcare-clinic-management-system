<?php
// This endpoint returns and updates the clinic settings key-value pairs.

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/helpers.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	$stmt = mysqli_prepare($conn, "SELECT setting_key, setting_value FROM clinic_settings ORDER BY setting_key ASC");
	mysqli_stmt_execute($stmt);
	$result = mysqli_stmt_get_result($stmt);
	$rows = $result ? mysqli_fetch_all($result, MYSQLI_ASSOC) : [];
	mysqli_stmt_close($stmt);

	$settings = [];
	foreach ($rows as $row) {
		$settings[$row['setting_key']] = $row['setting_value'];
	}

	respond_json(["success" => true, "settings" => $settings]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(["success" => false, "error" => "Method not allowed"], 405);
}

require_role('admin');

$data = get_request_body();
$settings_input = isset($data['settings']) && is_array($data['settings']) ? $data['settings'] : $data;

unset($settings_input['action']);
unset($settings_input['settings']);

if (empty($settings_input)) {
	respond_json(["success" => false, "error" => "No settings provided"], 400);
}
	$updated = [];
foreach ($settings_input as $setting_key => $setting_value) {
	$stmt = mysqli_prepare(
		$conn,
		"INSERT INTO clinic_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
	);
	$setting_key = (string) $setting_key;
	$setting_value = is_array($setting_value) ? json_encode($setting_value) : (string) $setting_value;
	mysqli_stmt_bind_param($stmt, "ss", $setting_key, $setting_value);

	if (!mysqli_stmt_execute($stmt)) {
		mysqli_stmt_close($stmt);
		respond_json(["success" => false, "error" => "Could not update settings"], 400);
	}

	mysqli_stmt_close($stmt);
	$updated[$setting_key] = $setting_value;
	}

	log_activity($conn, (int) $_SESSION['user_id'], 'settings_update', 'Updated clinic settings');

	respond_json(["success" => true, "message" => "Settings updated", "settings" => $updated]);