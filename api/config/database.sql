-- =============================================
-- Database: perpustakaan
-- Topik: Manajemen Buku Perpustakaan
-- =============================================

CREATE DATABASE IF NOT EXISTS perpustakaan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE perpustakaan;

-- Tabel buku
CREATE TABLE IF NOT EXISTS buku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    pengarang VARCHAR(150) NOT NULL,
    penerbit VARCHAR(150),
    tahun_terbit YEAR,
    isbn VARCHAR(20) UNIQUE,
    kategori VARCHAR(100),
    stok INT DEFAULT 1,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Data awal (opsional)
INSERT INTO buku (judul, pengarang, penerbit, tahun_terbit, isbn, kategori, stok, deskripsi) VALUES
('Bumi Manusia', 'Pramoedya Ananta Toer', 'Hasta Mitra', 1980, '978-979-428-069-5', 'Novel', 3, 'Novel sejarah tentang Minke dan kisah cintanya di era kolonial Belanda.'),
('Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 2005, '978-979-1227-00-2', 'Novel', 5, 'Kisah inspiratif 10 anak Belitung yang berjuang mendapatkan pendidikan.'),
('Pemrograman Web dengan PHP', 'Betha Sidik', 'Informatika', 2017, '978-602-1514-93-1', 'Teknologi', 4, 'Panduan lengkap pemrograman web menggunakan PHP modern.'),
('Algoritma dan Pemrograman', 'Rinaldi Munir', 'Informatika', 2016, '978-602-1514-77-1', 'Teknologi', 2, 'Buku referensi algoritma dan struktur data.'),
('Filosofi Teras', 'Henry Manampiring', 'Kompas', 2018, '978-979-709-955-3', 'Filsafat', 6, 'Filsafat Stoisisme untuk kehidupan modern.');
