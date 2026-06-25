<?php
require_once __DIR__ . '/../config/db.php';

$res = mysqli_query($conn, "SHOW TABLES");
while ($row = mysqli_fetch_row($res)) {
    $table = $row[0];
    echo "=== Table: $table ===\n";
    $fields = mysqli_query($conn, "DESCRIBE $table");
    while ($f = mysqli_fetch_assoc($fields)) {
        echo "  {$f['Field']} ({$f['Type']}) " . ($f['Null'] === 'YES' ? 'NULL' : 'NOT NULL') . ($f['Default'] ? " DEFAULT {$f['Default']}" : "") . "\n";
    }
    echo "\n";
}
