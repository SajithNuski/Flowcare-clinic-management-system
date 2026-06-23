<?php
require_once __DIR__ . '/../config/db.php';

$new_hash = password_hash('password', PASSWORD_DEFAULT);

echo "New hash generated: $new_hash\n";

$tables = ['admin', 'doctors', 'receptionist', 'patients'];
$success = true;
foreach ($tables as $table) {
    if (!mysqli_query($conn, "UPDATE $table SET password = '$new_hash'")) {
        echo "Failed to update passwords in table '$table': " . mysqli_error($conn) . "\n";
        $success = false;
    }
}

if ($success) {
    echo "Successfully updated passwords to 'password' in all tables!\n";
}
?>
