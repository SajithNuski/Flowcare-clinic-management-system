<?php
session_start();
$_SESSION['user_id'] = 4;
$_SESSION['role'] = 'receptionist';
$_SERVER['REQUEST_METHOD'] = 'GET';

ob_start();
require_once __DIR__ . '/../api/appointments/list.php';
$output = ob_get_clean();

echo "RESPONSE FROM API/APPOINTMENTS/LIST.PHP:\n";
echo "========================================\n";
echo $output . "\n";
?>
