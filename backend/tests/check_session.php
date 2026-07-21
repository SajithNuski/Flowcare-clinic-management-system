<?php

session_start();

if(isset($_SESSION["user_id"])){

    echo "User ID: " . $_SESSION["user_id"];
    echo "<br>";
    echo "Role: " . $_SESSION["role"];

}else{

    echo "No session found";

}

?>