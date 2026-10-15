<?php
// This file connects our PHP code to the MySQL database
// Every other PHP file will include this file to get the $conn variable

// Set PHP's timezone to match the clinic's local time (Sri Lanka). Without
// this, PHP defaults to UTC on most XAMPP installs, which throws off every
// "today"/"current time" comparison used across the backend (e.g. hiding
// already-passed booking slots, restricting check-in to the appointment date).
date_default_timezone_set('Asia/Colombo');

// Detect environment: Check if running on InfinityFree production or local development
$http_host = $_SERVER['HTTP_HOST'] ?? '';
$is_production = (strpos($http_host, 'great-site.net') !== false) 
    || (strpos($http_host, 'infinityfree') !== false)
    || (getenv('FLOWCARE_ENV') === 'production');

if ($is_production) {
    // InfinityFree Cloud Hosting MySQL Configuration
    $host = getenv('DB_HOST') ?: "sql205.infinityfree.com";
    $user = getenv('DB_USER') ?: "if0_43183686";
    $password = getenv('DB_PASS') ?: "xbVVMKYgwc";
    $database = getenv('DB_NAME') ?: "if0_43183686_flowcare";
} else {
    // Local Development (XAMPP default)
    $host = getenv('DB_HOST') ?: "127.0.0.1";
    $user = getenv('DB_USER') ?: "root";
    $password = getenv('DB_PASS') ?: "";
    $database = getenv('DB_NAME') ?: "flowcare";
}

// mysqli_connect() tries to open a connection to MySQL
$conn = mysqli_connect($host, $user, $password, $database);

// If connection failed, $conn will be false
if (!$conn) {
	// Send error as JSON and stop — never show raw MySQL errors to users
	header('Content-Type: application/json');
	http_response_code(500);
	echo json_encode(["error" => "Database connection failed. Check XAMPP is running."]);
	exit(); // Stop all further PHP execution
}

// Set character encoding to UTF-8 to support Sinhala names and special characters
mysqli_set_charset($conn, "utf8mb4");
?>