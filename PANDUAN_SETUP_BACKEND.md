# 🚀 Panduan Lengkap Setup Backend & Database

## ❗ Masalah Saat Ini
**Error:** `SequelizeConnectionRefusedError`  
**Penyebab:** Backend tidak bisa koneksi ke database PostgreSQL karena **DATABASE_URL belum dikonfigurasi**

---

## ✅ Solusi: Setup Database (Pilih Salah Satu)

### **Opsi 1: Menggunakan Supabase** (RECOMMENDED - Gratis & Mudah)

Anda sudah punya Supabase project! Tinggal tambahkan DATABASE_URL.

#### **Langkah 1: Dapatkan DATABASE_URL dari Supabase**

1. Buka https://supabase.com/dashboard
2. Pilih project Anda: `kbhtgbhmfdqthkxyknmb`
3. Klik **Settings** (ikon gear) → **Database**
4. Scroll ke bagian **Connection String**
5. Pilih tab **Connection pooling**
6. Copy connection string **Transaction mode** atau **Session mode**

Format URL yang benar:
```
postgresql://postgres.kbhtgbhmfdqthkxyknmb:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

⚠️ **PENTING:** Ganti `[YOUR-PASSWORD]` dengan password database Supabase Anda!

#### **Langkah 2: Update File .env**

Buka file `S-triage/backend/.env` dan **TAMBAHKAN** baris ini:

\`\`\`env
# Database Configuration (Pilih salah satu)
# Opsi 1: Menggunakan Sequelize via Direct PostgreSQL Connection URI dari Supabase
DATABASE_URL=postgresql://postgres.kbhtgbhmfdqthkxyknmb:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
\`\`\`

**ATAU** jika lupa password Supabase:
1. Di dashboard Supabase → Settings → Database
2. Klik **Reset Database Password**
3. Copy password baru
4. Gunakan password tersebut di DATABASE_URL

---

### **Opsi 2: Menggunakan PostgreSQL Lokal**

Jika Anda punya PostgreSQL terinstall di komputer:

#### **Langkah 1: Buat Database**
```bash
# Buka psql
psql -U postgres

# Buat database
CREATE DATABASE s_triage_db;

# Keluar
\q
```

#### **Langkah 2: Update File .env**

Hapus atau comment line DATABASE_URL, lalu tambahkan:

\`\`\`env
# Database Configuration (PostgreSQL Lokal)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=s_triage_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
\`\`\`

⚠️ Ganti `your_postgres_password` dengan password PostgreSQL Anda!

---

## 🧪 Cara Test Koneksi Database

Setelah update `.env`, jalankan test ini:

### **Test 1: Jalankan Script Test**
```bash
cd S-triage/backend
node test-connection.js
```

**✅ Jika Berhasil**, Anda akan melihat:
```
🔍 === TEST KONEKSI DATABASE ===

📡 Test 1: Mencoba koneksi ke database...
✅ Koneksi database berhasil!

⚙️  Konfigurasi Database:
   Host: aws-0-ap-southeast-1.pooler.supabase.com
   Database: postgres
   Dialect: postgres
   Username: postgres.kbhtgbhmfdqthkxyknmb

📋 Test 2: Sinkronisasi tabel...
✅ Tabel berhasil disinkronkan!

👥 Test 3: Cek jumlah user di database...
✅ Total user: 0

✅ === SEMUA TEST BERHASIL! ===

Backend siap digunakan! 🚀
```

**❌ Jika Gagal**, akan ada pesan error dengan solusi

---

### **Test 2: Restart Backend Server**
```bash
# Stop backend yang lama (Ctrl+C di terminal yang running)

# Start ulang
cd S-triage/backend
npm run dev
```

**Cek log di terminal**, seharusnya muncul:
```
🚀 Server Express berjalan di http://localhost:5000
📡 API endpoint: http://localhost:5000/api
✅ Koneksi database PostgreSQL/Supabase berhasil terhubung.
✅ Tabel database disinkronkan dari model.
```

---

### **Test 3: Test Endpoint Register**

Buka terminal baru dan jalankan:

\`\`\`bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nama\":\"Dr. Test\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
\`\`\`

**✅ Response Berhasil:**
\`\`\`json
{
  "status": "success",
  "data": {
    "user": {
      "id": "...",
      "nama": "Dr. Test",
      "email": "test@example.com",
      "role": "PERAWAT"
    }
  }
}
\`\`\`

**❌ Response Gagal (masih error):**
\`\`\`json
{
  "status": "error",
  "message": "Internal Server Error",
  "stack": "SequelizeConnectionRefusedError..."
}
\`\`\`
→ Berarti DATABASE_URL masih salah, cek lagi!

---

## 📋 Checklist Setup

- [ ] File `.env` sudah ada di `backend/` folder
- [ ] Ada variabel `JWT_SECRET` di `.env`
- [ ] Ada variabel `DATABASE_URL` ATAU `DB_*` credentials
- [ ] Password database benar (tidak ada typo)
- [ ] Run `node test-connection.js` → berhasil
- [ ] Backend server restart → log menunjukkan "berhasil terhubung"
- [ ] Test endpoint `/api/auth/register` → berhasil tanpa error

---

## 🔧 Troubleshooting

### Error: "connection refused"
**Penyebab:** PostgreSQL tidak berjalan atau port salah  
**Solusi:**
- Untuk Supabase: Cek DATABASE_URL benar
- Untuk lokal: Start PostgreSQL service

### Error: "password authentication failed"
**Penyebab:** Password salah  
**Solusi:**
- Cek password di DATABASE_URL atau DB_PASSWORD
- Untuk Supabase: Reset password di dashboard

### Error: "database does not exist"
**Penyebab:** Database belum dibuat  
**Solusi:**
- Untuk Supabase: Database `postgres` sudah ada default
- Untuk lokal: Jalankan `CREATE DATABASE s_triage_db;`

### Error: "JWT_SECRET belum diatur"
**Penyebab:** Tidak ada JWT_SECRET di .env  
**Solusi:** Tambahkan di `.env`:
\`\`\`env
JWT_SECRET=rahasia-jwt-anda-ganti-untuk-production
\`\`\`

---

## 🎯 Template .env Lengkap

### Untuk Supabase:
\`\`\`env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=super-secret-key-change-in-production
JWT_EXPIRES_IN=8h

# Database Configuration (Supabase)
DATABASE_URL=postgresql://postgres.kbhtgbhmfdqthkxyknmb:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# Supabase SDK (Optional - untuk Storage/Realtime)
SUPABASE_URL=https://kbhtgbhmfdqthkxyknmb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

### Untuk PostgreSQL Lokal:
\`\`\`env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=super-secret-key-change-in-production
JWT_EXPIRES_IN=8h

# Database Configuration (Local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=s_triage_db
DB_USER=postgres
DB_PASSWORD=your_password_here
\`\`\`

---

## ✅ Setelah Setup Berhasil

1. Frontend bisa registrasi user tanpa error
2. Dashboard akan bisa login
3. Data tersimpan di database
4. Anda bisa lanjut development fitur lain

---

**Butuh bantuan? Jalankan:**
\`\`\`bash
cd S-triage/backend
node test-connection.js
\`\`\`

Dan lihat error message-nya untuk petunjuk solusi! 🚀
