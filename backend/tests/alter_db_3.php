<?php
require_once __DIR__ . '/../config/db.php';

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
echo "Connected successfully.\n";

$sql = "ALTER TABLE appointments ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL";
if (mysqli_query($conn, $sql)) {
    echo "Table appointments altered successfully: added cancelled_at column.\n";
} else {
    echo "Error altering table: " . mysqli_error($conn) . "\n";
}
?>
