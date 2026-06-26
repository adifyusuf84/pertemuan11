<?php
// =============================================
// RESTful API - Manajemen Buku Perpustakaan
// =============================================

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/controllers/BukuController.php';

// Parse URL path
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/perpustakaan/api';
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');
$segments = explode('/', $path);

// Routing
$resource = $segments[0] ?? '';
$id = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;
$method = $_SERVER['REQUEST_METHOD'];

// Instantiate database & controller
$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    sendError('Koneksi database gagal. Pastikan konfigurasi database sudah benar.', 500);
}

$controller = new BukuController($conn);

// Route: /api/buku
if ($resource === 'buku') {
    switch ($method) {
        case 'GET':
            if ($id) {
                $controller->getById($id);
            } else {
                $controller->getAll();
            }
            break;
        case 'POST':
            $controller->create();
            break;
        case 'PUT':
            if (!$id) sendError('ID buku diperlukan untuk update.', 400);
            $controller->update($id);
            break;
        case 'DELETE':
            if (!$id) sendError('ID buku diperlukan untuk hapus.', 400);
            $controller->delete($id);
            break;
        default:
            sendError('Method tidak didukung.', 405);
    }
} else {
    // API Info
    sendSuccess('API Perpustakaan v1.0 - Selamat datang!', [
        'endpoints' => [
            'GET    /api/buku'       => 'Ambil semua buku (dengan filter & pagination)',
            'GET    /api/buku/{id}'  => 'Ambil buku berdasarkan ID',
            'POST   /api/buku'       => 'Tambah buku baru',
            'PUT    /api/buku/{id}'  => 'Update data buku',
            'DELETE /api/buku/{id}'  => 'Hapus buku',
        ],
        'query_params' => [
            'search'    => 'Cari buku berdasarkan judul/pengarang',
            'kategori'  => 'Filter berdasarkan kategori',
            'page'      => 'Nomor halaman (default: 1)',
            'limit'     => 'Jumlah item per halaman (default: 10)',
        ]
    ]);
}
?>
