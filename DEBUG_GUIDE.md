# 🐛 Panduan Debug Internal Server Error

## Langkah 1: Buka Browser DevTools

### A. Buka DevTools
1. Buka aplikasi di browser: http://localhost:5173/register
2. Tekan `F12` atau klik kanan → **Inspect**
3. DevTools akan muncul di bawah atau samping

### B. Pindah ke Tab "Console"
1. Di DevTools, klik tab **Console**
2. Pastikan tidak ada filter aktif (Clear console jika perlu)

### C. Pindah ke Tab "Network"
1. Klik tab **Network**
2. Centang **Preserve log** (agar log tidak hilang)
3. Clear log lama dengan klik icon 🚫 (Clear)

---

## Langkah 2: Reproduksi Error

### A. Isi Form Registrasi
1. Isi form dengan data apapun:
   - Nama: `Dr. Test`
   - Email: `test@example.com`
   - Password: `password123`
   - Konfirmasi: `password123`

### B. Klik Tombol "Buat Akun"

### C. Lihat Yang Terjadi di DevTools

#### Di Tab **Console**:
- Screenshot semua error yang muncul (warna merah)
- Cari pesan error yang berhubungan dengan `/auth/register`

#### Di Tab **Network**:
1. Cari request dengan nama `register` (warna merah jika gagal)
2. Klik request tersebut
3. Screenshot bagian:
   - **Headers** → General (Status Code, Request URL)
   - **Headers** → Request Headers
   - **Response** tab (ini yang paling penting!)
   - **Preview** tab

---

## Langkah 3: Cek Log Backend Terminal

### A. Buka Terminal Yang Menjalankan Backend
- Terminal yang menjalankan `npm run dev` di folder backend

### B. Lihat Output Error
- Saat Anda klik "Buat Akun", backend akan print error
- Copy SEMUA text error dari terminal
- Biasanya dimulai dengan "Unhandled Error:" atau stack trace

### C. Cara Copy Log Backend:
**Windows:**
```
1. Klik di terminal
2. Ctrl+A (select all)
3. Ctrl+C (copy)
4. Paste ke notepad atau langsung ke chat
```

**Mac/Linux:**
```
1. Scroll di terminal untuk lihat error
2. Select text dengan mouse
3. Cmd+C / Ctrl+C
4. Paste
```

---

## Langkah 4: Test Manual dengan Curl

Buka Command Prompt / PowerShell BARU (jangan di terminal backend):

```bash
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"nama\":\"Dr. Test\",\"email\":\"test123@example.com\",\"password\":\"password123\"}" -v
```

**Windows PowerShell (jika curl tidak work):**
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/auth/register -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"nama":"Dr. Test","email":"test456@example.com","password":"password123"}' | Select-Object -Expand Content
```

Copy semua output!

---

## Langkah 5: Test Database Connection

```bash
cd S-triage/backend
node test-connection.js
```

Copy output lengkapnya!

---

## 📸 Yang Perlu Di-Screenshot/Copy:

### ✅ Checklist Info yang Dibutuhkan:

- [ ] **Screenshot Console tab** (semua error merah)
- [ ] **Screenshot Network tab → register request → Response**
- [ ] **Screenshot Network tab → register request → Headers**
- [ ] **Copy text log dari Backend Terminal** (saat error terjadi)
- [ ] **Copy output dari `node test-connection.js`**
- [ ] **Copy output dari curl/Invoke-WebRequest**

---

## 🎯 Template Laporan Error

Setelah mengumpulkan semua info di atas, format seperti ini:

\`\`\`
=== BROWSER CONSOLE ERROR ===
[paste screenshot atau text error dari console]

=== NETWORK REQUEST - RESPONSE ===
Status: [500/400/dll]
Response:
[paste response body]

=== BACKEND TERMINAL LOG ===
[paste error dari terminal backend]

=== TEST CONNECTION RESULT ===
[paste output dari node test-connection.js]

=== CURL TEST RESULT ===
[paste output dari curl]
\`\`\`

---

## 💡 Tips Cepat

### Jika Tidak Mau Ribet Screenshot:
**Cara termudah:** Copy semua error text dan paste langsung ke chat!

### Cara Copy Error dari Console:
1. Klik kanan di error → **Copy message**
2. Atau klik kanan → **Save as...** untuk export semua log

### Cara Copy dari Network Tab:
1. Klik kanan di request → **Copy** → **Copy response**

---

## 🚨 Error Umum & Artinya

### "Network Error" / "Failed to fetch"
- Backend tidak jalan
- Port salah (cek http://localhost:5000)
- CORS issue

### Status 500 - Internal Server Error
- Backend crash
- Database connection error (paling sering!)
- Bug di backend code

### Status 409 - Conflict
- Email sudah terdaftar (bukan error, cuma konflik data)

### Status 400 - Bad Request
- Data yang dikirim tidak sesuai format
- Validasi gagal

---

## ⚡ Quick Debug Commands

**Cek backend jalan:**
```bash
curl http://localhost:5000/api/health
```

**Cek database connect:**
```bash
cd S-triage/backend && node test-connection.js
```

**Restart backend:**
```bash
# Ctrl+C di terminal backend, lalu:
npm run dev
```

---

**Setelah kumpulkan semua info, kirim ke saya dan saya akan analisa masalahnya!** 🔍
