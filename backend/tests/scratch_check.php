<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/User.php';

$user = new User($conn);
$res = $user->login('ranasinghe@flowcare.lk', 'password');
if ($res) {
    echo "Login successful!\n";
    print_r($res);
} else {
    echo "Login failed: " . $user->last_error . "\n";
}
?>




