<?php
declare(strict_types=1);

/**
 * Bite POS — sync API configuration and shared helpers.
 *
 * Configure with environment variables (recommended):
 *   BITE_DB_HOST, BITE_DB_PORT, BITE_DB_NAME, BITE_DB_USER, BITE_DB_PASS,
 *   BITE_SYNC_KEY, BITE_ALLOWED_ORIGIN
 *
 * The client sends the same value in the X-Bite-Key header that you set in
 * BITE_SYNC_KEY. Change the development default before going live.
 */

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

define('BITE_APP_VERSION', '1.0.0');

function bite_env(string $key, string $default = ''): string
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}

define('BITE_DB_HOST', bite_env('BITE_DB_HOST', '127.0.0.1'));
define('BITE_DB_PORT', bite_env('BITE_DB_PORT', '3306'));
define('BITE_DB_NAME', bite_env('BITE_DB_NAME', 'bite_pos'));
define('BITE_DB_USER', bite_env('BITE_DB_USER', 'root'));
define('BITE_DB_PASS', bite_env('BITE_DB_PASS', ''));
define('BITE_SYNC_KEY', bite_env('BITE_SYNC_KEY', 'bite-dev-key'));
define('BITE_ALLOWED_ORIGIN', bite_env('BITE_ALLOWED_ORIGIN', ''));

$allowedOrigin = BITE_ALLOWED_ORIGIN;
if ($allowedOrigin !== '' && ($_SERVER['HTTP_ORIGIN'] ?? '') === $allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type, X-Bite-Key, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Max-Age: 600');
}

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store, max-age=0');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function json_out(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $status = 400, array $extra = []): never
{
    json_out(array_merge(['ok' => false, 'error' => $message], $extra), $status);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        BITE_DB_HOST,
        BITE_DB_PORT,
        BITE_DB_NAME
    );
    try {
        $pdo = new PDO($dsn, BITE_DB_USER, BITE_DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);
        $pdo->exec("SET time_zone = '+00:00'");
    } catch (PDOException $exception) {
        error_log('[Bite] Database connection failed: ' . $exception->getMessage());
        fail('Database connection failed. Check api/config.php credentials and that MySQL is running.', 500);
    }
    return $pdo;
}

function require_api_key(): void
{
    $key = $_SERVER['HTTP_X_BITE_KEY'] ?? '';
    if ($key === '' && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s+(.+)/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            $key = trim($matches[1]);
        }
    }
    $expected = BITE_SYNC_KEY;
    if ($expected === '' || $key === '' || !hash_equals($expected, $key)) {
        fail('Unauthorised. Send a valid X-Bite-Key header.', 401);
    }
}

function request_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        fail('Request body is empty.');
    }
    if (strlen($raw) > 5_000_000) {
        fail('Request body is too large.', 413);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        fail('Request body must be valid JSON.');
    }
    return $data;
}

function to_dt(mixed $value): ?string
{
    if (!is_string($value) || trim($value) === '') {
        return null;
    }
    try {
        $date = new DateTimeImmutable($value);
        return $date->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
    } catch (Throwable) {
        return null;
    }
}

function from_dt(?string $value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    try {
        $date = new DateTimeImmutable($value, new DateTimeZone('UTC'));
        return $date->format('Y-m-d\TH:i:s\Z');
    } catch (Throwable) {
        return null;
    }
}

function now_utc(): string
{
    return gmdate('Y-m-d H:i:s');
}

function decimal_value(mixed $value, float $default = 0.0): float
{
    return is_numeric($value) ? (float) $value : $default;
}

function int_value(mixed $value, int $default = 0): int
{
    return is_numeric($value) ? (int) $value : $default;
}

function bool_value(mixed $value, bool $default = true): int
{
    if ($value === null) {
        return $default ? 1 : 0;
    }
    return $value ? 1 : 0;
}

function text_value(mixed $value, int $max = 255): string
{
    $text = is_scalar($value) ? trim((string) $value) : '';
    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $max);
    }
    return substr($text, 0, $max);
}

function id_value(mixed $value, string $context): string
{
    $id = text_value($value, 64);
    if ($id === '') {
        throw new InvalidArgumentException("Missing id for {$context}.");
    }
    return $id;
}
