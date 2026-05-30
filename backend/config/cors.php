<?php
// CORS = Cross-Origin Resource Sharing
// Our React app runs on http://localhost:5173
// Our PHP runs on http://localhost/flowcare/backend
// These are different "origins" — without CORS headers, the browser blocks the request
// These headers tell the browser: "It is safe for React to call this PHP"

header("Access-Control-Allow-Origin: http://localhost:5173");
// Allow these HTTP methods
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// Allow these request headers
header("Access-Control-Allow-Headers: Content-Type, Authorization");
// Allow cookies/sessions to be sent across origins
header("Access-Control-Allow-Credentials: true");

// When browser sends a "preflight" OPTIONS request to check if CORS is allowed
// we just say OK and stop — no real processing needed
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	http_response_code(200);
	exit();
}
?>