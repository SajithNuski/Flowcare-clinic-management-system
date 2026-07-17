<?php
require_once __DIR__ . '/../config/db.php';

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
echo "Connected successfully.\n";

// Check if columns already exist
$check_query = mysqli_query($conn, "SHOW COLUMNS FROM payments LIKE 'appointment_id'");
if (mysqli_num_rows($check_query) === 0) {
    $sql = "ALTER TABLE payments 
            ADD COLUMN appointment_id INT NULL DEFAULT NULL,
            ADD COLUMN doctor_id INT NULL DEFAULT NULL,
            ADD COLUMN payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
            ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD CONSTRAINT fk_payment_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
            ADD CONSTRAINT fk_payment_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL";
    
    if (mysqli_query($conn, $sql)) {
        echo "Table payments altered successfully: added columns.\n";
    } else {
        echo "Error altering table payments: " . mysqli_error($conn) . "\n";
    }
} else {
    echo "Columns already exist in payments table.\n";
}
?>
