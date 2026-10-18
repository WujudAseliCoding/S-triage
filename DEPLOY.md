# Panduan Deploy — S-Triage

Panduan deploy produksi di **Railway**. Repo ini adalah **monorepo NPM Workspaces**
(`frontend` + `backend`) dengan satu `package-lock.json` di root.

---

## 1. Ringkasan perintah

| Tahap | Perintah | Catatan |
| --- | --- | --- |
| Install | `npm ci` | dijalankan di **root** repo; memasang semua workspace |
| Build frontend | `npm run build:frontend` | menghasilkan `frontend/dist` |
| Jalankan backend | `npm run start:backend` | Express, listen di `process.env.PORT` |

Node version dipin lewat `.nvmrc` (`22.12.0`) karena `rolldown` mensyaratkan
`^20.19.0 || >=22.12.0`.

---

## 2. WAJIB dibaca: lockfile harus memuat binary native semua platform

### Gejala

```
Cannot find native binding
```

atau `npm ci` di builder Linux lalu `vite build` gagal.

### Penyebab

`package-lock.json` dibuat di Windows, sehingga hanya berisi binary Windows:

- `@rolldown/binding-win32-x64-msvc` (dipakai Vite 8 / Rolldown)
- `@tailwindcss/oxide-win32-x64-msvc`
- `lightningcss-win32-x64-msvc`

Saat Railway (Linux) menjalankan `npm ci`, paket `...-linux-x64-gnu` **tidak ada di
lockfile**, jadi tidak ikut terpasang dan `vite build` crash saat memuat native binding.

### Cara regenerasi yang benar

Penting: harus dari keadaan **tanpa** `node_modules` dan tanpa lockfile lama. Kalau
folder `node_modules` masih ada, `npm install` akan merekonstruksi lockfile dari isi
folder lokal dan mengulang pruning (hanya platform aktif yang tercatat).

```bash
# 1. bersihkan artefak lama
rm -rf node_modules frontend/node_modules backend/node_modules package-lock.json

# 2. resolve bersih dari registry -> lockfile memuat SEMUA platform
npm install

# 3. verifikasi (harus mengembalikan angka >= 1)
grep -c "@rolldown/binding-linux-x64-gnu" package-lock.json
grep -c "@tailwindcss/oxide-linux-x64-gnu" package-lock.json
grep -c "lightningcss-linux-x64-gnu" package-lock.json
```

Jangan gunakan `npm install --package-lock-only` untuk keperluan ini: mode tersebut
hanya mencatat paket untuk platform yang sedang aktif.

Setelah lockfile benar, `npm ci` di Linux akan otomatis memasang binding yang tepat.
Solusi cepat alternatif (kalau tidak ingin mengurus lockfile): ubah perintah install
di Railway dari `npm ci` menjadi `npm install`.

---

## 3. Topologi deploy

### Opsi A — satu service (direkomendasikan)

Backend juga menyajikan hasil build frontend. Kelebihan: **satu URL** untuk dibagikan,
tanpa isu CORS, frontend tetap memanggil `/api` (same-origin) sehingga tidak perlu
`VITE_API_BASE_URL`.

| Setting | Nilai |
| --- | --- |
| Root Directory | `/` (root repo) |
| Build Command | `npm ci && npm run build:frontend` |
| Start Command | `npm run start:backend` |
| Variable | `NODE_ENV=production`, `SERVE_FRONTEND=true`, `JWT_SECRET=...`, `DATABASE_URL=...` |

Aktifkan penyajian statis di `backend/src/app.js` (hanya saat `NODE_ENV=production`
atau `SERVE_FRONTEND=true`), lalu tambahkan SPA fallback agar rute seperti
`/formulir`, `/antrean`, `/dashboard` tidak 404 saat di-refresh.

### Opsi B — dua service

Service 1 = API (backend), Service 2 = frontend statis.

| Service | Root | Build Command | Start Command |
| --- | --- | --- | --- |
| Backend | `/` | `npm ci` | `npm run start:backend` |
| Frontend | `/` | `npm ci && npm run build:frontend` | `npm run start:frontend` |

Frontend butuh skrip `start:frontend`, misalnya
`vite preview --host 0.0.0.0 --port $PORT` (SPA fallback sudah bawaan) atau
`npx serve -s frontend/dist -l $PORT`.

Karena **Vite menyalin env saat build**, `VITE_API_BASE_URL` harus diatur sebagai
variable yang tersedia **saat build** di service frontend:

```
VITE_API_BASE_URL=https://<nama-backend>.up.railway.app/api
```

Dan di service backend:

```
CLIENT_URL=https://<nama-frontend>.up.railway.app
```

---

## 4. Variabel lingkungan backend

Diambil dari `backend/src/server.js`, `backend/src/app.js`, dan `backend/.env.example`.

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `NODE_ENV` | ✅ | `production`. Menonaktifkan `sequelize.sync({ alter: true })` yang berbahaya di DB produksi. |
| `PORT` | otomatis | Disuntik Railway; kode sudah memakai `process.env.PORT`. |
| `JWT_SECRET` | ✅ | **Server langsung `process.exit(1)` bila kosong.** |
| `JWT_EXPIRES_IN` | — | Default `1d`. |
| `DATABASE_URL` | ✅* | `postgresql://...@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | — | Alternatif `DATABASE_URL` bila diisi terpisah. |
| `CLIENT_URL` | Opsi B | Origin frontend untuk CORS + `credentials`. Default `http://localhost:5173`. |
| `SERVE_FRONTEND` | Opsi A | `true` agar backend menyajikan `frontend/dist`. |
| `WAY_API_URL` | ✅ | `https://api-way.gutech.dev/v1/chat/completions` |
| `WAY_API_KEY` | ✅ | API key Gutech Way AI Gateway. |
| `WAY_API_MODEL` | — | `gutech/fast` |
| `WAY_API_TIMEOUT_MS` | — | Timeout request ke gateway. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | opsional | Hanya bila memakai Supabase SDK. |

\* Wajib salah satu: `DATABASE_URL` **atau** kumpulan `DB_*`.

Catatan: gateway AI pernah membalas `402 Payment Required`. Aplikasi **tidak ikut mati** —
klasifikasi otomatis jatuh ke mode *fallback* berbasis kamus gejala/aturan klinis lokal,
dan status mode ini ditampilkan di UI. Jadi `WAY_API_KEY` yang tidak valid bukan blocker
demo, tetapi sebaiknya diisi bila kredinya aktif.

---

## 5. Database (Supabase dari Railway)

- Gunakan **connection pooler** Supabase (port `6543`, host `...pooler.supabase.com`),
  bukan koneksi langsung port `5432`.
- Sertakan `?sslmode=require`.
- Koneksi langsung Supabase ber-IPv6; Railway (dan banyak host) belum punya IPv6 keluar,
  sehingga pooler adalah solusinya.
- `NODE_ENV=production` mencegah `sync({ alter: true })` mengubah skema saat startup.
  Untuk mengisi data awal, jalankan seed secara manual.

---

## 6. Check-list sebelum deploy

- [ ] `package-lock.json` memuat paket `*-linux-x64-gnu` (bagian 2).
- [ ] `.nvmrc` ada dan Node di Railway ≥ 22.12.
- [ ] `JWT_SECRET` diisi (kalau tidak, container berhenti saat start).
- [ ] `DATABASE_URL` memakai pooler port `6543` + `sslmode=require`.
- [ ] `NODE_ENV=production`.
- [ ] Build Command & Start Command diset eksplisit (root `package.json` tidak punya
      skrip `build`, hanya `build:frontend`, sehingga auto-detect bisa salah).
- [ ] (Opsi B) `VITE_API_BASE_URL` tersedia saat build, `CLIENT_URL` diset di backend.
- [ ] `npm run build:frontend` sukses lokal sebelum push.

---

## 7. Troubleshooting

| Gejala | Sebab | Solusi |
| --- | --- | --- |
| `Cannot find native binding` | Lockfile hanya memuat binary Windows | Regenerasi lockfile (bagian 2) |
| `npm ci` gagal: lockfile tidak sinkron | `package.json` diubah tanpa update lockfile | `npm install` lalu commit lockfile |
| Container berhenti segera setelah start | `JWT_SECRET` kosong | Isi variable `JWT_SECRET` |
| `CORS policy` di console browser | `CLIENT_URL` belum diset / beda origin | Set `CLIENT_URL` ke origin frontend |
| Halaman dalam (mis. `/dashboard`) 404 saat refresh | Server statis tidak punya SPA fallback | Pakai `vite preview` / `serve -s`, atau SPA fallback di backend |
| Frontend memanggil `http://localhost:5000` | `VITE_API_BASE_URL` tidak ada saat build | Set variable build lalu deploy ulang |
| Timeout / `ECONNREFUSED` ke database | Memakai koneksi langsung IPv6 Supabase | Pakai pooler port `6543` |
| Data lama hilang / kolom berubah sendiri | `NODE_ENV` bukan `production` pada DB produksi | Set `NODE_ENV=production` |
