<?php
/**
 * FlowCare JWT (JSON Web Token) Security Utility
 * Provides native, zero-dependency HMAC-SHA256 token generation and validation.
 */

// Secret key used to sign and verify tokens
if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', 'fc_sec_key_9f83a7c2e1b45d608310c7e2a9b4d8f1e3a6c5b8e9d2f4a7c1b3e5d8a0c2e4');
}

/**
 * Base64URL encoding (RFC 7515 compliant)
 */
function jwt_base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64URL decoding (RFC 7515 compliant)
 */
function jwt_base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4 === 0 ? strlen($data) : strlen($data) + (4 - (strlen($data) % 4)), '=', STR_PAD_RIGHT));
}

/**
 * Generates a signed JWT with expiration and claims.
 *
 * @param array $payload Key-value claims (e.g., uid, role, email, name)
 * @param int $expirySeconds Token lifetime in seconds (default: 12 hours)
 * @param string $secret HMAC signing secret
 * @return string Serialized JWT (Header.Payload.Signature)
 */
function jwt_encode(array $payload, int $expirySeconds = 43200, string $secret = JWT_SECRET): string {
    $header = [
        'alg' => 'HS256',
        'typ' => 'JWT'
    ];

    $now = time();
    $payload['iat'] = $now;
    $payload['exp'] = $now + $expirySeconds;

    $encodedHeader = jwt_base64url_encode(json_encode($header));
    $encodedPayload = jwt_base64url_encode(json_encode($payload));

    $signature = hash_hmac('sha256', "$encodedHeader.$encodedPayload", $secret, true);
    $encodedSignature = jwt_base64url_encode($signature);

    return "$encodedHeader.$encodedPayload.$encodedSignature";
}

/**
 * Validates and decodes a JWT.
 * Verifies format, cryptographic signature, and expiration timestamp.
 *
 * @param string $token
 * @param string $secret
 * @return array|false Returns decoded payload array on success, false on invalid or expired token.
 */
function jwt_decode(string $token, string $secret = JWT_SECRET) {
    $parts = explode('.', trim($token));
    if (count($parts) !== 3) {
        return false;
    }

    list($encodedHeader, $encodedPayload, $encodedSignature) = $parts;

    // Verify HMAC-SHA256 signature
    $expectedSignature = jwt_base64url_encode(hash_hmac('sha256', "$encodedHeader.$encodedPayload", $secret, true));
    if (!hash_equals($expectedSignature, $encodedSignature)) {
        return false; // Signature mismatch / tampered token
    }

    $payload = json_decode(jwt_base64url_decode($encodedPayload), true);
    if (!is_array($payload)) {
        return false;
    }

    // Check expiration
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false; // Token expired
    }

    return $payload;
}
?>
