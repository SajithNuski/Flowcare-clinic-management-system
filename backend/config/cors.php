<?php
// CORS = Cross-Origin Resource Sharing
// Supports both production (flowcare.great-site.net) and local development (Vite @ localhost:5173)

$allowed_origins = [
	'https://flowcare.great-site.net',
	'http://flowcare.great-site.net',
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'http://localhost:3000'
];

$http_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($http_origin, $allowed_origins)) {
	header("Access-Control-Allow-Origin: " . $http_origin);
} elseif (!empty($http_origin) && preg_match('/^https?:\/\/([a-z0-9-]+\.)?great-site\.net(:[0-9]+)?$/i', $http_origin)) {
	header("Access-Control-Allow-Origin: " . $http_origin);
} else {
	header("Access-Control-Allow-Origin: https://flowcare.great-site.net");
}

// Allow these HTTP methods
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// Allow these request headers
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
// Allow cookies/sessions to be sent across origins
header("Access-Control-Allow-Credentials: true");

// When browser sends a "preflight" OPTIONS request to check if CORS is allowed
// we just say OK and stop — no real processing needed
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	http_response_code(200);
	exit();
}
?>