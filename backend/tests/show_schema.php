<?php
require_once __DIR__ . '/../config/db.php';

function dump_table($conn, $table) {
    echo "COLUMNS FOR TABLE '$table':\n";
    $res = mysqli_query($conn, "DESCRIBE $table");
    while ($row = mysqli_fetch_assoc($res)) {
        echo "{$row['Field']} - {$row['Type']} - Null: {$row['Null']}\n";
    }
    echo "\n";
}

dump_table($conn, 'users');
dump_table($conn, 'appointments');
?>
