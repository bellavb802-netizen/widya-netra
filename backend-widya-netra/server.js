const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { promisify } = require('util');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const scrypt = promisify(crypto.scrypt);
const SESSION_COOKIE = 'widya_netra_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const localFrontendOrigins = new Set(
  Object.values(os.networkInterfaces())
    .flat()
    .filter((networkInterface) => networkInterface && !networkInterface.internal && networkInterface.family === 'IPv4')
    .map((networkInterface) => `http://${networkInterface.address}:5173`)
);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const configuredOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
    const isLoopbackOrigin = /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin || '');
    callback(null, !origin || origin === configuredOrigin || isLoopbackOrigin || localFrontendOrigins.has(origin));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Folder static untuk akses file unggahan (Cover & PDF)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const hashToken = (value) => crypto.createHash('sha256').update(value).digest('hex');
const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  nama_lengkap: user.nama_lengkap,
  role: user.role,
});

const verifyPassword = async (password, storedHash) => {
  const [salt, savedKey] = String(storedHash || '').split(':');
  if (!salt || !savedKey) return false;
  const key = await scrypt(password, salt, 64);
  const savedBuffer = Buffer.from(savedKey, 'hex');
  return savedBuffer.length === key.length && crypto.timingSafeEqual(key, savedBuffer);
};

const verifyUserPassword = async (password, storedPassword) => {
  const storedValue = String(storedPassword || '');
  if (/^[a-f\d]{32}:[a-f\d]{128}$/i.test(storedValue)) {
    return verifyPassword(password, storedValue);
  }

  const submittedBuffer = Buffer.from(password);
  const storedBuffer = Buffer.from(storedValue);
  return submittedBuffer.length === storedBuffer.length &&
    crypto.timingSafeEqual(submittedBuffer, storedBuffer);
};

const createSession = async (userId, res) => {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  await db.query(
    'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
    [userId, hashToken(sessionToken)]
  );
  res.cookie(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: SESSION_TTL_MS,
  });
};

const getSessionUser = async (req) => {
  const cookies = Object.fromEntries(
    (req.headers.cookie || '').split(';').filter(Boolean).map((part) => {
      const separator = part.indexOf('=');
      return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())];
    })
  );
  const sessionToken = cookies[SESSION_COOKIE];
  if (!sessionToken) return null;
  const [users] = await db.query(
    `SELECT u.id, u.username, u.nama_lengkap, u.role
     FROM auth_sessions s JOIN pengguna u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > NOW()`,
    [hashToken(sessionToken)]
  );
  return users[0] || null;
};

const requireAuth = async (req, res, next) => {
  try {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Sesi tidak valid. Silakan masuk kembali.' });
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const initializeAuthTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX auth_sessions_user (user_id),
      CONSTRAINT auth_sessions_pengguna_fk FOREIGN KEY (user_id) REFERENCES pengguna(id) ON DELETE CASCADE
    )
  `);

  const [sessionForeignKeys] = await db.query(`
    SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'auth_sessions'
      AND COLUMN_NAME = 'user_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `);

  const hasPenggunaForeignKey = sessionForeignKeys.some(
    (foreignKey) => foreignKey.REFERENCED_TABLE_NAME === 'pengguna'
  );
  if (!hasPenggunaForeignKey) {
    await db.query('DELETE FROM auth_sessions');
    for (const foreignKey of sessionForeignKeys) {
      const constraint = String(foreignKey.CONSTRAINT_NAME).replace(/`/g, '``');
      await db.query(`ALTER TABLE \`auth_sessions\` DROP FOREIGN KEY \`${constraint}\``);
    }
    await db.query('ALTER TABLE auth_sessions MODIFY COLUMN user_id INT NOT NULL');
    await db.query(
      `ALTER TABLE auth_sessions ADD CONSTRAINT auth_sessions_pengguna_fk
       FOREIGN KEY (user_id) REFERENCES pengguna(id) ON DELETE CASCADE`
    );
  }
};

const initializeSettingsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS pengaturan (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      nama_instansi VARCHAR(255) NOT NULL,
      nama_aplikasi VARCHAR(100) NOT NULL,
      alamat TEXT NULL,
      email VARCHAR(255) NULL,
      no_telp VARCHAR(50) NULL,
      kepala_perpustakaan VARCHAR(255) NULL,
      nip_kepala VARCHAR(50) NULL,
      logo_url TEXT NULL,
      denda_per_hari DECIMAL(10, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const initializeMemberPhotoColumn = async () => {
  const [columns] = await db.query("SHOW COLUMNS FROM anggota LIKE 'foto_url'");
  if (columns.length === 0) {
    await db.query('ALTER TABLE anggota ADD COLUMN foto_url VARCHAR(500) NULL');
  }
};

app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' });
  }
  try {
    const [[user]] = await db.query(
      'SELECT id, username, password, nama_lengkap, role FROM pengguna WHERE username = ? LIMIT 1',
      [username]
    );
    if (!user || !(await verifyUserPassword(password, user.password))) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }
    await createSession(user.id, res);
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const sessionToken = (req.headers.cookie || '').split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1);
    if (sessionToken) {
      await db.query('DELETE FROM auth_sessions WHERE token_hash = ?', [hashToken(decodeURIComponent(sessionToken))]);
    }
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', path: '/api' });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Sesi tidak valid.' });
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/forgot-password', (_req, res) => {
  res.status(501).json({
    error: 'Reset password belum tersedia untuk tabel pengguna. Hubungi administrator.',
  });
});

app.post('/api/auth/reset-password', (_req, res) => {
  res.status(501).json({
    error: 'Reset password belum tersedia untuk tabel pengguna. Hubungi administrator.',
  });
});

app.use('/api', async (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next();
  if (
    (req.method === 'GET' && ['/buku', '/statistik/publik'].includes(req.path)) ||
    (req.method === 'POST' && req.path === '/pengunjung') ||
    (req.method === 'GET' && /^\/anggota\/\d+$/.test(req.path))
  ) {
    return next();
  }
  requireAuth(req, res, next);
});
// Konfigurasi Multer untuk Upload File
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = path.join(__dirname, 'uploads', 'others');
    if (file.fieldname === 'cover_buku') dest = path.join(__dirname, 'uploads', 'covers');
    else if (file.fieldname === 'file_buku') dest = path.join(__dirname, 'uploads', 'pdfs');
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const uploadPath = (file) => file ? `/uploads/${path.basename(path.dirname(file.path))}/${path.basename(file.path)}` : null;

const addUpdateAndDeleteRoutes = (route, table, allowedFields) => {
  app.put(`/api/${route}/:id`, async (req, res) => {
    const updates = Object.entries(req.body)
      .filter(([field, value]) => allowedFields.includes(field) && value !== undefined)
      .map(([field]) => `\`${field}\` = ?`);
    const values = Object.entries(req.body)
      .filter(([field, value]) => allowedFields.includes(field) && value !== undefined)
      .map(([, value]) => value);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Tidak ada kolom valid untuk diperbarui' });
    }

    try {
      const [result] = await db.query(
        `UPDATE \`${table}\` SET ${updates.join(', ')} WHERE id = ?`,
        [...values, req.params.id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
      const [rows] = await db.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [req.params.id]);
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete(`/api/${route}/:id`, async (req, res) => {
    try {
      const [result] = await db.query(`DELETE FROM \`${table}\` WHERE id = ?`, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

// ==========================================
// 1. ENDPOINT: BIDANG
// ==========================================
app.get('/api/bidang', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bidang ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bidang', async (req, res) => {
  const { nama_bidang, kode, kepala_bidang, deskripsi } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO bidang (nama_bidang, kode, kepala_bidang, deskripsi) VALUES (?, ?, ?, ?)',
      [nama_bidang, kode, kepala_bidang, deskripsi]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
addUpdateAndDeleteRoutes('bidang', 'bidang', ['nama_bidang', 'kode', 'kepala_bidang', 'deskripsi']);

// ==========================================
// 2. ENDPOINT: DATA BUKU
// ==========================================
app.get('/api/buku', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM buku ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/buku', upload.fields([
  { name: 'cover_buku', maxCount: 1 },
  { name: 'file_buku', maxCount: 1 }
]), async (req, res) => {
  const {
    judul_buku, penulis, penerbit, tahun_terbit,
    kode_ddc, kategori, no_isbn, jumlah_eksemplar,
    tersedia, lokasi_rak, deskripsi
  } = req.body;

  const cover_buku = req.files && req.files['cover_buku'] ? uploadPath(req.files['cover_buku'][0]) : null;
  const file_buku = req.files && req.files['file_buku'] ? uploadPath(req.files['file_buku'][0]) : null;

  try {
    const [result] = await db.query(
      `INSERT INTO buku 
      (judul_buku, penulis, penerbit, tahun_terbit, kode_ddc, kategori, no_isbn, jumlah_eksemplar, tersedia, lokasi_rak, cover_buku, file_buku, deskripsi) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        judul_buku, penulis, penerbit, tahun_terbit,
        kode_ddc, kategori, no_isbn, jumlah_eksemplar ?? 1,
        tersedia ?? jumlah_eksemplar ?? 1, lokasi_rak, cover_buku, file_buku, deskripsi
      ]
    );
    res.status(201).json({ id: result.insertId, ...req.body, cover_buku, file_buku });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/buku/:id', upload.fields([
  { name: 'cover_buku', maxCount: 1 },
  { name: 'file_buku', maxCount: 1 }
]), async (req, res) => {
  const fields = [
    'judul_buku', 'penulis', 'penerbit', 'tahun_terbit', 'kode_ddc', 'kategori',
    'no_isbn', 'jumlah_eksemplar', 'tersedia', 'lokasi_rak', 'deskripsi'
  ];
  const updates = {};
  fields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (req.files?.cover_buku?.[0]) updates.cover_buku = uploadPath(req.files.cover_buku[0]);
  else if (req.body.cover_buku !== undefined) updates.cover_buku = req.body.cover_buku;
  if (req.files?.file_buku?.[0]) updates.file_buku = uploadPath(req.files.file_buku[0]);
  else if (req.body.file_buku !== undefined) updates.file_buku = req.body.file_buku;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Tidak ada kolom valid untuk diperbarui' });
  }
  try {
    const [result] = await db.query(
      'UPDATE buku SET ? WHERE id = ?',
      [updates, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Buku tidak ditemukan' });
    const [rows] = await db.query('SELECT * FROM buku WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/buku/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM buku WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Buku tidak ditemukan' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ENDPOINT: DATA ANGGOTA
// ==========================================
app.get('/api/anggota', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, b.nama_bidang 
      FROM anggota a 
      LEFT JOIN bidang b ON a.id_bidang = b.id 
      ORDER BY a.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/anggota/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama_lengkap, jabatan FROM anggota WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Anggota tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/anggota', async (req, res) => {
  const {
    nama_lengkap, nip, jabatan, id_bidang,
    no_telepon, email, tanggal_daftar, status, alamat
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO anggota 
      (nama_lengkap, nip, jabatan, id_bidang, no_telepon, email, tanggal_daftar, status, alamat) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nama_lengkap, nip, jabatan, id_bidang || null, no_telepon, email, tanggal_daftar, status || 'Aktif', alamat]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
addUpdateAndDeleteRoutes('anggota', 'anggota', [
  'nama_lengkap', 'nip', 'jabatan', 'id_bidang', 'no_telepon', 'email',
  'tanggal_daftar', 'status', 'alamat', 'foto_url'
]);
app.post('/api/anggota/:id/foto', upload.single('foto_anggota'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File foto wajib diunggah' });
  try {
    const foto_url = uploadPath(req.file);
    const [result] = await db.query('UPDATE anggota SET foto_url = ? WHERE id = ?', [foto_url, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Anggota tidak ditemukan' });
    res.json({ foto_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. ENDPOINT: DATA PENGUNJUNG
// ==========================================
app.get('/api/pengunjung', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pengunjung ORDER BY waktu_checkin DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pengunjung', async (req, res) => {
  const { nama_lengkap, asal_instansi, no_hp, tujuan_kunjungan } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO pengunjung (nama_lengkap, asal_instansi, no_hp, tujuan_kunjungan) VALUES (?, ?, ?, ?)',
      [nama_lengkap, asal_instansi, no_hp, tujuan_kunjungan]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
addUpdateAndDeleteRoutes('pengunjung', 'pengunjung', [
  'nama_lengkap', 'asal_instansi', 'no_hp', 'tujuan_kunjungan'
]);

// ==========================================
// 4a. ENDPOINT: PENGATURAN
// ==========================================
app.get('/api/pengaturan', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pengaturan ORDER BY id DESC LIMIT 10');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pengaturan', async (req, res) => {
  const { nama_instansi, nama_aplikasi, denda_per_hari } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO pengaturan (nama_instansi, nama_aplikasi, denda_per_hari) VALUES (?, ?, ?)',
      [nama_instansi, nama_aplikasi, denda_per_hari]
    );
    const [rows] = await db.query('SELECT * FROM pengaturan WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
addUpdateAndDeleteRoutes('pengaturan', 'pengaturan', [
  'nama_instansi', 'nama_aplikasi', 'alamat', 'email', 'no_telp',
  'kepala_perpustakaan', 'nip_kepala', 'logo_url', 'denda_per_hari'
]);

// ==========================================
// 5. ENDPOINT: TRANSAKSI (PINJAM BUKU)
// ==========================================
app.get('/api/transaksi', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.*, 
        t.tanggal_kembali AS kembali_aktual,
        a.nama_lengkap AS nama_anggota, 
        b.judul_buku 
      FROM transaksi t
      JOIN anggota a ON t.id_anggota = a.id
      JOIN buku b ON t.id_buku = b.id
      ORDER BY t.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transaksi', async (req, res) => {
  const { id_anggota, id_buku, tanggal_pinjam, kembali_rencana, catatan } = req.body;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [stock] = await connection.query(
      'UPDATE buku SET tersedia = tersedia - 1 WHERE id = ? AND tersedia > 0',
      [id_buku]
    );
    if (stock.affectedRows === 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Stok buku tidak tersedia' });
    }
    const [result] = await connection.query(
      'INSERT INTO transaksi (id_anggota, id_buku, tanggal_pinjam, kembali_rencana, catatan) VALUES (?, ?, ?, ?, ?)',
      [id_anggota, id_buku, tanggal_pinjam, kembali_rencana, catatan]
    );
    await connection.commit();
    res.status(201).json({ id: result.insertId, message: 'Transaksi peminjaman berhasil dicatat' });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});
app.put('/api/transaksi/:id', async (req, res) => {
  const fieldMap = {
    id_anggota: 'id_anggota',
    id_buku: 'id_buku',
    tanggal_pinjam: 'tanggal_pinjam',
    kembali_rencana: 'kembali_rencana',
    kembali_aktual: 'tanggal_kembali',
    status: 'status',
    catatan: 'catatan',
  };
  const updates = Object.fromEntries(
    Object.entries(req.body)
      .filter(([field, value]) => fieldMap[field] && value !== undefined)
      .map(([field, value]) => [fieldMap[field], value])
  );
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Tidak ada kolom valid untuk diperbarui' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [[current]] = await connection.query('SELECT * FROM transaksi WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!current) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    const nextStatus = updates.status || current.status;
    const nextBookId = updates.id_buku || current.id_buku;
    if (current.status === 'dipinjam' && (nextStatus !== 'dipinjam' || Number(nextBookId) !== Number(current.id_buku))) {
      await connection.query('UPDATE buku SET tersedia = tersedia + 1 WHERE id = ?', [current.id_buku]);
    }
    if (nextStatus === 'dipinjam' && (current.status !== 'dipinjam' || Number(nextBookId) !== Number(current.id_buku))) {
      const [stock] = await connection.query(
        'UPDATE buku SET tersedia = tersedia - 1 WHERE id = ? AND tersedia > 0',
        [nextBookId]
      );
      if (stock.affectedRows === 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Stok buku tidak tersedia' });
      }
    }

    const columns = Object.keys(updates).map((field) => `\`${field}\` = ?`);
    await connection.query(
      `UPDATE transaksi SET ${columns.join(', ')} WHERE id = ?`,
      [...Object.values(updates), req.params.id]
    );
    const [[updated]] = await connection.query(
      'SELECT t.*, t.tanggal_kembali AS kembali_aktual FROM transaksi t WHERE t.id = ?',
      [req.params.id]
    );
    await connection.commit();
    res.json(updated);
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});
app.delete('/api/transaksi/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [[current]] = await connection.query('SELECT * FROM transaksi WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!current) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }
    if (current.status === 'dipinjam') {
      await connection.query('UPDATE buku SET tersedia = tersedia + 1 WHERE id = ?', [current.id_buku]);
    }
    await connection.query('DELETE FROM transaksi WHERE id = ?', [req.params.id]);
    await connection.commit();
    res.status(204).end();
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// ==========================================
// 6. ENDPOINT DASHBOARD & RINGKASAN DATA
// ==========================================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [[totalBuku]] = await db.query('SELECT SUM(jumlah_eksemplar) AS total_koleksi FROM buku');
    const [[anggotaAktif]] = await db.query('SELECT COUNT(id) AS total_anggota FROM anggota WHERE status = "Aktif"');
    const [[peminjamanBerjalan]] = await db.query('SELECT COUNT(id) AS total_dipinjam FROM transaksi WHERE status = "dipinjam"');
    const [[jatuhTempo]] = await db.query('SELECT COUNT(id) AS total_jatuh_tempo FROM transaksi WHERE status = "dipinjam" AND kembali_rencana < CURRENT_DATE()');

    res.json({
      total_koleksi_buku: totalBuku.total_koleksi || 0,
      anggota_aktif: anggotaAktif.total_anggota || 0,
      peminjaman_berjalan: peminjamanBerjalan.total_dipinjam || 0,
      jatuh_tempo: jatuhTempo.total_jatuh_tempo || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/statistik/publik', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const [[bookStats]] = await db.query(`
      SELECT COUNT(id) AS total_buku,
             COALESCE(SUM(jumlah_eksemplar), 0) AS total_eksemplar,
             COALESCE(SUM(tersedia), 0) AS tersedia
      FROM buku
    `);
    const [[memberStats]] = await db.query(
      'SELECT COUNT(id) AS anggota_aktif FROM anggota WHERE LOWER(status) = ?',
      ['aktif']
    );
    const [[loanStats]] = await db.query(
      'SELECT COUNT(id) AS pinjam_berjalan FROM transaksi WHERE status = ?',
      ['dipinjam']
    );
    const [loans] = await db.query(
      `SELECT tanggal_pinjam, tanggal_kembali AS kembali_aktual, status
       FROM transaksi WHERE YEAR(tanggal_pinjam) = ? OR YEAR(tanggal_kembali) = ?`,
      [year, year]
    );
    const [visitors] = await db.query(
      'SELECT waktu_checkin FROM pengunjung WHERE YEAR(waktu_checkin) = ?',
      [year]
    );
    const [categories] = await db.query(`
      SELECT kategori AS nama, COUNT(id) AS jumlah
      FROM buku
      WHERE kategori IS NOT NULL AND kategori <> ''
      GROUP BY kategori
      ORDER BY jumlah DESC
      LIMIT 5
    `);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      .map((month) => ({ month, pinjam: 0, kembali: 0, pengunjung: 0 }));

    loans.forEach((row) => {
      const borrowedAt = row.tanggal_pinjam ? new Date(row.tanggal_pinjam) : null;
      if (borrowedAt && borrowedAt.getFullYear() === year) months[borrowedAt.getMonth()].pinjam += 1;
      const returnedAt = row.kembali_aktual ? new Date(row.kembali_aktual) : null;
      if (row.status === 'dikembalikan' && returnedAt && returnedAt.getFullYear() === year) {
        months[returnedAt.getMonth()].kembali += 1;
      }
    });
    visitors.forEach((row) => {
      const visitedAt = new Date(row.waktu_checkin);
      if (visitedAt.getFullYear() === year) months[visitedAt.getMonth()].pengunjung += 1;
    });

    res.json({
      ok: true,
      tahun: year,
      statistikBuku: {
        totalBuku: bookStats.total_buku,
        totalEksemplar: bookStats.total_eksemplar,
        tersedia: bookStats.tersedia,
        pinjamBerjalan: loanStats.pinjam_berjalan,
      },
      statistikAnggota: { anggotaAktif: memberStats.anggota_aktif },
      statistikBulanan: months,
      kategoriTerpopuler: categories,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

Promise.all([initializeAuthTables(), initializeSettingsTable(), initializeMemberPhotoColumn()])
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Widya Netra running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Gagal menyiapkan database autentikasi:', error);
    process.exitCode = 1;
  });