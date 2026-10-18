# 🏥 S-Triage — Smart Triage & Clinical Queue Management System

S-Triage adalah platform monorepo sistem triase dan manajemen antrean gawat darurat pintar untuk fasilitas kesehatan (Puskesmas, Klinik, dan IGD Rumah Sakit). Sistem ini mengintegrasikan **Portal Mandiri Pasien (QR Code)**, **Asistensi Klasifikasi Klinis AI**, **Verifikasi Triase Perawat**, **Antrean Prioritas Live**, **Manajemen Dokter**, **Rujukan Eksternal**, serta **Laporan & Analitik Agregat**.

---

## 📌 Fitur-Fitur Utama

### 📱 1. Portal Pasien (Mobile-First, Akses via QR Code)
- **Formulir Keluhan Mandiri (`/formulir`):** Pasien/pendamping dapat memindai QR Code di loket IGD untuk mengisi identitas dasar, keluhan utama, riwayat alergi, dan onset gejala secara mandiri tanpa perlu login.
- **Penerbitan Nomor Antrean Otomatis:** Sistem menerbitkan nomor antrean harian terpadu secara otomatis setelah data dikirim.
- **Tiket Antrean Digital (`/antrean`):** Pemantauan status panggilan secara berkala, estimasi waktu tunggu, dan ruang periksa yang dituju.

### 🩺 2. Portal Petugas & Tenaga Medis (Terproteksi JWT)
- **Dashboard Operasional IGD (`/dashboard`):** Ringkasan statistik kunjungan harian, keterisian ruang periksa, distribusi kasus darurat (P1/P2/P3), dan status faskes.
- **Verifikasi Triase Perawat (`/registrasi-triase`):** Tampilan *master-detail* real-time data pasien masuk dari formulir QR, pengukuran tanda vital & asesmen klinis, rekomendasi urgensi dari AI, serta fasilitas *override* prioritas dengan kewajiban mencatat alasan klinis.
- **Pemantauan Antrean Live (`/antrean-live`):** Pembagian kolom antrean berdasarkan tingkat kegawatan klinis (Merah/P1, Kuning/P2, Hijau/P3), pemanggilan pasien, pencatatan tindakan medis, eskalasi darurat, dan luaran kunjungan.
- **Manajemen Dokter & Tenaga Medis (`/manajemen-dokter`):** Monitoring status ketersediaan (*Tersedia*, *Sedang Bertugas*, *Istirahat*, *Off*), penugasan dokter ke ruang periksa, serta rekap penanganan pasien.
- **Rujukan Eksternal & Load Balancing (`/rujukan`):** Pengalihan pasien ke rumah sakit rujukan, integrasi data kapasitas ICU/IGD faskes tujuan, dan pelacakan status hingga serah terima tuntas.
- **Laporan & Analitik Agregat (`/laporan-analitik`):** Filter periode waktu (*7 hari*, *30 hari*, *bulan ini*, *hari ini*), visualisasi tren kunjungan harian, distribusi urgensi mingguan, evaluasi keselamatan (*under-triage* & *over-triage rate*), dan ekspor laporan ke format spreadsheet (CSV/Excel).

---

## 🛠️ Tech Stack & Arsitektur

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Monorepo** | NPM Workspaces & Concurrently | Menjalankan Frontend dan Backend dalam satu perintah |
| **Frontend** | React 19, Vite, Tailwind CSS v4 | Antarmuka responsif, modern, dan cepat |
| **Icons & Styling** | Lucide React | Ikon modern dan konsisten |
| **Routing & HTTP** | React Router v7, Axios | Navigasi SPA & API client dengan interceptor token |
| **Backend** | Express.js (Node.js ES Modules) | RESTful API arsitektur controller-routes |
| **Database & ORM** | PostgreSQL (Supabase), Sequelize ORM | Relasi data pasien, antrean, dokter, faskes, dan rujukan |
| **Validasi & Auth** | Zod Schema, JWT, BcryptJS | Validasi skema ketat & autentikasi role-based (Admin/Dokter/Perawat) |
| **AI Gateway** | Gutech Way AI Gateway | Analisis keluhan utama & rekomendasi urgensi triase awal |

---

## 📁 Struktur Repositori (Monorepo)

```text
S-triage/
├── frontend/                         # Client SPA (React + Vite)
│   ├── public/                       # Aset statis & logo
│   ├── src/
│   │   ├── components/               # Komponen reusable (Layout, Common, Patient)
│   │   ├── pages/                    # Halaman Pasien & Petugas Faskes
│   │   │   ├── patient/              # PatientFormPage, PatientQueuePage
│   │   │   └── staff/                # Dashboard, Triage, LiveQueue, Doctor, Referral, Analytics
│   │   ├── routes/                   # Routing aplikasi & ProtectedRoute
│   │   ├── services/                 # Komunikasi API (auth, triage, queue, referral, doctor, analytics)
│   │   ├── utils/                    # Helper formatting, status, styles
│   │   └── data/                     # Mock data & konstanta sistem
│   ├── vite.config.js                # Konfigurasi Vite & Proxy /api ke port 5000
│   └── package.json
│
├── backend/                          # RESTful API Server (Express.js)
│   ├── src/
│   │   ├── config/                   # Koneksi Database (Sequelize) & AI Gateway
│   │   ├── controllers/              # Logika bisnis (auth, triage, queue, doctor, referral, dashboard)
│   │   ├── models/                   # Definisi model Sequelize (User, TriagePatient, Queue, Referral, Facility)
│   │   ├── routes/                   # Definisi endpoint RESTful Express
│   │   ├── schema/                   # Validasi schema Zod (auth, triage, queue)
│   │   ├── middlewares/              # JWT Auth, error handler, validate middleware
│   │   ├── seeds/                    # Script seeding data demo faskes
│   │   ├── app.js                    # Konfigurasi middleware Express
│   │   └── server.js                 # Entry point server HTTP port 5000
│   ├── .env.example                  # Template konfigurasi environment
│   └── package.json
│
├── package.json                      # Root package (Workspaces runner)
└── README.md
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat
- **Node.js:** Versi 18.x atau lebih baru.
- **Database:** PostgreSQL lokal atau instance gratis di [Supabase](https://supabase.com).

### 2. Instalasi Dependensi
Jalankan perintah berikut di direktori root `S-triage`:
```bash
npm install
```

### 3. Konfigurasi Environment Variables

Salin file template `.env.example` ke `.env` pada folder backend:
```bash
cp backend/.env.example backend/.env
```

Sesuaikan variabel di `backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# AI Gateway (Gutech Way AI)
WAY_API_URL=https://api-way.gutech.dev/v1/chat/completions
WAY_API_KEY=your_gutech_api_key_here
WAY_API_MODEL=gutech/fast

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=1d

# Database Configuration (PostgreSQL / Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?sslmode=require

# Supabase SDK (Opsional)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=
```

*(Opsional)* Pada folder `frontend`, file `frontend/.env` telah terpasang dengan proxy default:
```env
VITE_API_BASE_URL=/api
```

---

### 4. Menjalankan Aplikasi

Jalankan backend dan frontend sekaligus dari root folder:
```bash
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api`

Perintah alternatif:
```bash
# Menjalankan frontend saja
npm run dev:frontend

# Menjalankan backend saja
npm run dev:backend

# Build frontend untuk produksi
npm run build:frontend
```

---

## 👤 Akun Demo untuk Pengujian (Seeded Accounts)

Untuk menguji fitur portal petugas, gunakan salah satu akun demo berikut (password default: `password123`):

| Role | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin / Kepala Triase** | `admin@selayangpuskesmas.go.id` | `password123` | Akses penuh seluruh modul dan analitik |
| **Dokter Umum** | `dr.rina@selayangpuskesmas.go.id` | `password123` | Penanganan antrean medis & pemeriksaan |
| **Dokter Umum** | `dr.hendra@selayangpuskesmas.go.id` | `password123` | Penanganan antrean medis |
| **Dokter Gigi** | `drg.rasyid@selayangpuskesmas.go.id` | `password123` | Layanan kesehatan gigi dan mulut |

> Pasien **tidak memerlukan akun login** dan dapat langsung mengakses `/formulir` dan `/antrean`.

---

## 🔌 Endpoint API Utama

- **Autentikasi:** `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- **Triase Pasien:** `POST /api/triage/register`, `GET /api/triage/patients`, `GET /api/triage/patients/:id`, `PUT /api/triage/patients/:id`, `DELETE /api/triage/patients/:id`
- **Antrean IGD:** `GET /api/queue/live`, `PUT /api/queue/call/:id`, `PUT /api/queue/serve/:id`, `PUT /api/queue/finish/:id`, `PUT /api/queue/escalate/:id`, `PUT /api/queue/action/:id`, `DELETE /api/queue/:id`
- **Dokter & Tenaga Medis:** `GET /api/doctors`, `GET /api/doctors/nurses`, `POST /api/doctors`, `PUT /api/doctors/:id`, `PUT /api/doctors/:id/status`
- **Rujukan Eksternal:** `GET /api/referrals`, `POST /api/referrals`, `PUT /api/referrals/status/:id`, `GET /api/facilities`
- **Dashboard & Analitik:** `GET /api/dashboard/stats`, `GET /api/analytics/stats`, `GET /api/analytics/export`

---

## 👥 Tim Pengembang (Owner)

Proyek ini dikembangkan dan dikelola oleh tim **Loncat ga nih?**:

| No | Nama Anggota | Peran / Tanggung Jawab |
| :---: | :--- | :--- |
| 1 | **Akief Maulana Aulia** | Ketua Tim |
| 2 | **Christein Akadojuanrich Habayaki Purba** | Anggota Tim |
| 3 | **El Fahreza Sufi** | Anggota Tim |

---

## 📄 Lisensi & Kontribusi
Proyek ini dikembangkan untuk kebutuhan akademik dan simulasi implementasi digitalisasi layanan gawat darurat faskes tingkat pertama / lanjutan. Silakan gunakan dan kembangkan sesuai ketentuan institusi.

