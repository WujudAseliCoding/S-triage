# 🔧 Fix Error: Port 5000 Already in Use

## ❌ Error yang Terjadi
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Artinya:** Port 5000 sudah dipakai oleh proses lain (backend yang lama masih jalan)

---

## ✅ Solusi Cepat

### **Opsi 1: Kill Proses di Port 5000 (RECOMMENDED)**

#### Windows - PowerShell/CMD:
```powershell
# Cari proses yang pakai port 5000
netstat -ano | findstr :5000

# Akan muncul seperti ini:
# TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    12345
# Angka terakhir (12345) adalah PID

# Kill proses (ganti 12345 dengan PID yang muncul)
taskkill /PID 12345 /F
```

#### Mac/Linux:
```bash
# Cari proses di port 5000
lsof -i :5000

# Kill proses (ganti PID dengan yang muncul)
kill -9 PID
```

---

### **Opsi 2: One-Line Command (TERMUDAH)**

#### Windows PowerShell:
```powershell
$proc = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($proc) { Stop-Process -Id $proc -Force; Write-Host "✅ Port 5000 berhasil dibersihkan!" } else { Write-Host "⚠️ Tidak ada proses di port 5000" }
```

**Copy-paste command di atas ke PowerShell dan Enter!**

#### Mac/Linux:
```bash
kill -9 $(lsof -t -i:5000) 2>/dev/null && echo "✅ Port 5000 cleared!" || echo "⚠️ No process on port 5000"
```

---

### **Opsi 3: Restart dengan Port Berbeda**

Jika tidak bisa kill, gunakan port lain sementara:

Edit file `S-triage/backend/.env`:
```env
PORT=5001  # Ganti dari 5000 ke 5001
```

Lalu update frontend juga di `S-triage/frontend/.env` (atau buat jika belum ada):
```env
VITE_API_URL=http://localhost:5001/api
```

---

## 🚀 Setelah Kill Proses

### **1. Start Backend Lagi**
```bash
cd S-triage/backend
npm run dev
```

**✅ Berhasil jika muncul:**
```
🚀 Server Express berjalan di http://localhost:5000
📡 API endpoint: http://localhost:5000/api
✅ Koneksi database PostgreSQL/Supabase berhasil terhubung.
```

**❌ Jika masih error:**
- Ulangi kill process
- Atau gunakan port berbeda (5001)

---

## 🔍 Cara Cek Port Sedang Dipakai

### Windows:
```powershell
# Lihat semua proses yang pakai port
netstat -ano | findstr LISTENING

# Lihat proses spesifik di port 5000
netstat -ano | findstr :5000
```

### Mac/Linux:
```bash
# Lihat proses di port 5000
lsof -i :5000

# Atau
netstat -tulpn | grep 5000
```

---

## 💡 Cara Hindari Masalah Ini

### **Selalu Stop Backend dengan Benar:**

#### Cara BENAR stop backend:
1. Di terminal yang running backend
2. Tekan `Ctrl + C`
3. Tunggu sampai proses berhenti

#### Cara SALAH (jangan):
- Close terminal langsung (X)
- Kill terminal tanpa Ctrl+C
- Tutup VS Code paksa

### **Cek Backend Jalan atau Tidak:**
```bash
curl http://localhost:5000/api/health
```

✅ Jika jalan: dapat response `{"status":"OK"}`  
❌ Jika mati: error "Connection refused"

---

## 🆘 Quick Fix Script

Saya buatkan script otomatis! Copy-paste ini:

### Windows (PowerShell):
```powershell
# Save as kill-port-5000.ps1
$port = 5000
Write-Host "🔍 Mencari proses di port $port..."

$proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty OwningProcess -Unique

if ($proc) {
    Write-Host "🎯 Ditemukan proses: PID $proc"
    Stop-Process -Id $proc -Force
    Write-Host "✅ Port $port berhasil dibersihkan!"
    Start-Sleep -Seconds 1
    Write-Host "🚀 Silakan start backend lagi dengan: npm run dev"
} else {
    Write-Host "⚠️ Tidak ada proses yang menggunakan port $port"
}
```

**Cara pakai:**
```powershell
# Langsung run (tanpa save file):
irm https://raw.githubusercontent.com/.../kill-port.ps1 | iex

# Atau copy script di atas, paste ke PowerShell, Enter
```

---

## 📋 Checklist Troubleshooting

- [ ] Coba kill proses dengan `taskkill /PID xxx /F`
- [ ] Restart terminal/PowerShell
- [ ] Restart VS Code
- [ ] Restart komputer (last resort)
- [ ] Ganti ke port lain (5001, 3001, dll)

---

## 🎯 Summary

**Masalah:** Port 5000 sudah dipakai  
**Penyebab:** Backend lama masih jalan di background  
**Solusi:** Kill proses, lalu start ulang

**Command tercepat (Windows PowerShell):**
```powershell
$p = Get-NetTCPConnection -LocalPort 5000 -EA Silent | % OwningProcess -Unique; if($p){Stop-Process -Id $p -Force}
```

**Lalu start backend:**
```bash
cd S-triage/backend
npm run dev
```

✅ **Done!**
