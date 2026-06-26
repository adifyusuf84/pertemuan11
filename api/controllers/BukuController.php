<?php
require_once __DIR__ . '/../helpers/response.php';

class BukuController {
    private $conn;
    private $table = 'buku';

    public function __construct($conn) {
        $this->conn = $conn;
    }

    // =============================================
    // GET /api/buku — Ambil semua buku
    // Mendukung: ?search=, ?kategori=, ?page=, ?limit=
    // =============================================
    public function getAll() {
        $search   = isset($_GET['search'])   ? trim($_GET['search'])   : '';
        $kategori = isset($_GET['kategori']) ? trim($_GET['kategori']) : '';
        $page     = isset($_GET['page'])     ? max(1, (int)$_GET['page'])  : 1;
        $limit    = isset($_GET['limit'])    ? min(100, max(1, (int)$_GET['limit'])) : 10;
        $offset   = ($page - 1) * $limit;

        $where = [];
        $params = [];

        if ($search !== '') {
            $where[] = "(judul LIKE :search OR pengarang LIKE :search2)";
            $params[':search']  = '%' . $search . '%';
            $params[':search2'] = '%' . $search . '%';
        }
        if ($kategori !== '') {
            $where[] = "kategori = :kategori";
            $params[':kategori'] = $kategori;
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        // Count total
        $countSql = "SELECT COUNT(*) as total FROM {$this->table} $whereClause";
        $countStmt = $this->conn->prepare($countSql);
        foreach ($params as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetch()['total'];

        // Fetch data
        $sql = "SELECT * FROM {$this->table} $whereClause ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->conn->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $buku = $stmt->fetchAll();

        sendSuccess('Data buku berhasil diambil.', [
            'buku'       => $buku,
            'pagination' => [
                'total'        => $total,
                'per_page'     => $limit,
                'current_page' => $page,
                'total_pages'  => ceil($total / $limit),
            ]
        ]);
    }

    // =============================================
    // GET /api/buku/{id} — Ambil buku by ID
    // =============================================
    public function getById($id) {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $buku = $stmt->fetch();

        if (!$buku) {
            sendError("Buku dengan ID $id tidak ditemukan.", 404);
        }

        sendSuccess('Data buku berhasil diambil.', $buku);
    }

    // =============================================
    // POST /api/buku — Tambah buku baru
    // =============================================
    public function create() {
        $input = $this->getJsonInput();

        // Validasi
        $errors = validateInput($input, [
            'judul'      => 'required|max:255',
            'pengarang'  => 'required|max:150',
            'stok'       => 'numeric|min:0',
        ]);

        if (!empty($errors)) {
            sendError('Validasi gagal.', 422, $errors);
        }

        // Cek ISBN duplikat jika diisi
        if (!empty($input['isbn'])) {
            $cek = $this->conn->prepare("SELECT id FROM {$this->table} WHERE isbn = :isbn LIMIT 1");
            $cek->bindValue(':isbn', trim($input['isbn']));
            $cek->execute();
            if ($cek->fetch()) {
                sendError('ISBN sudah terdaftar di sistem.', 409);
            }
        }

        $sql = "INSERT INTO {$this->table} 
                (judul, pengarang, penerbit, tahun_terbit, isbn, kategori, stok, deskripsi)
                VALUES 
                (:judul, :pengarang, :penerbit, :tahun_terbit, :isbn, :kategori, :stok, :deskripsi)";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':judul',       trim($input['judul']));
        $stmt->bindValue(':pengarang',   trim($input['pengarang']));
        $stmt->bindValue(':penerbit',    trim($input['penerbit']    ?? ''));
        $stmt->bindValue(':tahun_terbit',!empty($input['tahun_terbit']) ? (int)$input['tahun_terbit'] : null, PDO::PARAM_INT);
        $stmt->bindValue(':isbn',        trim($input['isbn']        ?? ''));
        $stmt->bindValue(':kategori',    trim($input['kategori']    ?? ''));
        $stmt->bindValue(':stok',        isset($input['stok']) ? (int)$input['stok'] : 1, PDO::PARAM_INT);
        $stmt->bindValue(':deskripsi',   trim($input['deskripsi']   ?? ''));
        $stmt->execute();

        $newId = (int)$this->conn->lastInsertId();
        $this->getById($newId); // return data baru dengan sendSuccess di dalam
    }

    // =============================================
    // PUT /api/buku/{id} — Update buku
    // =============================================
    public function update($id) {
        // Cek buku ada
        $check = $this->conn->prepare("SELECT id FROM {$this->table} WHERE id = :id LIMIT 1");
        $check->bindValue(':id', $id, PDO::PARAM_INT);
        $check->execute();
        if (!$check->fetch()) {
            sendError("Buku dengan ID $id tidak ditemukan.", 404);
        }

        $input = $this->getJsonInput();

        $errors = validateInput($input, [
            'judul'     => 'required|max:255',
            'pengarang' => 'required|max:150',
            'stok'      => 'numeric|min:0',
        ]);

        if (!empty($errors)) {
            sendError('Validasi gagal.', 422, $errors);
        }

        // Cek ISBN duplikat (exclude current id)
        if (!empty($input['isbn'])) {
            $cek = $this->conn->prepare("SELECT id FROM {$this->table} WHERE isbn = :isbn AND id != :id LIMIT 1");
            $cek->bindValue(':isbn', trim($input['isbn']));
            $cek->bindValue(':id', $id, PDO::PARAM_INT);
            $cek->execute();
            if ($cek->fetch()) {
                sendError('ISBN sudah digunakan oleh buku lain.', 409);
            }
        }

        $sql = "UPDATE {$this->table} SET
                    judul        = :judul,
                    pengarang    = :pengarang,
                    penerbit     = :penerbit,
                    tahun_terbit = :tahun_terbit,
                    isbn         = :isbn,
                    kategori     = :kategori,
                    stok         = :stok,
                    deskripsi    = :deskripsi
                WHERE id = :id";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':judul',       trim($input['judul']));
        $stmt->bindValue(':pengarang',   trim($input['pengarang']));
        $stmt->bindValue(':penerbit',    trim($input['penerbit']    ?? ''));
        $stmt->bindValue(':tahun_terbit',!empty($input['tahun_terbit']) ? (int)$input['tahun_terbit'] : null, PDO::PARAM_INT);
        $stmt->bindValue(':isbn',        trim($input['isbn']        ?? ''));
        $stmt->bindValue(':kategori',    trim($input['kategori']    ?? ''));
        $stmt->bindValue(':stok',        isset($input['stok']) ? (int)$input['stok'] : 1, PDO::PARAM_INT);
        $stmt->bindValue(':deskripsi',   trim($input['deskripsi']   ?? ''));
        $stmt->bindValue(':id',          $id, PDO::PARAM_INT);
        $stmt->execute();

        $this->getById($id);
    }

    // =============================================
    // DELETE /api/buku/{id} — Hapus buku
    // =============================================
    public function delete($id) {
        $check = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = :id LIMIT 1");
        $check->bindValue(':id', $id, PDO::PARAM_INT);
        $check->execute();
        $buku = $check->fetch();

        if (!$buku) {
            sendError("Buku dengan ID $id tidak ditemukan.", 404);
        }

        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        sendSuccess("Buku '{$buku['judul']}' berhasil dihapus.", [
            'deleted_id'   => $id,
            'deleted_buku' => $buku
        ]);
    }

    // =============================================
    // Helper: Ambil input JSON dari request body
    // =============================================
    private function getJsonInput() {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            // Fallback ke $_POST untuk form-data
            return $_POST;
        }
        $data = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('Format JSON tidak valid: ' . json_last_error_msg(), 400);
        }
        return $data ?? [];
    }
}
?>
