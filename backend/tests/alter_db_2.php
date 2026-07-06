<?php
require_once __DIR__ . '/../config/db.php';

// Check connection
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
echo "Connected successfully.\n";

// Alter appointments table to add patient_name
$sql = "ALTER TABLE appointments ADD patient_name VARCHAR(100) DEFAULT NULL AFTER patient_id";
if (mysqli_query($conn, $sql)) {
    echo "Table appointments altered successfully: added patient_name column.\n";
} else {
    echo "Error altering table: " . mysqli_error($conn) . "\n";
}
?>
