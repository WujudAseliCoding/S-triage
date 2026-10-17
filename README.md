# S-Triage (Monorepo)

Monorepo website menggunakan **React.js (Vite)** + **Tailwind CSS v4** untuk Frontend dan **Express.js** untuk Backend.

---

## 📁 Struktur Monorepo

```text
S-triage/
├── frontend/                     # Frontend (React + Vite)
│   ├── public/                   # Asset statis
│   ├── src/                      # Source code React
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js            # Konfigurasi Vite & Proxy API (/api -> port 5000)
│   ├── eslint.config.js
│   └── package.json
│
├── backend/                      # Backend (Express.js)
│   ├── src/
│   │   ├── controllers/          # Logika handler request (misal: api.controller.js)
│   │   ├── routes/               # Definisi endpoint rute (misal: api.routes.js)
│   │   ├── middlewares/          # Middleware custom (errorHandler, auth, dll.)
│   │   ├── app.js                # Konfigurasi Express, middleware & routes
│   │   └── server.js             # Entry point Express server
│   ├── .env                      # Environment variable (PORT, CLIENT_URL, dll.)
│   ├── .env.example
│   └── package.json
│
├── package.json                  # Root Monorepo (NPM Workspaces & Scripts)
├── .gitignore
└── README.md
```

---

## 🚀 Cara Menjalankan Project

Semua perintah dapat dijalankan langsung dari **folder root (`S-triage`)**:

### 1. Jalankan Frontend & Backend Sekaligus (Rekomendasi)
```bash
npm run dev
```
Perintah ini akan menjalankan backend Express di `http://localhost:5000` dan frontend Vite di `http://localhost:5173` secara bersamaan (`concurrently`).

---

### 2. Menjalankan Salah Satu Saja

- **Hanya Frontend:**
  ```bash
  npm run dev:frontend
  ```
- **Hanya Backend:**
  ```bash
  npm run dev:backend
  ```

---

### 3. Build Production

- **Build Frontend:**
  ```bash
  npm run build:frontend
  ```
- **Start Backend:**
  ```bash
  npm run start:backend
  ```

---

## 🔌 Komunikasi Frontend & Backend

- Backend berjalan di port `5000` (dengan endpoint utama `/api`).
- Frontend Vite sudah dikonfigurasi dengan **proxy** di [vite.config.js](file:///d:/Pemrograman/Semester%205/S-triage/frontend/vite.config.js).
- Di dalam kode React, kamu cukup melakukan fetch:
  ```javascript
  fetch('/api/health')
    .then(res => res.json())
    .then(data => console.log(data));
  ```
  Vite akan otomatis meneruskan request ini ke `http://localhost:5000/api/health` tanpa masalah CORS di masa pengembangan.
