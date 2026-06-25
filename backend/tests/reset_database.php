<?php
// Since we have table engine corruption, we will drop the database and recreate it.
$host = 'localhost';
$user = 'root';
$pass = '';

$conn = mysqli_connect($host, $user, $pass);
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

echo "Dropping database flowcare if exists...\n";
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 0");
mysqli_query($conn, "DROP DATABASE IF EXISTS flowcare");

echo "Creating database flowcare...\n";
if (!mysqli_query($conn, "CREATE DATABASE flowcare")) {
    die("Failed to create database: " . mysqli_error($conn));
}

mysqli_select_db($conn, 'flowcare');

echo "Reading database.sql...\n";
$sqlFile = __DIR__ . '/../database.sql';
if (!file_exists($sqlFile)) {
    die("database.sql not found at $sqlFile");
}

$sql = file_get_contents($sqlFile);

// Split SQL queries
$queries = [];
$accumulator = '';
$inString = false;
$escaped = false;

$lines = file($sqlFile);
foreach ($lines as $line) {
    // Ignore comments
    if (str_starts_with(trim($line), '--') || str_starts_with(trim($line), '#')) {
        continue;
    }
    $accumulator .= $line;
    if (str_ends_with(trim($line), ';')) {
        $queries[] = $accumulator;
        $accumulator = '';
    }
}

echo "Executing queries...\n";
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 0");
foreach ($queries as $q) {
    $q = trim($q);
    if ($q === '') continue;
    if (!mysqli_query($conn, $q)) {
        echo "Error executing query: " . mysqli_error($conn) . "\nQuery was:\n$q\n\n";
    }
}
mysqli_query($conn, "SET FOREIGN_KEY_CHECKS = 1");

echo "Database reset complete!\n";
