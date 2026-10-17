# ⚡ Quick Start - Test Backend & Database

## 🎯 Cara Cepat Memastikan Backend Jalan

### **Step 1: Test Backend Server** (5 detik)
```bash
curl http://localhost:5000/api/health
```

**✅ Jika Berhasil:**
```json
{"uptime":123,"status":"OK","timestamp":1792265734709}
```

**❌ Jika Gagal:** Backend belum jalan
```bash
cd S-triage/backend
npm run dev
```

---

### **Step 2: Test Database Connection** (10 detik)
```bash
cd S-triage/backend
node test-connection.js
```

**✅ Jika Berhasil:**
```
✅ Koneksi database berhasil!
✅ Tabel berhasil disinkronkan!
✅ Total user: 0
✅ === SEMUA TEST BERHASIL! ===
```

**❌ Jika Gagal:** `SequelizeConnectionRefusedError`
- **Masalah:** DATABASE_URL belum di-set di `.env`
- **Solusi:** Lihat `PANDUAN_SETUP_BACKEND.md`

---

### **Step 3: Test Registrasi User** (15 detik)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"Dr. Test","email":"test@puskesmas.com","password":"test12345"}'
```

**✅ Jika Berhasil:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid-here",
      "nama": "Dr. Test",
      "email": "test@puskesmas.com",
      "role": "PERAWAT"
    }
  }
}
```

**❌ Jika Gagal:** "Internal Server Error"
- Database belum terkoneksi
- Jalankan Step 2 lagi

---

## 🔧 Troubleshooting Cepat

| Error | Penyebab | Solusi Cepat |
|-------|----------|--------------|
| Backend tidak respond | Server belum jalan | `npm run dev` |
| Connection refused | DATABASE_URL kosong | Edit `.env`, tambah DATABASE_URL |
| Password authentication failed | Password salah | Cek password di DATABASE_URL |
| Email sudah terdaftar | User sudah ada | Ganti email di test |

---

## 📝 Checklist 3 Menit

- [ ] Backend jalan → `curl http://localhost:5000/api/health`
- [ ] Database connect → `node test-connection.js`
- [ ] Registrasi works → Test curl register

**Semua ✅?** Backend siap pakai! 🎉

**Ada ❌?** Baca `PANDUAN_SETUP_BACKEND.md` untuk solusi detail.

---

## 🚀 Yang Harus Ada di .env

**MINIMAL** (untuk jalan):
```env
JWT_SECRET=any-secret-key-here
DATABASE_URL=postgresql://user:pass@host:port/database
```

**RECOMMENDED** (lengkap):
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=super-secret-change-in-prod
JWT_EXPIRES_IN=8h
DATABASE_URL=postgresql://postgres.xxx:[PASS]@xxx.supabase.com:6543/postgres
```

---

## 💡 Tips

1. **Simpan password Supabase** di note/notepad
2. **Jangan commit `.env`** ke git (sudah di .gitignore)
3. **Test dulu backend** sebelum test frontend
4. **Gunakan `test-connection.js`** untuk debug database

---

**File penting:**
- `PANDUAN_SETUP_BACKEND.md` - Panduan lengkap setup
- `test-connection.js` - Script untuk test database
- `.env.example` - Template file .env
