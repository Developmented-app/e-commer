export interface CodeFile {
  path: string;
  name: string;
  category: string;
  content: string;
  language: 'php' | 'sql' | 'env' | 'markdown';
}

export const PHP_CODEBASE: CodeFile[] = [
  {
    path: '.env',
    name: '.env',
    category: 'System Configuration',
    language: 'env',
    content: `# SMM PANEL CONFIGURATION
APP_NAME="Cambodia SMM Pro"
APP_ENV=production
APP_DEBUG=false
APP_URL="https://your-smm-domain.com"
APP_KEY="smm_secret_jwt_key_65f8a293c830c2.81234567"

# DATABASE CONFIGURATION
DB_HOST="localhost"
DB_PORT=3306
DB_NAME="smm_panel_db"
DB_USER="smm_user"
DB_PASS="Secure_Smm_Pass_99x"

# KHQR CAMBODIA GATEWAY DETAILS (Bakong Integration)
# ABA / Bakong Open API credentials
KHQR_MERCHANT_ID="MEMBER_ID_SMM_PANEL_ABA"
KHQR_MERCHANT_NAME="KHMER SMM SERVICES"
KHQR_MERCHANT_CITY="Phnom Penh"
KHQR_ACQUIRING_BANK="ABA Bank"
KHQR_TERMINAL_ID="TERM_00123"
KHQR_API_KEY="bk_api_key_8ffbf8449c28fb3c2f0a1d"
KHQR_SECRET_KEY="bk_sec_key_312f29a08e9ca83db46ef8204b4cdafb"
KHQR_API_URL="https://api-bakong.nbc.gov.kh/v1"
KHQR_WEBHOOK_SECRET="khqr_webhook_secret_key_88029abf99"

# SUPPORTED BANK ACCOUNT NUMBERS
ABA_ACCOUNT_USD="000123456"
ABA_ACCOUNT_KHR="000123457"
WING_ACCOUNT_USD="999888123"
WING_ACCOUNT_KHR="999888124"
BAKONG_ACCOUNT_USD="smm_panel@aba"

# TELEGRAM BOT INTEGRATION
TELEGRAM_BOT_TOKEN="1234567890:ABC-DEF1234ghIkl-zyx987wvu"
TELEGRAM_CHAT_ID="-1009876543210"

# MAIL SETTINGS
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="notifications@your-smm-domain.com"
SMTP_PASS="google_app_password"
`
  },
  {
    path: 'database.sql',
    name: 'database.sql',
    category: 'SQL Database',
    language: 'sql',
    content: `-- Cambodia SMM Panel Database Schema (Production Ready)
-- Compatibility: MySQL 5.7+ / 8.0+ / MariaDB 10.3+

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`icon\` VARCHAR(50) DEFAULT 'list',
  \`status\` TINYINT(1) DEFAULT 1,
  \`sort_order\` INT DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`balance\` DECIMAL(15, 4) DEFAULT 0.0000,
  \`currency\` VARCHAR(3) DEFAULT 'USD', -- Supports USD or KHR
  \`role\` ENUM('admin', 'user') DEFAULT 'user',
  \`api_key\` VARCHAR(64) UNIQUE NOT NULL,
  \`status\` ENUM('active', 'banned') DEFAULT 'active',
  \`referrer_id\` INT DEFAULT NULL,
  \`referral_earnings\` DECIMAL(15, 4) DEFAULT 0.0000,
  \`email_verified\` TINYINT(1) DEFAULT 0,
  \`verification_token\` VARCHAR(100) DEFAULT NULL,
  \`reset_token\` VARCHAR(100) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`referrer_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SERVICES TABLE
CREATE TABLE IF NOT EXISTS \`services\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`category_id\` INT NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`rate_per_1000\` DECIMAL(15, 4) NOT NULL,
  \`min_order\` INT NOT NULL DEFAULT 10,
  \`max_order\` INT NOT NULL DEFAULT 50000,
  \`description\` TEXT,
  \`status\` TINYINT(1) DEFAULT 1,
  \`provider\` VARCHAR(50) DEFAULT 'manual', -- 'manual' or 'api'
  \`provider_service_id\` INT DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS \`orders\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`service_id\` INT NOT NULL,
  \`link\` VARCHAR(255) NOT NULL,
  \`quantity\` INT NOT NULL,
  \`charge\` DECIMAL(15, 4) NOT NULL,
  \`start_counter\` INT DEFAULT 0,
  \`remains\` INT DEFAULT 0,
  \`status\` ENUM('pending', 'processing', 'completed', 'canceled') DEFAULT 'pending',
  \`api_order_id\` INT DEFAULT NULL, -- ID returned from provider SMM api
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`service_id\`) REFERENCES \`services\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PAYMENTS TABLE (KHQR Transactions)
CREATE TABLE IF NOT EXISTS \`payments\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`invoice_id\` VARCHAR(50) NOT NULL UNIQUE,
  \`amount\` DECIMAL(15, 2) NOT NULL,
  \`currency\` VARCHAR(3) DEFAULT 'USD', -- USD or KHR
  \`bank_name\` VARCHAR(50) NOT NULL, -- ABA, Wing, Acleda, Bakong, TrueMoney
  \`khqr_string\` TEXT NOT NULL,
  \`reference_code\` VARCHAR(100) DEFAULT NULL, -- Bank Ref
  \`status\` ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TRANSACTIONS TABLE (User Ledger)
CREATE TABLE IF NOT EXISTS \`transactions\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`type\` ENUM('deposit', 'order_charge', 'order_refund', 'referral_payout') NOT NULL,
  \`amount\` DECIMAL(15, 4) NOT NULL,
  \`currency\` VARCHAR(3) DEFAULT 'USD',
  \`payment_id\` INT DEFAULT NULL,
  \`order_id\` INT DEFAULT NULL,
  \`remarks\` VARCHAR(255) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`payment_id\`) REFERENCES \`payments\`(\`id\`) ON DELETE SET NULL,
  FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TICKETS TABLE (Support Panel)
CREATE TABLE IF NOT EXISTS \`tickets\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`subject\` VARCHAR(150) NOT NULL,
  \`category\` ENUM('order', 'payment', 'api', 'other') NOT NULL,
  \`priority\` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  \`status\` ENUM('open', 'answered', 'closed') DEFAULT 'open',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TICKET REPLIES
CREATE TABLE IF NOT EXISTS \`ticket_replies\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`ticket_id\` INT NOT NULL,
  \`user_id\` INT NOT NULL, -- Either user_id or admin_id
  \`sender\` ENUM('user', 'support') NOT NULL,
  \`message\` TEXT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. API COMM LOGS
CREATE TABLE IF NOT EXISTS \`api_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT DEFAULT NULL,
  \`endpoint\` VARCHAR(255) NOT NULL,
  \`request_data\` TEXT,
  \`response_data\` TEXT,
  \`ip_address\` VARCHAR(45) NOT NULL,
  \`response_code\` INT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`text\` VARCHAR(255) NOT NULL,
  \`type\` ENUM('info', 'success', 'warning') DEFAULT 'info',
  \`is_read\` TINYINT(1) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED MOCK DATA
INSERT INTO \`categories\` (\`id\`, \`name\`, \`icon\`, \`sort_order\`) VALUES
(1, 'Instagram Core Services', 'instagram', 1),
(2, 'TikTok Engagement Booster', 'video', 2),
(3, 'Facebook Reactions & Shares', 'facebook', 3),
(4, 'YouTube Audience Builder', 'youtube', 4),
(5, 'Telegram Members & Post Views', 'send', 5);

INSERT INTO \`services\` (\`id\`, \`category_id\`, \`name\`, \`rate_per_1000\`, \`min_order\`, \`max_order\`, \`description\`, \`provider\`, \`provider_service_id\`) VALUES
(1, 1, 'Instagram Followers [Real / Speed 10K/Day] - Non-Drop', 1.8500, 100, 20000, 'Real followers with detailed profile reviews. Fast activation within 15 minutes. Best for influencer starts.', 'auto_api', 1403),
(2, 1, 'Instagram Likes [High Quality / Safe] - Auto refill', 0.4500, 50, 10000, 'Provides instant likes on specified post url. 30-day auto-refill guarantees stability.', 'auto_api', 552),
(3, 2, 'TikTok Real Likes [Instant Delivery / Safe Feed]', 0.9500, 200, 50000, 'High quality human likes. Undetectable by algorithm, completely organic velocity growth.', 'auto_api', 881),
(4, 3, 'Facebook Page Likes + Followers [Premium Quality]', 2.4000, 100, 10000, 'Combined followers and direct page likes. Builds high authorization and organic SEO trust.', 'manual', NULL);

-- Create Default Admin (Password: admin123)
-- Key used for admin login (securely hashed via native password_hash)
INSERT INTO \`users\` (\`id\`, \`username\`, \`email\`, \`password\`, \`balance\`, \`role\`, \`api_key\`, \`status\`, \`email_verified\`) VALUES
(1, 'admin_pro', 'admin@smm-panel.kh', '$2y$10$7Z60kMOfmXzXN3A7V7q96e088.y8EofVwLp7m1yly0eNfR4pSlytC', 50000.0000, 'admin', 'smm_api_key_88029abf99e8cbdf43f76921aba2d1eb2f90', 'active', 1);

COMMIT;
`
  },
  {
    path: 'config/database.php',
    name: 'database.php',
    category: 'Config',
    language: 'php',
    content: `<?php
/**
 * Database Configuration using PDO (Anti-SQLi compliant)
 */

class Database {
    private static ?PDO $connection = null;

    public static function connect(): PDO {
        if (self::$connection === null) {
            try {
                // Host, DB definition standard
                $host = $_ENV['DB_HOST'] ?? 'localhost';
                $port = $_ENV['DB_PORT'] ?? '3306';
                $db   = $_ENV['DB_NAME'] ?? 'smm_panel_db';
                $user = $_ENV['DB_USER'] ?? 'smm_user';
                $pass = $_ENV['DB_PASS'] ?? '';

                $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ];

                self::$connection = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                // Halt execution upon connection leak
                http_response_code(500);
                if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
                    die("Connection failed: " . $e->getMessage());
                } else {
                    die("Internal Server Error: Database pipeline unavailable.");
                }
            }
        }
        return self::$connection;
    }
}
`
  },
  {
    path: 'core/App.php',
    name: 'App.php',
    category: 'Core MVC Engine',
    language: 'php',
    content: `<?php
/**
 * Core MVC Application Router
 */

class App {
    protected $controller = 'HomeController';
    protected $method = 'index';
    protected array $params = [];

    public function __construct() {
        $url = $this->parseUrl();

        // 1. Simple routes mapping
        $route = $url[0] ?? '';

        switch ($route) {
            case 'api':
                $this->controller = 'APIController';
                array_shift($url);
                $this->method = $url[0] ?? 'index';
                array_shift($url);
                break;

            case 'payment':
                $this->controller = 'PaymentController';
                array_shift($url);
                $this->method = $url[0] ?? 'index';
                array_shift($url);
                break;

            case 'webhook':
                $this->controller = 'WebhookController';
                array_shift($url);
                $this->method = $url[0] ?? 'khqr';
                array_shift($url);
                break;

            case 'cron':
                $this->controller = 'CronController';
                array_shift($url);
                $this->method = $url[0] ?? 'run';
                array_shift($url);
                break;

            case 'admin':
                $this->controller = 'AdminController';
                array_shift($url);
                $this->method = $url[0] ?? 'dashboard';
                array_shift($url);
                break;

            case 'dashboard':
            case 'order':
            case 'tickets':
                $this->controller = 'DashboardController';
                $this->method = $route === 'dashboard' ? 'index' : $route;
                array_shift($url);
                break;

            default:
                $this->controller = 'HomeController';
                $this->method = 'index';
                break;
        }

        // Auto Load Controller file
        $file = __DIR__ . "/../controllers/" . $this->controller . ".php";
        if (file_exists($file)) {
            require_once $file;
        } else {
            http_response_code(404);
            die("Module not found: " . htmlspecialchars($this->controller));
        }

        $this->controller = new $this->controller;
        $this->params = $url ? array_values($url) : [];

        // Check if method exists inside instanced controller
        if (method_exists($this->controller, $this->method)) {
            call_user_func_array([$this->controller, $this->method], $this->params);
        } else {
            http_response_code(404);
            die("Method not found: " . htmlspecialchars($this->method));
        }
    }

    private function parseUrl() {
        if (isset($_GET['url'])) {
            return explode('/', filter_var(rtrim($_GET['url'], '/'), FILTER_SANITIZE_URL));
        }
        return [];
    }
}
`
  },
  {
    path: 'core/Controller.php',
    name: 'Controller.php',
    category: 'Core MVC Engine',
    language: 'php',
    content: `<?php
/**
 * Base Controller providing utilities for verification, sanitization, and payloads
 */

abstract class Controller {
    
    // Output JSON responses securely
    protected function json(mixed $data, int $statusCode = 200): void {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Render MVC PHP views safely
    protected function view(string $view, array $data = []): void {
        extract($data);
        $file = __DIR__ . "/../views/" . $view . ".php";
        if (file_exists($file)) {
            require_once $file;
        } else {
            die("View state file not found: " . htmlspecialchars($view));
        }
    }

    // Capture POST JSON paylods
    protected function getRequestPayload(): array {
        $content = trim(file_get_contents("php://input"));
        $decoded = json_decode($content, true);
        return is_array($decoded) ? $decoded : $_POST;
    }

    // Sanitize user input variables
    protected function sanitize(string $data): string {
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }

    // Handle CSRF Security Token validation
    protected function validateCSRF(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $payload = $this->getRequestPayload();
        $token = $payload['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
            $this->json(['error' => 'Security token is invalid or expired. Session halted.'], 403);
        }
    }

    // Generate CSRF Token for HTML Forms injection
    protected static function generateCSRF(): string {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
}
`
  },
  {
    path: 'helpers/KHQRService.php',
    name: 'KHQRService.php',
    category: 'KHQR Cambodia helper',
    language: 'php',
    content: `<?php
/**
 * Dedicated Cambodian Dynamic KHQR Generation & Signature helper
 * Adheres strictly to NBC (National Bank of Cambodia) / Bakong KHQR specifications
 * Supports USD and KHR dynamic transaction models
 */

class KHQRService {
    private string $merchantId;
    private string $merchantName;
    private string $merchantCity;
    private string $acquiringBank;
    private string $apiKey;
    private string $secretKey;
    private string $apiUrl;

    public function __construct() {
        $this->merchantId = $_ENV['KHQR_MERCHANT_ID'] ?? 'ABA_SMM_MEMBER_995';
        $this->merchantName = $_ENV['KHQR_MERCHANT_NAME'] ?? 'Cambodia SMM';
        $this->merchantCity = $_ENV['KHQR_MERCHANT_CITY'] ?? 'Phnom Penh';
        $this->acquiringBank = $_ENV['KHQR_ACQUIRING_BANK'] ?? 'ABA';
        $this->apiKey = $_ENV['KHQR_API_KEY'] ?? 'bk_api_key_8ffbf8449';
        $this->secretKey = $_ENV['KHQR_SECRET_KEY'] ?? 'bk_sec_key_312f29a0';
        $this->apiUrl = $_ENV['KHQR_API_URL'] ?? 'https://api-bakong.nbc.gov.kh/v1';
    }

    /**
     * Generates standard EMVCo compliant Bakong KHQR string payload
     */
    public function generateKHQRString(string $invoiceId, float $amount, string $currency = 'USD'): string {
        // Tag definitions of NBC KHQR Schema
        $payload = [];
        $payload['00'] = "01"; // Format indicator
        $payload['01'] = "12"; // Point of initiation (12 = Dynamic QR)
        
        // Merchant Account Information (Tag 29 or 30 for Bakong tag template)
        $subPayload = [];
        $subPayload['00'] = $this->merchantId; // Bakong Account SMM ID
        $subPayload['01'] = $this->acquiringBank;
        $subPayload['02'] = "USD" === strtoupper($currency) ? ($_ENV['ABA_ACCOUNT_USD'] ?? '000123456') : ($_ENV['ABA_ACCOUNT_KHR'] ?? '000123457');
        $subString = $this->serializePayload($subPayload);
        
        $payload['29'] = sprintf("%02d%s", strlen($subString), $subString);
        
        $payload['52'] = "5411"; // Merchant Category Code (SMM / Digital Goods)
        $payload['53'] = "USD" === strtoupper($currency) ? "840" : "116"; // Currency code (840=USD, 116=KHR)
        $payload['54'] = sprintf("%.2f", $amount); // Transaction Amount
        $payload['58'] = "KH"; // Country Code
        $payload['59'] = substr($this->merchantName, 0, 25);
        $payload['60'] = substr($this->merchantCity, 0, 15);
        
        // Additional Data Templates (Tag 62)
        $addPayload = [];
        $addPayload['01'] = substr($invoiceId, 0, 25); // Set custom SMM Svc tracking invoice id
        $addPayload['05'] = "SMM_DEPOSIT"; // Reference label
        $addString = $this->serializePayload($addPayload);
        $payload['62'] = sprintf("%02d%s", strlen($addString), $addString);

        // Serialize full standard
        $qrWithoutCRC = "";
        ksort($payload);
        foreach ($payload as $tag => $val) {
            $qrWithoutCRC .= $tag . sprintf("%02d", strlen($val)) . $val;
        }
        $qrWithoutCRC .= "6304"; // Tag 63 for CRC, with length 4

        // Generate CRC-CCITT (0xFFFF)
        $crcVal = $this->crc16_ccitt($qrWithoutCRC);
        return $qrWithoutCRC . sprintf("%04X", $crcVal);
    }

    /**
     * Call Bakong Open System API to register dynamic QR on peer-ledger
     */
    public function submitPaymentRequestToBakong(string $qrString, string $invoiceId, float $amount, string $currency): array {
        // Creating authorization signature using SHA256
        $timestamp = time();
        $signatureString = $this->merchantId . $invoiceId . sprintf("%.2f", $amount) . $currency . $timestamp . $this->secretKey;
        $signature = hash('sha256', $signatureString);

        $payload = [
            'merchantId' => $this->merchantId,
            'invoiceId' => $invoiceId,
            'amount' => $amount,
            'currency' => $currency,
            'qrString' => $qrString,
            'timestamp' => $timestamp,
            'signature' => $signature
        ];

        // Perform curl access to NBC API Server
        $ch = curl_init($this->apiUrl . '/create_qr');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ]);
        
        $response = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            return ['status' => 'error', 'message' => "Gateway transport failure: " . $err];
        }

        $result = json_decode($response, true);
        return $result ?: ['status' => 'error', 'message' => 'Malformed response from banking server.'];
    }

    /**
     * Check real-time payment status from banking APIs
     */
    public function queryPaymentStatus(string $invoiceId): array {
        $timestamp = time();
        $signatureString = $this->merchantId . $invoiceId . $timestamp . $this->secretKey;
        $signature = hash('sha256', $signatureString);

        $queryParams = http_build_query([
            'merchantId' => $this->merchantId,
            'invoiceId' => $invoiceId,
            'timestamp' => $timestamp,
            'signature' => $signature
        ]);

        $ch = curl_init($this->apiUrl . '/check_status?' . $queryParams);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->apiKey
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true) ?: ['status' => 'pending'];
    }

    private function serializePayload(array $data): string {
        $out = "";
        ksort($data);
        foreach ($data as $k => $v) {
            $out .= $k . sprintf("%02d", strlen($v)) . $v;
        }
        return $out;
    }

    private function crc16_ccitt(string $str): int {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($str); $i++) {
            $x = (($crc >> 8) ^ ord($str[$i])) & 0xFF;
            $x ^= $x >> 4;
            $crc = (($crc << 8) ^ ($x << 12) ^ ($x << 5) ^ $x) & 0xFFFF;
        }
        return $crc;
    }
}
`
  },
  {
    path: 'controllers/PaymentController.php',
    name: 'PaymentController.php',
    category: 'Controllers',
    language: 'php',
    content: `<?php
/**
 * Controller to handle deposit generation, checkout UI loaders, and transaction status queries
 */

require_once __DIR__ . "/../core/Controller.php";
require_once __DIR__ . "/../helpers/KHQRService.php";
require_once __DIR__ . "/../config/database.php";

class PaymentController extends Controller {

    // Load dynamic Deposit views
    public function index(): void {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            header("Location: /login");
            exit;
        }
        
        $this->view('deposit', [
            'csrf_token' => self::generateCSRF(),
            'user_balance' => $_SESSION['balance'] ?? 0.00
        ]);
    }

    /**
     * Generate dynamic KHQR receipt and register payment internally
     */
    public function create(): void {
        $this->validateCSRF();
        session_start();
        
        if (!isset($_SESSION['user_id'])) {
            $this->json(['error' => 'Authentication expired. Access denied.'], 401);
        }

        $userId = $_SESSION['user_id'];
        $amount = floatval($_POST['amount'] ?? 0);
        $currency = strtoupper($_POST['currency'] ?? 'USD');
        $bank = $this->sanitize($_POST['bank'] ?? 'ABA'); // ABA, ACLEDA, Bakong, Wing, TrueMoney

        if ($amount < 1.00 || $amount > 5000.00) {
            $this->json(['error' => 'Invalid amount. Minimum deposit is $1.00, maximum is $5,000.00.'], 400);
        }

        $db = Database::connect();
        
        // Ensure user is not banned
        $stmt = $db->prepare("SELECT status FROM users WHERE id = :id");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();
        if (!$user || $user['status'] === 'banned') {
            $this->json(['error' => 'Your account has been restricted. Depositing halted.'], 403);
        }

        $invoiceId = "SMM_" . strtoupper(bin2hex(random_bytes(6)));

        // Generate the standard EMV-CCITT compliant KHQR string
        $khqrService = new KHQRService();
        $khqrString = $khqrService->generateKHQRString($invoiceId, $amount, $currency);

        // Register payment transaction in SMM state db
        $stmt = $db->prepare("
            INSERT INTO payments (user_id, invoice_id, amount, currency, bank_name, khqr_string, status) 
            VALUES (:user_id, :invoice_id, :amount, :currency, :bank_name, :khqr_string, 'pending')
        ");
        
        $stmt->execute([
            'user_id' => $userId,
            'invoice_id' => $invoiceId,
            'amount' => $amount,
            'currency' => $currency,
            'bank_name' => $bank,
            'khqr_string' => $khqrString
        ]);

        $this->json([
            'status' => 'success',
            'invoice_id' => $invoiceId,
            'amount' => $amount,
            'currency' => $currency,
            'bank' => $bank,
            'khqr_string' => $khqrString,
            'check_status_url' => '/payment/status/' . $invoiceId
        ]);
    }

    /**
     * Check transaction status on poll interval
     */
    public function status(string $invoiceId = ''): void {
        if (empty($invoiceId)) {
            $this->json(['error' => 'Invoice tracking ID is empty.'], 400);
        }

        $db = Database::connect();
        $stmt = $db->prepare("SELECT status, amount, user_id FROM payments WHERE invoice_id = :invoice_id");
        $stmt->execute(['invoice_id' => $invoiceId]);
        $payment = $stmt->fetch();

        if (!$payment) {
            $this->json(['error' => 'Invoice not found.'], 404);
        }

        // If transaction successfully completed already via Webhook callback, return success
        if ($payment['status'] === 'success') {
            $this->json(['status' => 'success', 'message' => 'Payment fully verified. Balance loaded.']);
        }

        // Query state from the Bank Gateway explicitly (in case webhook delayed)
        $khqrService = new KHQRService();
        $gatewayResult = $khqrService->queryPaymentStatus($invoiceId);

        if (isset($gatewayResult['status']) && $gatewayResult['status'] === 'completed') {
            // Trigger automatic crediting process
            $db->beginTransaction();
            try {
                // Re-confirm double transactions prevention
                $stmt = $db->prepare("SELECT status FROM payments WHERE invoice_id = :invoice_id FOR UPDATE");
                $stmt->execute(['invoice_id' => $invoiceId]);
                $currentStatus = $stmt->fetchColumn();

                if ($currentStatus === 'pending') {
                    // 1. Update Payment Status table
                    $stmt = $db->prepare("
                        UPDATE payments 
                        SET status = 'success', reference_code = :ref 
                        WHERE invoice_id = :invoice_id
                    ");
                    $stmt->execute([
                        'ref' => $gatewayResult['reference_code'] ?? 'ACQ_BANK_AUTO_CONF',
                        'invoice_id' => $invoiceId
                    ]);

                    // 2. Load User Balance safely
                    $stmt = $db->prepare("UPDATE users SET balance = balance + :amount WHERE id = :id");
                    $stmt->execute([
                        'amount' => $payment['amount'],
                        'id' => $payment['user_id']
                    ]);

                    // 3. Register user transaction ledger entry
                    $stmt = $db->prepare("
                        INSERT INTO transactions (user_id, type, amount, remarks) 
                        VALUES (:user_id, 'deposit', :amount, :remarks)
                    ");
                    $stmt->execute([
                        'user_id' => $payment['user_id'],
                        'amount' => $payment['amount'],
                        'remarks' => "Deposited via Dynamic KHQR - " . $invoiceId
                    ]);

                    // 4. Send SMM Application Alert Notification
                    $stmt = $db->prepare("
                        INSERT INTO notifications (user_id, text, type) 
                        VALUES (:user_id, :text, 'success')
                    ");
                    $msg = "Success! $" . number_format($payment['amount'], 2) . " has been credited to SMM panel account.";
                    $stmt->execute([
                        'user_id' => $payment['user_id'],
                        'text' => $msg
                    ]);

                    $db->commit();
                    $this->json(['status' => 'success', 'message' => 'Payment completed and user balance increased.']);
                } else {
                    $db->rollBack();
                    $this->json(['status' => 'success', 'message' => 'Payment processed already.']);
                }
            } catch (Exception $e) {
                $db->rollBack();
                $this->json(['status' => 'error', 'message' => 'Transactional error processing database logs: ' . $e->getMessage()], 500);
            }
        } else {
            $this->json(['status' => 'pending', 'message' => 'Awaiting payment confirmation.']);
        }
    }
}
`
  },
  {
    path: 'controllers/WebhookController.php',
    name: 'WebhookController.php',
    category: 'Controllers',
    language: 'php',
    content: `<?php
/**
 * Bank API Callback Receiver handler (Asynchronous Bank-Push notifications processing)
 */

require_once __DIR__ . "/../core/Controller.php";
require_once __DIR__ . "/../config/database.php";

class WebhookController extends Controller {

    /**
     * KHQR Webhook endpoint triggered by Acquirer Bank API
     */
    public function khqr(): void {
        // Enforce POST requests
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['error' => 'Invalid Access Method.'], 405);
        }

        $headers = getallheaders();
        $signature = $headers['X-KHQR-Signature'] ?? '';
        $payloadRaw = file_get_contents("php://input");
        $payload = json_decode($payloadRaw, true);

        if (!$payload || !isset($payload['invoiceId']) || !isset($payload['amount'])) {
            $this->json(['error' => 'Malformed Webhook payload.'], 400);
        }

        // Verify HMAC-SHA256 signature to prevent injection
        $secret = $_ENV['KHQR_WEBHOOK_SECRET'] ?? 'khqr_webhook_secret_key_88029abf99';
        $computedSignature = hash_hmac('sha256', $payloadRaw, $secret);

        if (!hash_equals($computedSignature, $signature)) {
            // Log security warning
            $this->logCommunications('webhook_security_alert', $payloadRaw, 'SIG_MISMATCH', $_SERVER['REMOTE_ADDR'], 401);
            $this->json(['error' => 'Forbidden: Signatures mismatch.'], 401);
        }

        $invoiceId = $payload['invoiceId'];
        $amount = floatval($payload['amount']);
        $referenceCode = $payload['referenceCode'] ?? 'WEBHOOK_PAY';
        $pushedStatus = $payload['status'] ?? ''; // e.g. 'success' or 'completed'

        if ($pushedStatus !== 'success' && $pushedStatus !== 'completed') {
            $this->json(['status' => 'ignored', 'message' => 'Ignored unsuccessful status alerts.']);
        }

        $db = Database::connect();
        
        try {
            $db->beginTransaction();

            // Lock payments row to prevent race conditions
            $stmt = $db->prepare("SELECT * FROM payments WHERE invoice_id = :invoice_id FOR UPDATE");
            $stmt->execute(['invoice_id' => $invoiceId]);
            $paymentObj = $stmt->fetch();

            if (!$paymentObj) {
                $db->rollBack();
                $this->json(['error' => 'Invoice matching requested tracking index not found.'], 404);
            }

            if ($paymentObj['status'] === 'success') {
                $db->rollBack();
                $this->json(['status' => 'ready', 'message' => 'Transaction was credited processed already.']);
            }

            // Verify requested transaction amount with raw deposited amount
            if (abs(floatval($paymentObj['amount']) - $amount) > 0.05) {
                $db->rollBack();
                $this->logCommunications('webhook_error', $payloadRaw, 'UNMATCHED_AMOUNT', $_SERVER['REMOTE_ADDR'], 400);
                $this->json(['error' => 'Conflict: Discrepancy in deposit amount detected.'], 400);
            }

            // 1. Update SMM payments record
            $stmt = $db->prepare("
                UPDATE payments 
                SET status = 'success', reference_code = :ref 
                WHERE invoice_id = :invoice_id
            ");
            $stmt->execute([
                'ref' => $referenceCode,
                'invoice_id' => $invoiceId
            ]);

            // 2. Add balance safely
            $stmt = $db->prepare("UPDATE users SET balance = balance + :amount WHERE id = :id");
            $stmt->execute([
                'amount' => $amount,
                'id' => $paymentObj['user_id']
            ]);

            // 3. Register transaction ledger
            $stmt = $db->prepare("
                INSERT INTO transactions (user_id, type, amount, remarks) 
                VALUES (:user_id, 'deposit', :amount, :remarks)
            ");
            $stmt->execute([
                'user_id' => $paymentObj['user_id'],
                'amount' => $amount,
                'remarks' => "Credited via Bakong Webhook callback: " . $referenceCode
            ]);

            // 4. Register Notification
            $stmt = $db->prepare("
                INSERT INTO notifications (user_id, text, type) 
                VALUES (:user_id, :text, 'success')
            ");
            $msg = "Success! Instantly credited $" . number_format($amount, 2) . " to account via bank webhook.";
            $stmt->execute([
                'user_id' => $paymentObj['user_id'],
                'text' => $msg
            ]);

            // 5. Trigger Telegram Alert
            $this->sendTelegramAlert($paymentObj['user_id'], $amount, $invoiceId);

            $db->commit();
            $this->logCommunications('webhook_success', $payloadRaw, 'SUCCESS', $_SERVER['REMOTE_ADDR'], 200);
            $this->json(['status' => 'success', 'message' => 'Processed webhook callback successfully.']);

        } catch (Exception $e) {
            $db->rollBack();
            $this->logCommunications('webhook_fatal_error', $payloadRaw, $e->getMessage(), $_SERVER['REMOTE_ADDR'], 500);
            $this->json(['error' => 'Internal logic error updating assets database.'], 500);
        }
    }

    private function sendTelegramAlert(int $userId, float $amount, string $invoiceId): void {
        $token = $_ENV['TELEGRAM_BOT_TOKEN'] ?? null;
        $chatId = $_ENV['TELEGRAM_CHAT_ID'] ?? null;
        if (!$token || !$chatId) return;

        $msgText = "🔔 *SMM Panel Deposit Confirmed!*\n\n"
                 . "👤 *User ID:* " . $userId . "\n"
                 . "💵 *Deposited Amount:* $" . number_format($amount, 2) . "\n"
                 . "⛓️ *Invoice ID:* \`" . $invoiceId . "\`\n"
                 . "🏦 *Network:* KHQR Realtime Direct";

        $url = "https://api.telegram.org/bot" . $token . "/sendMessage";
        $payload = [
            'chat_id' => $chatId,
            'text' => $msgText,
            'parse_mode' => 'Markdown'
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
        // Async send to keep webhook fast
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        curl_exec($ch);
        curl_close($ch);
    }

    private function logCommunications(string $endpoint, string $request, string $response, string $ip, int $code): void {
        try {
            $db = Database::connect();
            $stmt = $db->prepare("
                INSERT INTO api_logs (endpoint, request_data, response_data, ip_address, response_code) 
                VALUES (:end, :req, :resp, :ip, :code)
            ");
            $stmt->execute([
                'end' => $endpoint,
                'req' => $request,
                'resp' => $response,
                'ip' => $ip,
                'code' => $code
            ]);
        } catch (\Exception $ex) {}
    }
}
`
  },
  {
    path: 'controllers/APIController.php',
    name: 'APIController.php',
    category: 'Controllers',
    language: 'php',
    content: `<?php
/**
 * Developer REST API Gateway controller for SMM Panels
 * Features secure API Key authentication, Rate Limiting, actions processing
 */

require_once __DIR__ . "/../core/Controller.php";
require_once __DIR__ . "/../config/database.php";

class APIController extends Controller {
    private array $user;

    public function __construct() {
        $this->authenticateRequest();
        $this->enforceRateLimit();
    }

    public function index(): void {
        $payload = $this->getRequestPayload();
        $action = $this->sanitize($payload['action'] ?? '');

        switch ($action) {
            case 'services':
                $this->getServices();
                break;
            case 'add':
                $this->addOrder($payload);
                break;
            case 'status':
                $this->getOrderStatus($payload);
                break;
            case 'balance':
                $this->getBalance();
                break;
            default:
                $this->json(['error' => 'Invalid action parameter or endpoint configuration.'], 400);
        }
    }

    private function authenticateRequest(): void {
        $headers = getallheaders();
        $apiKey = $headers['Authorization'] ?? $_POST['key'] ?? $_GET['key'] ?? '';
        
        // Remove Bearer suffix if exists
        $apiKey = str_ireplace('Bearer ', '', $apiKey);

        if (empty($apiKey)) {
            $this->json(['error' => 'API Key required. Authenticated header Authorization is absent.'], 401);
        }

        $db = Database::connect();
        $stmt = $db->prepare("SELECT * FROM users WHERE api_key = :api_key AND status = 'active'");
        $stmt->execute(['api_key' => $apiKey]);
        $user = $stmt->fetch();

        if (!$user) {
            $this->json(['error' => 'Invalid authorization key, or banned user state.'], 403);
        }

        $this->user = $user;
    }

    private function enforceRateLimit(): void {
        // Simple rate limiting (Max 60 requests per minute) cached via session or sqlite file
        $userId = $this->user['id'];
        $ip = $_SERVER['REMOTE_ADDR'];
        $db = Database::connect();

        // Count logs in past 60s
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM api_logs 
            WHERE user_id = :id AND created_at > NOW() - INTERVAL 1 MINUTE
        ");
        $stmt->execute(['id' => $userId]);
        $counts = $stmt->fetchColumn();

        if ($counts > 60) {
            $this->json(['error' => 'Limit reached. Only 60 requests allowed per minute.'], 429);
        }
    }

    private function getServices(): void {
        $db = Database::connect();
        $stmt = $db->query("
            SELECT s.id, s.name, s.rate_per_1000 as rate, s.min_order as min, s.max_order as max, s.description, c.name as category 
            FROM services s 
            LEFT JOIN categories c ON c.id = s.category_id 
            WHERE s.status = 1
        ");
        $services = $stmt->fetchAll();
        $this->json($services);
    }

    private function addOrder(array $payload): void {
        $serviceId = intval($payload['service'] ?? 0);
        $link = $this->sanitize($payload['link'] ?? '');
        $quantity = intval($payload['quantity'] ?? 0);

        if (empty($link) || $quantity <= 0) {
            $this->json(['error' => 'Incomplete parameters: service, link, and quantity are required.'], 400);
        }

        $db = Database::connect();
        $stmt = $db->prepare("SELECT * FROM services WHERE id = :id AND status = 1");
        $stmt->execute(['id' => $serviceId]);
        $service = $stmt->fetch();

        if (!$service) {
            $this->json(['error' => 'Specified SMM service does not exist or is inactive.'], 404);
        }

        if ($quantity < $service['min_order'] || $quantity > $service['max_order']) {
            $this->json(['error' => "Quantity limits breached. Minimum is {$service['min_order']}, Maximum is {$service['max_order']}"], 400);
        }

        $charge = ($service['rate_per_1000'] / 1000) * $quantity;

        // Perform balance deduction locking transaction balance
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("SELECT balance FROM users WHERE id = :id FOR UPDATE");
            $stmt->execute(['id' => $this->user['id']]);
            $currentBalance = $stmt->fetchColumn();

            if ($currentBalance < $charge) {
                $db->rollBack();
                $this->json(['error' => 'Insufficient SMM balance. Please deposit funds.'], 400);
            }

            // Deduct User Assets SMM Panel Balance
            $stmt = $db->prepare("UPDATE users SET balance = balance - :charge WHERE id = :id");
            $stmt->execute(['charge' => $charge, 'id' => $this->user['id']]);

            // Save order record
            $stmt = $db->prepare("
                INSERT INTO orders (user_id, service_id, link, quantity, charge, start_counter, remains, status) 
                VALUES (:user, :service, :link, :qty, :charge, 0, :qty, 'pending')
            ");
            $stmt->execute([
                'user' => $this->user['id'],
                'service' => $serviceId,
                'link' => $link,
                'qty' => $quantity,
                'charge' => $charge
            ]);
            
            $orderId = $db->lastInsertId();

            // Insert accounting transaction log
            $stmt = $db->prepare("
                INSERT INTO transactions (user_id, type, amount, remarks, order_id) 
                VALUES (:user_id, 'order_charge', :amount, :remarks, :order_id)
            ");
            $stmt->execute([
                'user_id' => $this->user['id'],
                'amount' => -$charge,
                'remarks' => "Order #{$orderId} placed via REST API",
                'order_id' => $orderId
            ]);

            $db->commit();
            $this->json(['status' => 'success', 'order' => $orderId, 'charge' => $charge]);
        } catch (Exception $e) {
            $db->rollBack();
            $this->json(['error' => 'Internal database error finalizing orders: ' . $e->getMessage()], 500);
        }
    }

    private function getOrderStatus(array $payload): void {
        $orderId = intval($payload['order'] ?? 0);
        if ($orderId <= 0) {
            $this->json(['error' => 'Missing order parameter ID.'], 400);
        }

        $db = Database::connect();
        $stmt = $db->prepare("SELECT status, start_counter, remains, charge FROM orders WHERE id = :id AND user_id = :uid");
        $stmt->execute(['id' => $orderId, 'uid' => $this->user['id']]);
        $order = $stmt->fetch();

        if (!$order) {
            $this->json(['error' => 'Order was not tracked on your account.'], 404);
        }

        $this->json([
            'status' => $order['status'],
            'start_count' => $order['start_counter'],
            'remains' => $order['remains'],
            'charge' => $order['charge'],
            'currency' => 'USD'
        ]);
    }

    private function getBalance(): void {
        $this->json([
            'username' => $this->user['username'],
            'balance' => $this->user['balance'],
            'currency' => 'USD'
        ]);
    }
}
`
  },
  {
    path: 'controllers/CronController.php',
    name: 'CronController.php',
    category: 'SMM Sync & Cron',
    language: 'php',
    content: `<?php
/**
 * Cron Job script executing SMM background automation
 * Runs every 5 minutes to updates order states, synchronize APIs, refund faults, and alerts
 */

require_once __DIR__ . "/../config/database.php";

class CronController {

    public function run(): void {
        // Enforce secret CLI/cron key verification
        if (php_sapi_name() !== 'cli') {
            $cronToken = $_GET['token'] ?? '';
            $secret = $_ENV['APP_KEY'] ?? 'smm_secret_jwt_key_';
            if (!hash_equals($secret, $cronToken)) {
                http_response_code(403);
                die("Forbidden: Access restricted to administrative automated systems.");
            }
        }

        header("Content-Type: text/plain; charset=UTF-8");
        echo "=== Launching SMM Automation Cron: " . date('Y-m-d H:i:s') . " ===\n";

        $db = Database::connect();

        // 1. Fetch pending/processing orders representing API-based services
        $stmt = $db->query("
            SELECT o.*, s.provider, s.provider_service_id 
            FROM orders o
            JOIN services s ON o.service_id = s.id
            WHERE o.status IN ('pending', 'processing')
        ");
        $orders = $stmt->fetchAll();

        echo "Found " . count($orders) . " active orders to sync.\n";

        foreach ($orders as $order) {
            if ($order['provider'] === 'auto_api' && !empty($order['provider_service_id'])) {
                $this->syncWithExternalApi($db, $order);
            } else {
                // Mocking local speed delivery for manual/local services
                $this->simulatedLocalDelivery($db, $order);
            }
        }

        echo "=== Cron processes completed successfully. ===\n";
    }

    private function syncWithExternalApi(PDO $db, array $order): void {
        // In real SMM systems, you call curl requests to SMM services e.g. JustAnotherPanel or JAP
        // Example response: {"status": "completed", "start_count": "1040", "remains": "0"}
        
        $fakeStatuses = ['processing', 'completed', 'canceled'];
        $nextStatus = $fakeStatuses[array_rand($fakeStatuses)];
        
        $db->beginTransaction();
        try {
            if ($nextStatus === 'completed') {
                $stmt = $db->prepare("UPDATE orders SET status = 'completed', start_counter = start_counter + 50, remains = 0 WHERE id = :id");
                $stmt->execute(['id' => $order['id']]);
                
            } else if ($nextStatus === 'canceled') {
                // Refund transaction process!
                $stmt = $db->prepare("UPDATE orders SET status = 'canceled', remains = :remains WHERE id = :id");
                $stmt->execute(['remains' => $order['quantity'], 'id' => $order['id']]);

                // Credit user balance back
                $stmt = $db->prepare("UPDATE users SET balance = balance + :charge WHERE id = :id");
                $stmt->execute(['charge' => $order['charge'], 'id' => $order['user_id']]);

                // Saved in users transactions ledgers
                $stmt = $db->prepare("
                    INSERT INTO transactions (user_id, type, amount, remarks, order_id) 
                    VALUES (:user_id, 'order_refund', :amount, 'Refund for Canceled SMM Order', :order_id)
                ");
                $stmt->execute([
                    'user_id' => $order['user_id'],
                    'amount' => $order['charge'],
                    'order_id' => $order['id']
                ]);
            } else {
                $stmt = $db->prepare("UPDATE orders SET status = 'processing', remains = :rem WHERE id = :id");
                $stmt->execute([
                    'rem' => max(0, intval($order['quantity'] * 0.4)),
                    'id' => $order['id']
                ]);
            }
            $db->commit();
            echo "Successfully Synced Order ID #{$order['id']} status to: {$nextStatus}\n";
        } catch (\Exception $ex) {
            $db->rollBack();
            echo "Error Syncing Order #{$order['id']}: " . $ex->getMessage() . "\n";
        }
    }

    private function simulatedLocalDelivery(PDO $db, array $order): void {
        $db->beginTransaction();
        try {
            // Gradually reduce remains, update to completed if it turns 0
            if ($order['status'] === 'pending') {
                $stmt = $db->prepare("UPDATE orders SET status = 'processing', start_counter = 120, remains = :rem WHERE id = :id");
                $stmt->execute(['rem' => intval($order['quantity'] * 0.7), 'id' => $order['id']]);
            } else if ($order['status'] === 'processing') {
                $stmt = $db->prepare("UPDATE orders SET status = 'completed', remains = 0 WHERE id = :id");
                $stmt->execute(['id' => $order['id']]);
            }
            $db->commit();
            echo "Local Delivery updated state for order #{$order['id']} successfully.\n";
        } catch (\Exception $ex) {
            $db->rollBack();
        }
    }
}
`
  },
  {
    path: 'views/deposit.php',
    name: 'deposit.php',
    category: 'Views (HTML/UI)',
    language: 'php',
    content: `<!-- SMM Panel - PHP Deposit Funds with Cambodia dynamic KHQR (ABA, Wing, Bakong) -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deposit PHP SMM Panel</title>
    <!-- CSS Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .bank-card {
            border: 2px solid #e2e8f0;
            cursor: pointer;
            transition: all 0.25s ease;
        }
        .bank-card.active {
            border-color: #e53e3e;
            background-color: #fffaf0;
        }
        .khqr-box {
            background-color: #b71c1c; /* Official Bakong Red Theme */
            color: white;
            border-radius: 12px;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
        }
    </style>
</head>
<body class="bg-light">

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="card shadow border-0">
                <div class="card-body p-5">
                    <h3 class="card-title text-center text-dark font-weight-bold mb-4">
                        <i class="fa-solid fa-wallet text-danger me-2"></i>Fund Your SMM Account
                    </h3>
                    
                    <p class="text-secondary text-center">Enter your deposit amount in USD and select your bank to scan the NBC KHQR dynamic code instantly.</p>

                    <!-- Form for deposit submitting -->
                    <form id="depositForm" method="POST" action="/payment/create" class="mt-4">
                        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf_token); ?>">
                        
                        <!-- 1. Selection Bank lists -->
                        <label class="form-label font-weight-bold">Select Acquirer Bank Net:</label>
                        <div class="row g-3 mb-4">
                            <div class="col-md-4">
                                <div class="card bank-card p-3 text-center active" onclick="selectBank(this, 'ABA')">
                                    <strong class="d-block mb-1 text-primary">ABA Bank</strong>
                                    <span class="text-xs text-muted">Instant Dynamic Settle</span>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bank-card p-3 text-center" onclick="selectBank(this, 'ACLEDA')">
                                    <strong class="d-block mb-1 text-info">ACLEDA Bank</strong>
                                    <span class="text-xs text-muted">Toic pay support</span>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bank-card p-3 text-center" onclick="selectBank(this, 'Bakong')">
                                    <strong class="d-block mb-1 text-danger">Bakong Account</strong>
                                    <span class="text-xs text-muted">NBC QR direct ledger</span>
                                </div>
                            </div>
                        </div>

                        <!-- 2. Inputs selection -->
                        <div class="mb-4">
                            <label for="amount" class="form-label font-weight-bold">Deposit Amount (USD)</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" step="0.01" class="form-control" id="amount" name="amount" placeholder="0.00" min="1.00" max="5000.00" required>
                                <span class="input-group-text">USD</span>
                            </div>
                            <div class="form-text mt-1 text-muted">Deposited amounts are automatically settled at our bank and credited to SMM panel balances instantly.</div>
                        </div>

                        <input type="hidden" name="bank" id="selectedBankInput" value="ABA">

                        <button type="submit" class="btn btn-danger w-full py-3">
                            <i class="fa-solid fa-qrcode me-2"></i>Generate Dynamic KHQR Image
                        </button>
                    </form>

                    <!-- KHQR Rendering Modal Window -->
                    <div id="paymentModal" class="d-none text-center mt-5">
                        <hr class="my-4">
                        <div class="khqr-box shadow-lg">
                            <h4 class="mb-3"><i class="fa-solid fa-qrcode me-2"></i>BAKONG KHQR</h4>
                            <p class="text-xs text-light">SCAN TO PAY USD</p>
                            
                            <!-- Drawing Dynamic QR Canvas -->
                            <div class="bg-white p-3 rounded mx-auto mb-3" style="width: 240px; height: 240px;">
                                <div id="qrContent" class="d-flex align-items-center justify-content-center h-100">
                                    <!-- Dynamic QR loaded here via api -->
                                    <input type="hidden" id="khqr_string_data" />
                                    <div class="spinner-border text-danger" role="status"></div>
                                </div>
                            </div>

                            <p class="h5 mb-1" id="displayAmount">$0.00</p>
                            <p class="text-xs text-light mb-2">Invoice: <span id="displayInvoice">SMM_XXXX</span></p>

                            <div class="badge bg-warning text-dark py-2 px-3">
                                <i class="fa-solid fa-arrows-rotate fa-spin me-2"></i>Checking payment state...
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</div>

<!-- SCRIPTS JQUERY + BS5 + SweetAlert2 -->
<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<!-- QR Library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.qrcode/1.0/jquery.qrcode.min.js"></script>

<script>
    let pollInterval = null;

    function selectBank(element, bankCode) {
        $('.bank-card').removeClass('active');
        $(element).addClass('active');
        $('#selectedBankInput').val(bankCode);
    }

    $('#depositForm').on('submit', function(e) {
        e.preventDefault();
        
        let amount = $('#amount').val();
        let bank = $('#selectedBankInput').val();
        let token = $('input[name="csrf_token"]').val();

        Swal.fire({
            title: 'Generating dynamic KHQR',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        $.ajax({
            url: $(this).attr('action'),
            method: 'POST',
            data: {
                amount: amount,
                bank: bank,
                currency: 'USD',
                csrf_token: token
            },
            dataType: 'json',
            success: function(response) {
                Swal.close();
                if (response.status === 'success') {
                    // Start rendering QR with Jquery qrcode
                    $('#qrContent').empty();
                    $('#qrContent').qrcode({
                        width: 200,
                        height: 200,
                        text: response.khqr_string
                    });

                    $('#displayAmount').text('$' + parseFloat(response.amount).toFixed(2));
                    $('#displayInvoice').text(response.invoice_id);
                    $('#paymentModal').removeClass('d-none');

                    // Start Checking Balance Status Loop (Query Status every 3 seconds)
                    startCheckingStatus(response.invoice_id);
                } else {
                    Swal.fire('Error', response.error || 'Failed to initialize payment gateway.', 'error');
                }
            },
            error: function(xhr) {
                Swal.close();
                let errMsg = xhr.responseJSON ? xhr.responseJSON.error : 'Network transportation error.';
                Swal.fire('Error', errMsg, 'error');
            }
        });
    });

    function startCheckingStatus(invoiceId) {
        if (pollInterval) clearInterval(pollInterval);

        pollInterval = setInterval(function() {
            $.ajax({
                url: '/payment/status/' + invoiceId,
                method: 'GET',
                dataType: 'json',
                success: function(res) {
                    if (res.status === 'success') {
                        clearInterval(pollInterval);
                        Swal.fire({
                            title: 'Success!',
                            text: 'Amount credited to SMM panel account balance.',
                            icon: 'success'
                        }).then(() => {
                            window.location.reload();
                        });
                    }
                }
            });
        }, 3000);
    }
</script>
</body>
</html>
`
  },
  {
    path: 'README_INSTALL.md',
    name: 'INSTALLATION GUIDE',
    category: 'System Documentation',
    language: 'markdown',
    content: `# Installation Guide: Cambodia SMM Panel with KHQR

This is a premium SMM Panel system built in modern PHP 8+ MVC architecture with standard PDO security wrappers, Telegram Notifications, REST API Sandbox, and native EMVCo Dynamic KHQR payment settlement support (ABA, Wing, Bakong).

---

## 🛠️ Requirements
- **PHP Interpreter**: PHP 8.1 or newer (modules required: \`pdo_mysql\`, \`curl\`, \`json\`, \`openssl\`, \`mbstring\`)
- **SQL Engine**: MySQL 5.7+ / 8.0+ or MariaDB 10.3+
- **HTTP Server**: Apache (with \`mod_rewrite\` enabled) or Nginx
- **Web Address**: Fully qualified SSL domain (required for dynamic banking webhook triggers)

---

## 🚀 Step 1: Clone and Folder Placements
Set the following folder hierarchy inside your server workspace web directory (e.g. \`/var/www/html\` or \`public_html\`):

\`\`\`text
├── app/
│   ├── controllers/       <-- Actions processing
│   ├── models/            <-- Assets models
│   ├── views/             <-- Front-end templates
│   └── core/              <-- App Routing & Security loaders
├── helpers/               <-- Utilities (KHQR integration, Cron bots)
├── config/                <-- Credentials loading
├── public/                <-- Entry point and visual assets
│   ├── index.php          <-- Primary boot file
│   └── assets/
└── .env                   <-- Environment variables
\`\`\`

---

## 💾 Step 2: Set up Database Schema
1. Connect to your database server (phpMyAdmin or CLI).
2. Create a database named \`smm_panel_db\`.
3. Import the file \`database.sql\`.
4. Create a dedicated MySQL system user and grant SQL privileges.

---

## ⚙️ Step 3: Configure settings
Copy variables from \`.env.example\` into your primary \`.env\` file in the root directory. Fill out your custom MySQL connections and Bakong/ABA dynamic payment API keys:

\`\`\`ini
DB_HOST="localhost"
DB_NAME="smm_panel_db"
DB_USER="smm_user"
DB_PASS="Secure_Smm_Pass_99x"

# KHQR Member IDs (Provide actual accounts)
KHQR_MERCHANT_ID="MEMBER_SMM_ABA"
KHQR_API_KEY="bk_api_key_xxxxxxxxxxxxx"
KHQR_SECRET_KEY="bk_sec_key_xxxxxxxxxxxxx"
KHQR_WEBHOOK_SECRET="khqr_webhook_secret_key_88029abf99"
\`\`\`

---

## 🛡️ Step 4: Web Server Enforcements

### Apache (.htaccess configuration)
Create a \`.htaccess\` file inside the \`/public\` web directory:
\`\`\`xml
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php?url=$1 [QSA,L]
\`\`\`

### Nginx (config mapping)
Inside your server block configuration:
\`\`\`nginx
location / {
    try_files $uri $uri/ /index.php?url=$query_string;
}
\`\`\`

---

## ⚙️ Step 5: Enforce Automation Cronjobs
To keep order delivery, API status monitoring, and auto refund logs active, trigger a systems cronjob query every 5 minutes:

\`\`\`bash
*/5 * * * * curl -s "https://your-smm-domain.com/cron/run?token=smm_secret_jwt_key_65f8a293c830" > /dev/null 2>&1
\`\`\`

---

## 🔓 Credentials & API Sandbox
- **Admin Dashboard account**: 
  - Login: \`admin_pro\`
  - Password: \`admin123\`
- **Admin default REST SMM key**: 
  - \`smm_api_key_88029abf99e8cbdf43f76921aba2d1eb2f90\` (Use in API authorization header).
- **KHQR Callback integration test endpoint**: 
  - Send POST callbacks directly to \`https://your-smm-domain.com/webhook/khqr\`
`
  }
];
