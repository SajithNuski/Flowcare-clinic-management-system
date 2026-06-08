<?php
require_once __DIR__ . '/../config/db.php';

$new_hash = password_hash('password', PASSWORD_DEFAULT);

echo "New hash generated: $new_hash\n";

$update = mysqli_query($conn, "UPDATE users SET password = '$new_hash'");

if ($update) {
    echo "Successfully updated all user passwords to 'password'!\n";
} else {
    echo "Failed to update passwords: " . mysqli_error($conn) . "\n";
}
?>
