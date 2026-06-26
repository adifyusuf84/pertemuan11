const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
    LevelFormat, PageNumber, Footer
} = require('docx');
const fs = require('fs');

// Color palette
const TEAL  = '1D6E6A';
const DARK  = '1A1714';
const MUTED = '6B6560';
const CREAM = 'F7F3EC';
const GREEN = '1E8449';
const RED   = 'C0392B';
const BLUE  = '1A5276';
const AMBER = 'B7770D';

const border = { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' };
const borders = { top: border, bottom: border, left: border, right: border };

const cellShade = (color) => ({ type: ShadingType.CLEAR, fill: color });

// Helper: Heading
function h1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text, color: TEAL, font: 'Arial', size: 36, bold: true })],
        spacing: { before: 400, after: 200 }
    });
}
function h2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text, color: DARK, font: 'Arial', size: 28, bold: true })],
        spacing: { before: 320, after: 160 }
    });
}
function h3(text) {
    return new Paragraph({
        children: [new TextRun({ text, color: DARK, font: 'Arial', size: 24, bold: true })],
        spacing: { before: 240, after: 120 }
    });
}
function para(text, opts = {}) {
    return new Paragraph({
        children: [new TextRun({ text, font: 'Arial', size: 22, color: opts.color || DARK, bold: opts.bold || false })],
        spacing: { before: 60, after: 60 },
        ...opts.para
    });
}
function code(text) {
    return new Paragraph({
        children: [new TextRun({ text, font: 'Courier New', size: 18, color: '2E4053' })],
        shading: { type: ShadingType.CLEAR, fill: 'F0F0F0' },
        spacing: { before: 40, after: 40 },
        indent: { left: 360 }
    });
}
function bullet(text) {
    return new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun({ text, font: 'Arial', size: 22 })],
        spacing: { before: 40, after: 40 }
    });
}
function divider() {
    return new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'DDDDDD', space: 1 } },
        children: [],
        spacing: { before: 200, after: 200 }
    });
}

// Helper: Table header row
function headerRow(cells, widths) {
    return new TableRow({
        tableHeader: true,
        children: cells.map((text, i) =>
            new TableCell({
                shading: cellShade(TEAL),
                width: { size: widths[i], type: WidthType.DXA },
                borders,
                children: [new Paragraph({
                    children: [new TextRun({ text, color: 'FFFFFF', font: 'Arial', size: 20, bold: true })],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 60, after: 60 }
                })]
            })
        )
    });
}

// Helper: Table data row
function dataRow(cells, widths, shade = 'FFFFFF') {
    return new TableRow({
        children: cells.map((text, i) =>
            new TableCell({
                shading: cellShade(shade),
                width: { size: widths[i], type: WidthType.DXA },
                borders,
                children: [new Paragraph({
                    children: [new TextRun({ text: String(text), font: 'Arial', size: 20, color: DARK })],
                    spacing: { before: 60, after: 60 }
                })]
            })
        )
    });
}

// Method badge style
function methodBadge(method) {
    const colors = { GET: GREEN, POST: BLUE, PUT: AMBER, DELETE: RED };
    return new TextRun({ text: ` ${method} `, bold: true, color: colors[method] || DARK, font: 'Arial', size: 22 });
}

// Endpoint section builder
function endpointSection(method, url, desc, params, requestBody, responseExample, notes = []) {
    const items = [];
    items.push(new Paragraph({
        children: [
            methodBadge(method),
            new TextRun({ text: `  ${url}`, font: 'Courier New', size: 22, color: '2C3E50' })
        ],
        spacing: { before: 200, after: 80 }
    }));
    items.push(para(desc, { color: MUTED }));

    if (params && params.length) {
        items.push(h3('Parameter'));
        const w = [1800, 1800, 1800, 3160];
        items.push(new Table({
            width: { size: 8560, type: WidthType.DXA },
            columnWidths: w,
            rows: [
                headerRow(['Nama', 'Tipe', 'Wajib', 'Deskripsi'], w),
                ...params.map((p, i) => dataRow(p, w, i % 2 === 0 ? CREAM : 'FFFFFF'))
            ]
        }));
    }

    if (requestBody) {
        items.push(h3('Contoh Request Body'));
        requestBody.forEach(line => items.push(code(line)));
    }

    if (responseExample) {
        items.push(h3('Contoh Response'));
        responseExample.forEach(line => items.push(code(line)));
    }

    if (notes.length) {
        items.push(h3('Catatan'));
        notes.forEach(n => items.push(bullet(n)));
    }

    items.push(divider());
    return items;
}

// =============================================
// BUILD DOCUMENT
// =============================================
const doc = new Document({
    styles: {
        default: {
            document: { run: { font: 'Arial', size: 22, color: DARK } }
        },
        paragraphStyles: [
            {
                id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 36, bold: true, font: 'Arial' },
                paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
            },
            {
                id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 28, bold: true, font: 'Arial' },
                paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 }
            }
        ]
    },
    numbering: {
        config: [
            {
                reference: 'bullets',
                levels: [{
                    level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }]
            },
            {
                reference: 'numbers',
                levels: [{
                    level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                }]
            }
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 11906, height: 16838 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
        },
        footers: {
            default: new Footer({
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: 'Dokumentasi API Perpustakaan Digital — Halaman ', font: 'Arial', size: 18, color: MUTED }),
                            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: MUTED }),
                            new TextRun({ text: ' dari ', font: 'Arial', size: 18, color: MUTED }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 18, color: MUTED }),
                        ]
                    })
                ]
            })
        },
        children: [
            // ─── COVER ───────────────────────────────────────────────
            new Paragraph({
                children: [new TextRun({ text: '📚', size: 120 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 1200, after: 200 }
            }),
            new Paragraph({
                children: [new TextRun({ text: 'Dokumentasi RESTful API', font: 'Arial', size: 56, bold: true, color: TEAL })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 160 }
            }),
            new Paragraph({
                children: [new TextRun({ text: 'Sistem Manajemen Buku Perpustakaan Digital', font: 'Arial', size: 32, color: MUTED })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 80 }
            }),
            new Paragraph({
                children: [new TextRun({ text: 'Dibangun dengan PHP Native (PDO) + Frontend Responsif', font: 'Arial', size: 24, color: MUTED, italics: true })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 400 }
            }),
            new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL } },
                children: [], spacing: { before: 200, after: 200 }
            }),

            // ─── BAB 1: RINGKASAN ────────────────────────────────────
            h1('1. Ringkasan Proyek'),
            para('Proyek ini merupakan aplikasi web sederhana untuk manajemen koleksi buku perpustakaan. Aplikasi dibangun menggunakan arsitektur RESTful API dengan PHP native (PDO) sebagai backend dan HTML/CSS/JavaScript murni sebagai frontend yang responsif.'),
            para(''),
            h2('Topik yang Dipilih'),
            para('Manajemen Buku Perpustakaan — Pengelolaan data koleksi buku mencakup operasi CRUD lengkap.'),

            h2('Teknologi yang Digunakan'),
            new Table({
                width: { size: 8560, type: WidthType.DXA },
                columnWidths: [3000, 5560],
                rows: [
                    headerRow(['Komponen', 'Teknologi'], [3000, 5560]),
                    dataRow(['Backend', 'PHP 8.x Native (tanpa framework)'], [3000, 5560], CREAM),
                    dataRow(['Database', 'MySQL dengan PDO (Prepared Statements)'], [3000, 5560]),
                    dataRow(['Frontend', 'HTML5, CSS3 (Media Query), JavaScript Vanilla'], [3000, 5560], CREAM),
                    dataRow(['Format Respons', 'JSON (UTF-8)'], [3000, 5560]),
                    dataRow(['HTTP Methods', 'GET, POST, PUT, DELETE'], [3000, 5560], CREAM),
                    dataRow(['Web Server', 'Apache + mod_rewrite (.htaccess)'], [3000, 5560]),
                ]
            }),
            divider(),

            // ─── BAB 2: BASIS DATA ───────────────────────────────────
            h1('2. Struktur Database'),
            para('Database: perpustakaan | Tabel: buku'),
            new Table({
                width: { size: 8560, type: WidthType.DXA },
                columnWidths: [1800, 1600, 1400, 3760],
                rows: [
                    headerRow(['Kolom', 'Tipe Data', 'Atribut', 'Keterangan'], [1800, 1600, 1400, 3760]),
                    dataRow(['id', 'INT', 'PK, AUTO', 'Identitas unik buku'], [1800, 1600, 1400, 3760], CREAM),
                    dataRow(['judul', 'VARCHAR(255)', 'NOT NULL', 'Judul buku'], [1800, 1600, 1400, 3760]),
                    dataRow(['pengarang', 'VARCHAR(150)', 'NOT NULL', 'Nama pengarang'], [1800, 1600, 1400, 3760], CREAM),
                    dataRow(['penerbit', 'VARCHAR(150)', 'NULL', 'Nama penerbit'], [1800, 1600, 1400, 3760]),
                    dataRow(['tahun_terbit', 'YEAR', 'NULL', 'Tahun penerbitan'], [1800, 1600, 1400, 3760], CREAM),
                    dataRow(['isbn', 'VARCHAR(20)', 'UNIQUE', 'Nomor ISBN buku'], [1800, 1600, 1400, 3760]),
                    dataRow(['kategori', 'VARCHAR(100)', 'NULL', 'Kategori / genre'], [1800, 1600, 1400, 3760], CREAM),
                    dataRow(['stok', 'INT', 'DEFAULT 1', 'Jumlah stok tersedia'], [1800, 1600, 1400, 3760]),
                    dataRow(['deskripsi', 'TEXT', 'NULL', 'Deskripsi singkat buku'], [1800, 1600, 1400, 3760], CREAM),
                    dataRow(['created_at', 'TIMESTAMP', 'AUTO', 'Waktu data dibuat'], [1800, 1600, 1400, 3760]),
                    dataRow(['updated_at', 'TIMESTAMP', 'AUTO', 'Waktu data diperbarui'], [1800, 1600, 1400, 3760], CREAM),
                ]
            }),
            divider(),

            // ─── BAB 3: BASE URL ─────────────────────────────────────
            h1('3. Informasi Dasar API'),
            new Table({
                width: { size: 8560, type: WidthType.DXA },
                columnWidths: [2400, 6160],
                rows: [
                    headerRow(['Properti', 'Nilai'], [2400, 6160]),
                    dataRow(['Base URL', 'http://localhost/perpustakaan/api'], [2400, 6160], CREAM),
                    dataRow(['Resource', '/buku'], [2400, 6160]),
                    dataRow(['Format', 'application/json'], [2400, 6160], CREAM),
                    dataRow(['Enkoding', 'UTF-8'], [2400, 6160]),
                    dataRow(['Auth', 'Tidak diperlukan (demo)'], [2400, 6160], CREAM),
                ]
            }),

            h2('Format Respons Standar'),
            para('Semua endpoint menggunakan format JSON yang konsisten:'),
            code('{'),
            code('  "success": true | false,'),
            code('  "message": "Keterangan hasil operasi",'),
            code('  "data": { ... }   // null jika tidak ada data'),
            code('}'),
            divider(),

            // ─── BAB 4: ENDPOINTS ────────────────────────────────────
            h1('4. Dokumentasi Endpoint'),

            // ── 4.1 GET ALL ──────────────────────────────────────────
            h2('4.1  Ambil Semua Buku'),
            ...endpointSection(
                'GET', '/api/buku',
                'Mengambil daftar semua buku dengan dukungan pencarian, filter kategori, dan pagination.',
                [
                    ['search', 'string', 'Tidak', 'Cari berdasarkan judul atau pengarang'],
                    ['kategori', 'string', 'Tidak', 'Filter berdasarkan kategori buku'],
                    ['page', 'integer', 'Tidak', 'Nomor halaman (default: 1)'],
                    ['limit', 'integer', 'Tidak', 'Jumlah item per halaman (default: 10, maks: 100)'],
                ],
                null,
                [
                    '{',
                    '  "success": true,',
                    '  "message": "Data buku berhasil diambil.",',
                    '  "data": {',
                    '    "buku": [',
                    '      {',
                    '        "id": 1,',
                    '        "judul": "Bumi Manusia",',
                    '        "pengarang": "Pramoedya Ananta Toer",',
                    '        "penerbit": "Hasta Mitra",',
                    '        "tahun_terbit": "1980",',
                    '        "isbn": "978-979-428-069-5",',
                    '        "kategori": "Novel",',
                    '        "stok": 3,',
                    '        "deskripsi": "Novel sejarah tentang Minke ...",',
                    '        "created_at": "2024-01-15 10:00:00",',
                    '        "updated_at": "2024-01-15 10:00:00"',
                    '      }',
                    '    ],',
                    '    "pagination": {',
                    '      "total": 25,',
                    '      "per_page": 10,',
                    '      "current_page": 1,',
                    '      "total_pages": 3',
                    '    }',
                    '  }',
                    '}',
                ],
                [
                    'Tanpa parameter: menampilkan semua buku halaman pertama.',
                    'Gunakan ?search=pramoedya untuk mencari nama pengarang.',
                    'Gunakan ?kategori=Novel&page=2&limit=5 untuk kombinasi filter.',
                ]
            ),

            // ── 4.2 GET BY ID ─────────────────────────────────────────
            h2('4.2  Ambil Buku Berdasarkan ID'),
            ...endpointSection(
                'GET', '/api/buku/{id}',
                'Mengambil detail satu buku berdasarkan ID uniknya.',
                [
                    ['id', 'integer', 'Ya (URL)', 'ID buku yang ingin diambil'],
                ],
                null,
                [
                    '{',
                    '  "success": true,',
                    '  "message": "Data buku berhasil diambil.",',
                    '  "data": {',
                    '    "id": 1,',
                    '    "judul": "Bumi Manusia",',
                    '    "pengarang": "Pramoedya Ananta Toer",',
                    '    "penerbit": "Hasta Mitra",',
                    '    "tahun_terbit": "1980",',
                    '    "isbn": "978-979-428-069-5",',
                    '    "kategori": "Novel",',
                    '    "stok": 3,',
                    '    "deskripsi": "Novel sejarah ...",',
                    '    "created_at": "2024-01-15 10:00:00",',
                    '    "updated_at": "2024-01-15 10:00:00"',
                    '  }',
                    '}',
                ],
                [
                    'Jika ID tidak ditemukan, server mengembalikan HTTP 404.',
                    'Contoh URL: GET http://localhost/perpustakaan/api/buku/1',
                ]
            ),

            // ── 4.3 POST ──────────────────────────────────────────────
            h2('4.3  Tambah Buku Baru'),
            ...endpointSection(
                'POST', '/api/buku',
                'Menambahkan data buku baru ke sistem. Field judul dan pengarang bersifat wajib.',
                [
                    ['judul', 'string', 'Ya', 'Judul buku (maks 255 karakter)'],
                    ['pengarang', 'string', 'Ya', 'Nama pengarang (maks 150 karakter)'],
                    ['penerbit', 'string', 'Tidak', 'Nama penerbit'],
                    ['tahun_terbit', 'integer', 'Tidak', 'Tahun terbit (1800 – 2099)'],
                    ['isbn', 'string', 'Tidak', 'ISBN unik buku'],
                    ['kategori', 'string', 'Tidak', 'Kategori / genre buku'],
                    ['stok', 'integer', 'Tidak', 'Jumlah stok (default: 1, min: 0)'],
                    ['deskripsi', 'string', 'Tidak', 'Deskripsi singkat buku'],
                ],
                [
                    '{',
                    '  "judul": "Clean Code",',
                    '  "pengarang": "Robert C. Martin",',
                    '  "penerbit": "Prentice Hall",',
                    '  "tahun_terbit": 2008,',
                    '  "isbn": "978-0-13-235088-4",',
                    '  "kategori": "Teknologi",',
                    '  "stok": 4,',
                    '  "deskripsi": "Panduan menulis kode yang bersih dan terstruktur."',
                    '}',
                ],
                [
                    '// HTTP 201 Created',
                    '{',
                    '  "success": true,',
                    '  "message": "Data buku berhasil diambil.",',
                    '  "data": {',
                    '    "id": 6,',
                    '    "judul": "Clean Code",',
                    '    "pengarang": "Robert C. Martin",',
                    '    ...',
                    '    "created_at": "2024-06-24 12:00:00"',
                    '  }',
                    '}',
                ],
                [
                    'Content-Type header harus: application/json.',
                    'ISBN harus unik; jika duplikat server mengembalikan HTTP 409.',
                    'Validasi gagal mengembalikan HTTP 422 beserta detail field yang salah.',
                ]
            ),

            // ── 4.4 PUT ───────────────────────────────────────────────
            h2('4.4  Update Data Buku'),
            ...endpointSection(
                'PUT', '/api/buku/{id}',
                'Memperbarui seluruh data buku berdasarkan ID. Semua field dikirim ulang (full update).',
                [
                    ['id', 'integer', 'Ya (URL)', 'ID buku yang akan diperbarui'],
                    ['judul', 'string', 'Ya', 'Judul baru buku'],
                    ['pengarang', 'string', 'Ya', 'Nama pengarang baru'],
                    ['... field lainnya', '', 'Tidak', 'Sama seperti POST'],
                ],
                [
                    'PUT /api/buku/6',
                    '{',
                    '  "judul": "Clean Code (Edisi Revisi)",',
                    '  "pengarang": "Robert C. Martin",',
                    '  "penerbit": "Prentice Hall",',
                    '  "tahun_terbit": 2020,',
                    '  "isbn": "978-0-13-235088-4",',
                    '  "kategori": "Teknologi",',
                    '  "stok": 5,',
                    '  "deskripsi": "Edisi diperbarui dengan tambahan bab."',
                    '}',
                ],
                [
                    '// HTTP 200 OK',
                    '{',
                    '  "success": true,',
                    '  "message": "Data buku berhasil diambil.",',
                    '  "data": {',
                    '    "id": 6,',
                    '    "judul": "Clean Code (Edisi Revisi)",',
                    '    "stok": 5,',
                    '    ...',
                    '    "updated_at": "2024-06-24 14:30:00"',
                    '  }',
                    '}',
                ],
                [
                    'Jika ID tidak ditemukan, server mengembalikan HTTP 404.',
                    'ISBN yang diperbarui tidak boleh sama dengan ISBN buku lain.',
                ]
            ),

            // ── 4.5 DELETE ────────────────────────────────────────────
            h2('4.5  Hapus Buku'),
            ...endpointSection(
                'DELETE', '/api/buku/{id}',
                'Menghapus data buku secara permanen dari database berdasarkan ID.',
                [
                    ['id', 'integer', 'Ya (URL)', 'ID buku yang akan dihapus'],
                ],
                null,
                [
                    '// HTTP 200 OK',
                    '{',
                    '  "success": true,',
                    '  "message": "Buku \'Bumi Manusia\' berhasil dihapus.",',
                    '  "data": {',
                    '    "deleted_id": 1,',
                    '    "deleted_buku": {',
                    '      "id": 1,',
                    '      "judul": "Bumi Manusia",',
                    '      "pengarang": "Pramoedya Ananta Toer",',
                    '      ...',
                    '    }',
                    '  }',
                    '}',
                ],
                [
                    'Tindakan ini tidak dapat dibatalkan.',
                    'Jika ID tidak ada, server mengembalikan HTTP 404.',
                    'Contoh URL: DELETE http://localhost/perpustakaan/api/buku/1',
                ]
            ),

            // ─── BAB 5: HTTP STATUS ───────────────────────────────────
            h1('5. Kode Status HTTP'),
            new Table({
                width: { size: 8560, type: WidthType.DXA },
                columnWidths: [1400, 2000, 5160],
                rows: [
                    headerRow(['Kode', 'Status', 'Keterangan'], [1400, 2000, 5160]),
                    dataRow(['200', 'OK', 'Permintaan berhasil (GET, PUT, DELETE)'], [1400, 2000, 5160], CREAM),
                    dataRow(['201', 'Created', 'Data baru berhasil dibuat (POST)'], [1400, 2000, 5160]),
                    dataRow(['400', 'Bad Request', 'Request tidak valid / format JSON salah'], [1400, 2000, 5160], CREAM),
                    dataRow(['404', 'Not Found', 'Data dengan ID tersebut tidak ditemukan'], [1400, 2000, 5160]),
                    dataRow(['405', 'Method Not Allowed', 'HTTP method tidak didukung endpoint ini'], [1400, 2000, 5160], CREAM),
                    dataRow(['409', 'Conflict', 'Konflik data (ISBN duplikat)'], [1400, 2000, 5160]),
                    dataRow(['422', 'Unprocessable', 'Validasi input gagal (field wajib kosong, dll.)'], [1400, 2000, 5160], CREAM),
                    dataRow(['500', 'Server Error', 'Kesalahan internal server / koneksi database'], [1400, 2000, 5160]),
                ]
            }),
            divider(),

            // ─── BAB 6: VALIDASI ──────────────────────────────────────
            h1('6. Validasi Input & Keamanan'),
            h2('Aturan Validasi'),
            new Table({
                width: { size: 8560, type: WidthType.DXA },
                columnWidths: [2000, 6560],
                rows: [
                    headerRow(['Field', 'Aturan Validasi'], [2000, 6560]),
                    dataRow(['judul', 'Wajib diisi, maksimal 255 karakter'], [2000, 6560], CREAM),
                    dataRow(['pengarang', 'Wajib diisi, maksimal 150 karakter'], [2000, 6560]),
                    dataRow(['stok', 'Opsional, harus berupa angka, minimal 0'], [2000, 6560], CREAM),
                    dataRow(['isbn', 'Opsional, harus unik di seluruh tabel buku'], [2000, 6560]),
                    dataRow(['tahun_terbit', 'Opsional, format YEAR MySQL'], [2000, 6560], CREAM),
                ]
            }),
            h2('Keamanan'),
            bullet('Semua query database menggunakan Prepared Statement (PDO) untuk mencegah SQL Injection.'),
            bullet('Input teks di-trim() sebelum disimpan ke database.'),
            bullet('Output JSON di-escape menggunakan JSON_UNESCAPED_UNICODE untuk karakter Indonesia.'),
            bullet('Header CORS dikonfigurasi untuk mendukung akses dari frontend.'),
            bullet('ID pada URL divalidasi sebagai integer sebelum diproses controller.'),
            divider(),

            // ─── BAB 7: FRONTEND ──────────────────────────────────────
            h1('7. Frontend Responsif'),
            h2('Breakpoint Media Query'),
            new Table({
                width: { size: 8560, type: WidthType.DXA },
                columnWidths: [2400, 2400, 3760],
                rows: [
                    headerRow(['Perangkat', 'Lebar Layar', 'Tampilan Grid'], [2400, 2400, 3760]),
                    dataRow(['Desktop', '≥ 1100px', '3 kolom buku per baris'], [2400, 2400, 3760], CREAM),
                    dataRow(['Tablet', '768px – 1099px', '2 kolom buku per baris'], [2400, 2400, 3760]),
                    dataRow(['Mobile', '≤ 480px', '1 kolom buku (full width)'], [2400, 2400, 3760], CREAM),
                ]
            }),
            h2('Fitur Frontend'),
            bullet('Pencarian real-time dengan debounce 450ms untuk efisiensi request.'),
            bullet('Filter berdasarkan kategori buku.'),
            bullet('Pagination dinamis untuk navigasi antar halaman data.'),
            bullet('Modal form untuk tambah dan edit buku.'),
            bullet('Modal konfirmasi sebelum menghapus data.'),
            bullet('Toast notification untuk feedback sukses/error.'),
            bullet('Loading bar indikator saat request API berlangsung.'),
            bullet('Skeleton loading saat data pertama kali dimuat.'),
            bullet('Keyboard shortcut: Escape untuk menutup modal.'),
            divider(),

            // ─── BAB 8: INSTALASI ─────────────────────────────────────
            h1('8. Panduan Instalasi'),
            h2('Prasyarat'),
            bullet('XAMPP / Laragon / WAMP dengan PHP 7.4+ dan MySQL 5.7+'),
            bullet('Apache mod_rewrite aktif'),
            bullet('Browser modern (Chrome, Firefox, Edge, Safari)'),
            h2('Langkah Instalasi'),
            new Paragraph({
                numbering: { reference: 'numbers', level: 0 },
                children: [new TextRun({ text: 'Salin folder perpustakaan/ ke direktori htdocs/ (XAMPP) atau www/ (Laragon).', font: 'Arial', size: 22 })],
                spacing: { before: 60, after: 60 }
            }),
            new Paragraph({
                numbering: { reference: 'numbers', level: 0 },
                children: [new TextRun({ text: 'Buka phpMyAdmin dan jalankan file perpustakaan/api/config/database.sql.', font: 'Arial', size: 22 })],
                spacing: { before: 60, after: 60 }
            }),
            new Paragraph({
                numbering: { reference: 'numbers', level: 0 },
                children: [new TextRun({ text: 'Sesuaikan konfigurasi di perpustakaan/api/config/database.php (host, username, password).', font: 'Arial', size: 22 })],
                spacing: { before: 60, after: 60 }
            }),
            new Paragraph({
                numbering: { reference: 'numbers', level: 0 },
                children: [new TextRun({ text: 'Pastikan mod_rewrite Apache aktif (AllowOverride All di httpd.conf).', font: 'Arial', size: 22 })],
                spacing: { before: 60, after: 60 }
            }),
            new Paragraph({
                numbering: { reference: 'numbers', level: 0 },
                children: [new TextRun({ text: 'Buka browser dan akses http://localhost/perpustakaan/frontend/index.html', font: 'Arial', size: 22 })],
                spacing: { before: 60, after: 60 }
            }),
            new Paragraph({
                numbering: { reference: 'numbers', level: 0 },
                children: [new TextRun({ text: 'Tes API langsung di browser: http://localhost/perpustakaan/api/buku', font: 'Arial', size: 22 })],
                spacing: { before: 60, after: 60 }
            }),
            divider(),

            // ─── FOOTER ───────────────────────────────────────────────
            new Paragraph({
                children: [new TextRun({
                    text: 'Dokumentasi ini dibuat untuk tugas mahasiswa — Pemrograman Web | RESTful API + Frontend Responsif',
                    font: 'Arial', size: 18, color: MUTED, italics: true
                })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 }
            }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('/mnt/user-data/outputs/Dokumentasi_API_Perpustakaan.docx', buffer);
    console.log('✅ Dokumentasi berhasil dibuat!');
}).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
