<?php
require_once __DIR__ . '/../config/db.php';

// Check connection
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
echo "Connected successfully.\n";

// Alter appointments table
$sql = "ALTER TABLE appointments CHANGE time_slot appointment_time VARCHAR(100) NOT NULL";
if (mysqli_query($conn, $sql)) {
    echo "Table appointments altered successfully: renamed time_slot to appointment_time and changed type to VARCHAR(100).\n";
} else {
    echo "Error altering table: " . mysqli_error($conn) . "\n";
}
?>
