<?php
// This file connects our PHP code to the MySQL database
// Every other PHP file will include this file to get the $conn variable

$host = "localhost";       // MySQL runs on localhost in XAMPP
$user = "root";            // Default XAMPP MySQL username
$password = "";            // Default XAMPP MySQL password is empty
$database = "flowcare";    // The database name we created

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