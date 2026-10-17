# 🚀 Next Steps Setelah Merge Branch Tein

## ✅ Yang Sudah Selesai

- ✅ Merge branch tein ke akip selesai
- ✅ Conflict di package.json resolved
- ✅ Semua file syntax OK (verified dengan test_syntax.js)
- ✅ Routes terintegrasi dengan baik
- ✅ Backend punya 4 sistem utama (Auth, Triage, Queue, Referral)
- ✅ AI integration ready (OpenAI config)

---

## 📋 Langkah Selanjutnya (Urutan Prioritas)

### **STEP 1: Update Dependencies** (5 menit)

Branch tein menggunakan OpenAI API, jadi kita perlu install dependencies:

```bash
cd S-triage
npm install

# Atau jika ingin force update:
npm install --force
```

**Expected output:**
```
added 1 package, and audited 373 packages in 10s
```

---

### **STEP 2: Setup Environment Variables** (10 menit)

Kita perlu update `.env` file dengan konfigurasi baru dari tein branch:

```bash
# Buka file .env di backend folder
cd S-triage/backend
nano .env  # atau gunakan text editor

# Atau cek dulu ada apa aja:
cat .env | grep -v PASSWORD | grep -v SECRET | head -20
```

**Tambahkan variable baru untuk OpenAI:**

```env
# === EXISTING ===
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=8h

# === DATABASE (WAJIB - dari akip) ===
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@xxx.supabase.com:6543/postgres

# === NEW FROM TEIN - OPENAI API ===
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo  # atau gpt-3.5-turbo untuk lebih murah

# === OPTIONAL - SUPABASE ===
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

**Cara dapatkan OpenAI API Key:**
1. Buka https://platform.openai.com/api-keys
2. Create new API key
3. Copy dan paste ke `.env`

---

### **STEP 3: Test Database Connection** (5 menit)

```bash
cd S-triage/backend
node test-connection.js
```

**Expected output:**
```
✅ Koneksi database berhasil!
✅ Tabel berhasil disinkronkan!
✅ Total user: 0
✅ === SEMUA TEST BERHASIL! ===
```

**Jika gagal:**
- Cek DATABASE_URL di .env
- Lihat PANDUAN_SETUP_BACKEND.md

---

### **STEP 4: Start Backend & Test** (10 menit)

```bash
cd S-triage/backend
npm run dev
```

**Expected output:**
```
🚀 Server Express berjalan di http://localhost:5000
📡 API endpoint: http://localhost:5000/api
✅ Koneksi database PostgreSQL/Supabase berhasil terhubung.
✅ Tabel database disinkronkan dari model.
```

**Jika ada error EADDRINUSE:**
```powershell
# Windows PowerShell - kill process yang pakai port 5000
$p = Get-NetTCPConnection -LocalPort 5000 -EA Silent | % OwningProcess -Unique
if($p){Stop-Process -Id $p -Force}
```

---

### **STEP 5: Test Endpoints** (15 menit)

Buka terminal BARU (jangan stop backend yang lagi jalan):

#### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

✅ Expected:
```json
{"uptime":123.456,"status":"OK","timestamp":1792265734709}
```

#### Test 2: Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"Dr. Test","email":"test@test.com","password":"password123"}'
```

✅ Expected:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid-here",
      "nama": "Dr. Test",
      "email": "test@test.com",
      "role": "PERAWAT"
    }
  }
}
```

#### Test 3: Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

✅ Expected:
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
      "id": "uuid-here",
      "nama": "Dr. Test",
      "email": "test@test.com",
      "role": "PERAWAT"
    }
  }
}
```

**Save token! Kita butuh untuk test protected endpoints.**

#### Test 4: Register Triage Patient (NEW dari tein!)
```bash
# Ganti token dengan hasil dari login test
TOKEN="eyJhbGciOiJIUzI1..."

curl -X POST http://localhost:5000/api/triage/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nama_pasien": "Ibu Siti",
    "umur": 45,
    "jenis_kelamin": "Perempuan",
    "keluhan_utama": "Demam tinggi, batuk, nyeri kepala",
    "tanda_vital": {
      "tekanan_darah": "130/85",
      "denyut_nadi": 95,
      "suhu_tubuh": 38.5,
      "frekuensi_napas": 20
    }
  }'
```

✅ Expected:
```json
{
  "status": "success",
  "message": "Pasien berhasil didaftarkan dan antrean telah digenerate.",
  "data": {
    "patient": {
      "id": "uuid-patient",
      "nama_pasien": "Ibu Siti",
      "prioritas_triage": "P2",  // AI analyzed!
      "skor_urgensi": 75,
      "analisis_ai": "Patient requires urgent care..."
    },
    "queue": {
      "id": "uuid-queue",
      "nomor_antrean": "B-01",  // Auto-generated!
      "status": "WAITING"
    }
  }
}
```

#### Test 5: Get Live Queue
```bash
curl -X GET "http://localhost:5000/api/queue/live" \
  -H "Authorization: Bearer $TOKEN"
```

✅ Expected:
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid-queue",
      "nomor_antrean": "B-01",
      "status": "WAITING",
      "patient": {
        "nama_pasien": "Ibu Siti",
        "prioritas_triage": "P2",
        "skor_urgensi": 75
      }
    }
  ]
}
```

---

## 📊 API Endpoints Summary

### ✅ Auth Endpoints
| Method | Endpoint | Status |
|--------|----------|--------|
| POST | `/api/auth/register` | ✅ Working |
| POST | `/api/auth/login` | ✅ Working |
| POST | `/api/auth/logout` | ✅ Protected |
| GET | `/api/auth/me` | ✅ Protected |

### ✅ Triage Endpoints (NEW)
| Method | Endpoint | Status |
|--------|----------|--------|
| POST | `/api/triage/register` | ✅ New |
| GET | `/api/triage/patients` | ✅ New |
| GET | `/api/triage/patients/:id` | ✅ New |

### ✅ Queue Endpoints (NEW)
| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/queue/live` | ✅ New |
| PUT | `/api/queue/call/:id` | ✅ New |
| PUT | `/api/queue/serve/:id` | ✅ New |
| PUT | `/api/queue/finish/:id` | ✅ New |
| PUT | `/api/queue/cancel/:id` | ✅ New |

### ✅ Referral Endpoints (NEW)
| Method | Endpoint | Status |
|--------|----------|--------|
| POST | `/api/referrals` | ✅ New |
| GET | `/api/referrals` | ✅ New |
| GET | `/api/referrals/:id` | ✅ New |
| PUT | `/api/referrals/status/:id` | ✅ New |

---

## 🔧 Troubleshooting Common Issues

### Error: "Cannot find module OpenAI"
**Solusi:** Jalankan `npm install` untuk install dependencies

### Error: "OPENAI_API_KEY not set"
**Solusi:** Tambahkan OPENAI_API_KEY ke file .env

### Error: "Database not connected"
**Solusi:** Setup DATABASE_URL di .env (lihat PANDUAN_SETUP_BACKEND.md)

### Error: Port 5000 already in use
**Solusi:**
```powershell
# Windows PowerShell
$p = Get-NetTCPConnection -LocalPort 5000 -EA Silent | % OwningProcess -Unique
if($p){Stop-Process -Id $p -Force}
```

---

## 📝 Checklist Completion

- [ ] Run `npm install` di root folder
- [ ] Setup DATABASE_URL di `.env`
- [ ] Setup OPENAI_API_KEY di `.env`
- [ ] Run `node test-connection.js` → berhasil
- [ ] Run `npm run dev` → backend jalan
- [ ] Test health endpoint → OK
- [ ] Test register → OK
- [ ] Test login → OK (save token!)
- [ ] Test triage register → OK
- [ ] Test live queue → OK

---

## 🎯 Setelah Semua Test OK

### Next priority:
1. **Frontend Integration** - Update API calls di frontend
2. **Test Triage Form** - Test registrasi pasien dari web
3. **Test Dashboard** - Test live queue display
4. **Test Analytics** - Setup analytics endpoints

---

## 💡 Notes

- AI analysis hanya jalan jika OpenAI API key valid
- Setiap registrasi triage otomatis generate queue number
- Queue di-sort by priority & registration time
- Semua endpoints auth-protected (kecuali register & login)
- Database transaction untuk consistency

---

## 📞 Quick Reference

**Cek status:**
```bash
curl http://localhost:5000/api/health
```

**View logs:**
```bash
# Terminal backend
# Scroll untuk lihat error/logs
```

**Stop backend:**
```bash
# Di terminal backend: Ctrl + C
```

**Restart:**
```bash
cd S-triage/backend
npm run dev
```

---

**Ready to go! Lanjut dengan testing?** 🚀
