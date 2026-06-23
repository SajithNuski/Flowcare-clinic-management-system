<?php
require_once __DIR__ . '/../config/db.php';

$res = mysqli_query($conn, "
    SELECT a.id AS appointment_id, a.patient_id, a.appointment_date, a.time_slot,
           u.full_name AS user_full_name, u.phone AS user_phone, 'patient' AS user_role
    FROM appointments a
    LEFT JOIN patients u ON a.patient_id = u.id
");

echo "APPOINTMENT PATIENT DETAIL DUMP:\n";
echo "===============================\n";
while ($row = mysqli_fetch_assoc($res)) {
    echo "Appt ID: {$row['appointment_id']} | Date: {$row['appointment_date']} | Slot: {$row['time_slot']}\n";
    echo "  Patient ID: {$row['patient_id']}\n";
    echo "  User Table Name: '" . ($row['user_full_name'] ?? 'NULL') . "'\n";
    echo "  User Table Phone: '" . ($row['user_phone'] ?? 'NULL') . "'\n";
    echo "  User Table Role: '" . ($row['user_role'] ?? 'NULL') . "'\n";
    echo "---------------------------------\n";
}
?>
