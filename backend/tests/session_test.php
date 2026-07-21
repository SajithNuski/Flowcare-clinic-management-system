<?php

session_start();

$_SESSION["user_id"] = 10;
$_SESSION["role"] = "admin";

echo "Session created";
?>