<?php
require_once __DIR__ . '/../config/db.php';

$sql = "ALTER TABLE patients MODIFY COLUMN password VARCHAR(255) NULL DEFAULT NULL";
if (mysqli_query($conn, $sql)) {
    echo "Successfully made patients.password column nullable!\n";
} else {
    echo "Error modifying column: " . mysqli_error($conn) . "\n";
}
?>
