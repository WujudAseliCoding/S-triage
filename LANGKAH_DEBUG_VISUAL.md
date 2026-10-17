# 🎯 Langkah Debug - Visual Guide (Step by Step)

## 🚀 PERSIAPAN (1 Menit)

### ✅ Pastikan Ini Dulu:

```bash
# 1. Backend sudah jalan?
curl http://localhost:5000/api/health
# Harus dapat response: {"status":"OK",...}

# 2. Frontend sudah jalan?
# Buka browser: http://localhost:5173/register
# Harus muncul form registrasi
```

---

## 📸 CARA 1: Ambil Log dari Browser (TERMUDAH)

### **Langkah 1-5 (Ikuti Screenshot di Browser)**

#### 1️⃣ Buka Browser DevTools
```
- Buka: http://localhost:5173/register
- Tekan F12 (atau Klik Kanan → Inspect)
- Jendela DevTools muncul
```

#### 2️⃣ Buka Tab "Network"
```
- Klik tab "Network" di atas
- Centang ☑ "Preserve log"
- Klik icon 🚫 untuk clear log lama
```

#### 3️⃣ Isi Form & Submit
```
Isi form:
- Nama: Dr. Test
- Email: test@example.com
- Password: password123
- Konfirmasi: password123

Klik tombol "Buat Akun"
```

#### 4️⃣ Lihat Request di Network Tab
```
- Di list request, cari yang namanya "register" (warna merah)
- Klik request tersebut
```

#### 5️⃣ Copy Response Error
```
- Klik tab "Response" di panel kanan
- Klik Kanan → "Copy Value" atau Select All + Ctrl+C
- Paste ke Notepad atau langsung kirim ke sini
```

**Contoh yang akan Anda lihat:**
```json
{
  "status": "error",
  "message": "Internal Server Error",
  "stack": "SequelizeConnectionRefusedError: connect ECONNREFUSED..."
}
```

---

## 📝 CARA 2: Ambil Log dari Backend Terminal (PENTING!)

### **Langkah 1-3**

#### 1️⃣ Cari Terminal Backend
```
- Terminal yang menjalankan "npm run dev"
- Biasanya ada tulisan:
  "🚀 Server Express berjalan di http://localhost:5000"
```

#### 2️⃣ Reproduksi Error
```
- Klik "Buat Akun" di browser lagi
- Lihat terminal backend, akan muncul error log
```

#### 3️⃣ Copy Log Error
```
Windows:
1. Klik di terminal window
2. Ctrl + A (select all)
3. Enter atau Ctrl + C (copy)
4. Paste ke notepad

Atau cukup:
- Scroll up sedikit
- Select error text dengan mouse
- Ctrl + C
```

**Contoh yang akan muncul:**
```
Unhandled Error: SequelizeConnectionRefusedError
    at Client._connectionCallback...
    at Socket.reportStreamError...
Error: connect ECONNREFUSED 127.0.0.1:5432
```

---

## 🧪 CARA 3: Test Langsung dengan Command

### **Copy-Paste Command Ini**

#### Test 1: Database Connection
```bash
cd S-triage/backend
node test-connection.js
```

**Copy semua output** yang muncul!

#### Test 2: API Register Manual
```bash
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"nama\":\"Dr. Test\",\"email\":\"test999@example.com\",\"password\":\"password123\"}"
```

**Copy response** yang muncul!

---

## 📤 FORMAT KIRIM KE SAYA

**Pilih salah satu cara termudah:**

### OPSI A: Kirim Screenshot
```
Screenshot Network tab → Response
Screenshot Backend terminal error
```

### OPSI B: Kirim Text (Copy-Paste)
```
=== NETWORK RESPONSE ===
[paste response dari browser]

=== BACKEND ERROR ===
[paste error dari terminal]

=== TEST CONNECTION ===
[paste output dari node test-connection.js]
```

### OPSI C: Kirim Singkat Aja
```
Cukup kirim:
1. Error message dari browser (1-2 baris)
2. Error dari terminal backend (beberapa baris pertama)
```

---

## ⚡ SHORTCUT - Cara Super Cepat (30 Detik)

**Jika bingung, cukup lakukan ini:**

### Step 1: Test Database
```bash
cd S-triage/backend
node test-connection.js > debug-log.txt 2>&1
```

### Step 2: Test Register
```bash
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"nama\":\"Test\",\"email\":\"test@test.com\",\"password\":\"12345678\"}" >> debug-log.txt 2>&1
```

### Step 3: Kirim File
```bash
# File debug-log.txt sudah berisi semua info
# Buka file tersebut, copy semua isinya, paste ke chat
```

---

## 🎯 Ekspektasi Saya

Yang paling saya butuhkan:

### PRIORITAS 1 (WAJIB):
```
Output dari: node test-connection.js
```
**Ini akan kasih tahu apakah database connect atau tidak**

### PRIORITAS 2 (PENTING):
```
Error message dari backend terminal
(saat Anda klik "Buat Akun")
```

### PRIORITAS 3 (Bonus):
```
Response dari Network tab browser
```

---

## 💡 Prediksi Error (90% Kemungkinan)

Berdasarkan test sebelumnya, kemungkinan besar:

### Error: SequelizeConnectionRefusedError
**Artinya:** Database belum connect  
**Solusi:** DATABASE_URL belum di-set di `.env`

**Yang perlu Anda lakukan:**
1. Buka file `S-triage/backend/.env`
2. Cari line yang ada `DATABASE_URL=`
3. Screenshot atau copy isi file `.env` (hide password)
4. Kirim ke saya

---

## 🆘 Jika Masih Bingung

**Lakukan ini:**
```bash
# Di terminal/CMD:
cd S-triage/backend
node test-connection.js
```

**Copy paste SEMUA output yang muncul ke chat ini!**

Itu cukup untuk saya debug masalahnya! 🔍

---

**File ini ada di:** `S-triage/LANGKAH_DEBUG_VISUAL.md`
