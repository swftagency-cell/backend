<?php
/**
 * Configuration file for Swift Agency website
 * Contains database, email, and general application settings
 */


// Prevent direct access
if (!defined('SWIFT_AGENCY_CONFIG')) {
    define('SWIFT_AGENCY_CONFIG', true);
}

// Database Configuration
define('DB_PATH', dirname(__DIR__) . '/database/');
define('APPOINTMENTS_DB', DB_PATH . 'appointments.db');
define('ENQUIRIES_DB', DB_PATH . 'enquiries.db');
define('CHATBOT_DB', DB_PATH . 'chatbot.db');
define('NEWSLETTER_DB', DB_PATH . 'newsletter.db');

// Email Configuration
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'swftagency@gmail.com'); // Change this
define('SMTP_PASSWORD', 'hkolxemwgnjvluok'); // Change this
define('SMTP_ENCRYPTION', 'tls');

// Email Settings
define('FROM_EMAIL', 'noreply@swiftagency.com');
define('FROM_NAME', 'Swift Agency');
define('ADMIN_EMAIL', 'admin@swiftagency.com'); // Change this
define('CONTACT_EMAIL', 'contact@swiftagency.com'); // Change this

// Application Settings
define('SITE_NAME', 'Swift Agency');
define('SITE_URL', 'http://localhost:8000'); // Change for production
define('ADMIN_USERNAME', 'admin'); // Change this
define('ADMIN_PASSWORD', password_hash('admin123', PASSWORD_DEFAULT)); // Change this

// Security Settings
define('SESSION_TIMEOUT', 3600); // 1 hour in seconds
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes in seconds

// File Upload Settings
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']);
define('UPLOAD_PATH', dirname(__DIR__) . '/uploads/');

// API Settings
define('API_RATE_LIMIT', 100); // requests per hour per IP
define('API_TIMEOUT', 30); // seconds

// Logging Settings
define('LOG_PATH', dirname(__DIR__) . '/logs/');
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR
define('LOG_MAX_SIZE', 10 * 1024 * 1024); // 10MB

// Newsletter Settings
define('NEWSLETTER_FROM_EMAIL', FROM_EMAIL);
define('NEWSLETTER_FROM_NAME', FROM_NAME);
define('NEWSLETTER_REPLY_TO', CONTACT_EMAIL);

// Chatbot Settings
define('CHATBOT_MAX_SESSIONS', 1000);
define('CHATBOT_SESSION_TIMEOUT', 1800); // 30 minutes
define('CHATBOT_MAX_MESSAGE_LENGTH', 500);

// Timezone
date_default_timezone_set('UTC');

/**
 * Database connection helper function
 */
function getDatabaseConnection($dbFile) {
    try {
        // Ensure database directory exists
        $dbDir = dirname($dbFile);
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }
        
        $pdo = new PDO('sqlite:' . $dbFile);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        return $pdo;
    } catch (PDOException $e) {
        error_log('Database connection failed: ' . $e->getMessage());
        return false;
    }
}

/**
 * Logging helper function
 */
function writeLog($message, $level = 'INFO') {
    if (!defined('LOG_PATH')) return;
    
    $logDir = LOG_PATH;
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . 'app_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Email validation helper
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Sanitize input helper
 */
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken($token) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Rate limiting helper
 */
function checkRateLimit($identifier, $limit = API_RATE_LIMIT, $window = 3600) {
    $rateLimitFile = LOG_PATH . 'rate_limit_' . md5($identifier) . '.json';
    
    if (!file_exists($rateLimitFile)) {
        $data = ['count' => 1, 'window_start' => time()];
        file_put_contents($rateLimitFile, json_encode($data));
        return true;
    }
    
    $data = json_decode(file_get_contents($rateLimitFile), true);
    $currentTime = time();
    
    // Reset window if expired
    if ($currentTime - $data['window_start'] > $window) {
        $data = ['count' => 1, 'window_start' => $currentTime];
        file_put_contents($rateLimitFile, json_encode($data));
        return true;
    }
    
    // Check if limit exceeded
    if ($data['count'] >= $limit) {
        return false;
    }
    
    // Increment counter
    $data['count']++;
    file_put_contents($rateLimitFile, json_encode($data));
    return true;
}

/**
 * Get client IP address
 */
function getClientIP() {
    $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($ipKeys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

// Initialize logging directory
if (!is_dir(LOG_PATH)) {
    mkdir(LOG_PATH, 0755, true);
}

// Initialize upload directory
if (!is_dir(UPLOAD_PATH)) {
    mkdir(UPLOAD_PATH, 0755, true);
}

// Log configuration load
writeLog('Configuration loaded successfully');

?>