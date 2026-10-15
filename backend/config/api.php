<?php
/**
 * FlowCare Central Backend API Configuration & Bootstrap
 * 
 * Centralizes:
 * - CORS origins (flowcare.great-site.net and localhost)
 * - MySQL Database Connection ($conn)
 * - Helper utilities and JWT verification
 * - Uniform JSON response delivery
 */

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/jwt.php';

// Set standard JSON response header if headers have not already been sent
if (!headers_sent()) {
    header('Content-Type: application/json; charset=UTF-8');
}

/**
 * Sends a standardized JSON response and terminates script execution.
 * 
 * @param array|object $data
 * @param int $statusCode
 */
function api_response($data, int $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * Sends a standardized JSON error response.
 * 
 * @param string $message
 * @param int $statusCode
 * @param array $extraFields
 */
function api_error(string $message, int $statusCode = 400, array $extraFields = []) {
    api_response(array_merge([
        'success' => false,
        'error' => $message,
    ], $extraFields), $statusCode);
}

/**
 * Sends a standardized JSON success response.
 * 
 * @param array $payload
 * @param int $statusCode
 */
function api_success(array $payload = [], int $statusCode = 200) {
    api_response(array_merge([
        'success' => true,
    ], $payload), $statusCode);
}

/**
 * Safely parses incoming JSON body payload.
 * 
 * @param bool $assoc Return as associative array (default: true)
 * @return array|object
 */
function get_json_input(bool $assoc = true) {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $assoc ? [] : new stdClass();
    }
    $decoded = json_decode($raw, $assoc);
    return is_array($decoded) || is_object($decoded) ? $decoded : ($assoc ? [] : new stdClass());
}
?>
