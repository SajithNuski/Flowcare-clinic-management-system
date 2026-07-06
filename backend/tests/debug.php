<?php
require_once __DIR__ . '/../config/db.php';

// Check connection
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
echo "Connected successfully.\n";

// Show all doctors and their working_days & working_time
$res = mysqli_query($conn, "SELECT id, full_name, working_days, working_time FROM doctors");
while ($row = mysqli_fetch_assoc($res)) {
    echo "Doctor ID: {$row['id']} | Name: {$row['full_name']} | Working Days: {$row['working_days']} | Working Time: '{$row['working_time']}'\n";
}
?>
