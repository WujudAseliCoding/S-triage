# Setup Database untuk S-Triage

## Masalah: Internal Server Error saat Registrasi

Error "Internal Server Error" terjadi karena backend tidak bisa terkoneksi ke database PostgreSQL.

## Solusi

### Pilihan 1: Menggunakan PostgreSQL Lokal

#### 1. Install PostgreSQL
- Download dan install PostgreSQL dari https://www.postgresql.org/download/
- Atau gunakan PostgreSQL yang sudah terinstall

#### 2. Buat Database
Buka PostgreSQL terminal (psql) dan jalankan:
```sql
CREATE DATABASE s_triage_db;
```

#### 3. Konfigurasi File .env
Buat file `.env` di folder `backend/` dengan isi:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=8h

# Gunakan kredensial PostgreSQL lokal Anda
DB_HOST=localhost
DB_PORT=5432
DB_NAME=s_triage_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

⚠️ **PENTING**: Ganti `your_postgres_password` dengan password PostgreSQL Anda!

---

### Pilihan 2: Menggunakan Supabase (Gratis)

#### 1. Buat Akun Supabase
- Kunjungi https://supabase.com
- Buat akun gratis
- Buat project baru

#### 2. Dapatkan Database URL
- Di dashboard Supabase, klik **Settings** → **Database**
- Scroll ke bagian **Connection string**
- Copy **Connection pooling** → **Transaction Mode** atau **Session Mode**
- URL format: `postgresql://postgres.[project-ref]:[password]@[host]:6543/postgres`

#### 3. Konfigurasi File .env
Buat file `.env` di folder `backend/` dengan isi:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=8h

# Gunakan DATABASE_URL dari Supabase
DATABASE_URL=postgresql://postgres.[your-project]:[your-password]@[host]:6543/postgres?sslmode=require
```

---

## Cara Test Koneksi Database

### 1. Restart Backend Server
```bash
cd backend
npm run dev
```

### 2. Cek Log Server
Jika berhasil, Anda akan melihat:
```
✅ Koneksi database PostgreSQL/Supabase berhasil terhubung.
✅ Tabel database disinkronkan dari model.
```

Jika gagal, Anda akan melihat:
```
⚠️  Database belum terhubung (pastikan DATABASE_URL di .env sudah aktif)
```

### 3. Test Endpoint Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"Test User","email":"test@example.com","password":"password123"}'
```

Jika berhasil, response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "...",
      "nama": "Test User",
      "email": "test@example.com",
      "role": "PERAWAT"
    }
  }
}
```

---

## Troubleshooting

### Error: "connection refused"
- **PostgreSQL tidak berjalan**: Pastikan PostgreSQL service sudah running
- **Port salah**: Cek apakah PostgreSQL berjalan di port 5432
- **Kredensial salah**: Cek username dan password

### Error: "database does not exist"
- Buat database dengan nama yang sama di `.env` (default: `s_triage_db`)

### Error: "JWT_SECRET belum diatur"
- Pastikan ada variabel `JWT_SECRET` di file `.env`

### Error: "password authentication failed"
- Cek password PostgreSQL Anda
- Untuk Supabase, pastikan password di DATABASE_URL benar

---

## Struktur Tabel yang Akan Dibuat

Setelah koneksi berhasil, Sequelize akan otomatis membuat tabel:

### Tabel `users`
- `id` (UUID, Primary Key)
- `nama` (String)
- `email` (String, Unique)
- `password` (String, Hashed)
- `role` (ENUM: ADMIN, DOKTER, PERAWAT)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

---

## Langkah Selanjutnya

Setelah database terhubung:
1. Restart frontend (`npm run dev` di folder frontend)
2. Buka http://localhost:5173/register
3. Coba buat akun baru
4. ✅ Seharusnya tidak ada lagi error "Internal Server Error"
