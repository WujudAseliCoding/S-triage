// Data contoh (mock) untuk tahap desain UI. Ganti dengan pemanggilan API (services/)
// begitu endpoint backend tersedia.

export const CLINIC_NAME = 'Puskesmas Medan Selayang';

export const MOCK_STAFF_USER = {
  id: 'staff-001',
  nama: 'dr. Faisal Rahman',
  jabatan: 'Kepala Triase',
  email: 'admin@selayangpuskesmas.go.id',
  role: 'RESEPSIONIS',
};

// ---------- Dashboard ----------
export const DASHBOARD_STATS = [
  { label: 'Total Pasien Hari Ini', value: 47, note: 'Data simulasi', dot: 'bg-brand-600', iconBg: 'bg-brand-50' },
  { label: 'Menunggu Pelayanan', value: 12, note: '12 pasien menunggu', dot: 'bg-amber-500', iconBg: 'bg-amber-100' },
  { label: 'Sedang Dilayani', value: 8, note: '8 pasien sedang dilayani', dot: 'bg-blue-500', iconBg: 'bg-blue-50' },
  { label: 'Selesai Terlayani', value: 27, note: '27 pasien selesai terlayani', dot: 'bg-emerald-500', iconBg: 'bg-emerald-50' },
];

export const PRIORITY_DISTRIBUTION = [
  { priority: 'merah', count: 3 },
  { priority: 'kuning', count: 15 },
  { priority: 'hijau', count: 29 },
];

export const RECENT_VISITS = [
  { nama: 'Ahmad Subarjo', priority: 'merah', dokter: 'dr. Rina Sari', status: 'Dalam penanganan', statusTone: 'warning' },
  { nama: 'Siti Rahma', priority: 'kuning', dokter: 'dr. Hendra Wijaya', status: 'Sedang dilayani', statusTone: 'warning' },
  { nama: 'Budi Santoso', priority: 'hijau', dokter: 'dr. Rina Sari', status: 'Menunggu', statusTone: 'warning' },
  { nama: 'Megawati Putri', priority: 'hijau', dokter: 'dr. Hendra Wijaya', status: 'Selesai terlayani', statusTone: 'success' },
  { nama: 'Yusuf Lubis', priority: 'kuning', dokter: 'dr. Rina Sari', status: 'Sedang dilayani', statusTone: 'warning' },
];

// ---------- Antrean live ----------
export const LIVE_QUEUE = [
  { id: 'q1', nama: 'Hendra Wijaya', keluhan: 'Sesak napas berat, asma akut', priority: 'merah', dokter: 'dr. Rina Sari', masuk: '08:12' },
  { id: 'q2', nama: 'Sutan Siregar', keluhan: 'Nyeri dada, riwayat penyakit jantung', priority: 'merah', dokter: 'dr. Rina Sari', masuk: '08:24' },
  { id: 'q3', nama: 'Budi Kusuma', keluhan: 'Fraktur lengan tertutup kiri', priority: 'kuning', dokter: 'dr. Hendra Wijaya', masuk: '08:05' },
  { id: 'q4', nama: 'Aulia Safitri', keluhan: 'Demam berdarah trombosit turun', priority: 'kuning', dokter: 'dr. Rina Sari', masuk: '08:15' },
  { id: 'q5', nama: 'Zulkifli Harahap', keluhan: 'Asam lambung hebat, muntah', priority: 'kuning', dokter: 'dr. Hendra Wijaya', masuk: '08:29' },
  { id: 'q6', nama: 'Dewi Lestari', keluhan: 'Luka bakar ringan siram minyak', priority: 'kuning', dokter: 'dr. Hendra Wijaya', masuk: '08:31' },
  { id: 'q7', nama: 'Gading Marten', keluhan: 'Gatal alergi kulit punggung', priority: 'hijau', dokter: 'dr. Hendra Wijaya', masuk: '07:45' },
  { id: 'q8', nama: 'Rani Handayani', keluhan: 'Flu ringan dan bersin mendadak', priority: 'hijau', dokter: 'dr. Hendra Wijaya', masuk: '07:58' },
  { id: 'q9', nama: 'Siti Kholifah', keluhan: 'Kontrol luka jahitan minggu lalu', priority: 'hijau', dokter: 'dr. Rina Sari', masuk: '08:02' },
];

// ---------- Manajemen dokter ----------
export const DOCTORS = [
  { id: 'd1', nama: 'dr. Rina Sari', peran: 'Dokter Umum', layanan: 'Layanan FKTP & Triase', kompetensi: 'FKTP & Triase', status: 'Tersedia', jadwal: '08:00–14:00', jalur: 'Triase 1', hari: 'Senin–Rabu' },
  { id: 'd2', nama: 'dr. Hendra Wijaya', peran: 'Dokter Umum', layanan: 'Pemeriksaan umum', kompetensi: 'Pemeriksaan umum', status: 'Istirahat', jadwal: '13:00–18:00', jalur: 'Pemeriksaan umum', hari: 'Senin–Rabu' },
  { id: 'd3', nama: 'drg. Rasyid Lubis', peran: 'Dokter Gigi', layanan: 'Layanan gigi dan mulut', kompetensi: 'Gigi & mulut', status: 'Sibuk', jadwal: '08:00–14:00', jalur: 'Gigi', hari: 'Senin–Kamis' },
  { id: 'd4', nama: 'dr. Sri Astuti', peran: 'Dokter Umum', layanan: 'Layanan FKTP & Antenatal', kompetensi: 'FKTP & Antenatal', status: 'Tersedia', jadwal: '13:00–18:00', jalur: 'Antenatal', hari: 'Selasa–Jumat' },
  { id: 'd5', nama: 'dr. Kevin Wijaya', peran: 'Dokter Umum', layanan: 'Layanan FKTP & Anak', kompetensi: 'FKTP & Anak', status: 'Tersedia', jadwal: '08:00–14:00', jalur: 'Anak', hari: 'Senin–Jumat' },
  { id: 'd6', nama: 'dr. Mega Utami', peran: 'Dokter Umum', layanan: 'Layanan FKTP & Umum', kompetensi: 'FKTP & Umum', status: 'Istirahat', jadwal: '13:00–18:00', jalur: 'Umum', hari: 'Senin–Jumat' },
];

// ---------- Rujukan ----------
export const REFERRAL_STEPS = ['Draf', 'Menunggu konfirmasi', 'Diterima', 'Dalam perjalanan', 'Serah terima selesai'];

export const FACILITY_CAPACITY = [
  { nama: 'Puskesmas Medan Baru', detail: 'Jarak: 3.2 km • Layanan: Rawat jalan & observasi', persen: 45, tone: 'bg-emerald-500', text: 'text-emerald-600' },
  { nama: 'RS Haji Medan', detail: 'Jarak: 5.1 km • Layanan: Rawat inap & observasi', persen: 62, tone: 'bg-amber-500', text: 'text-amber-600' },
  { nama: 'Klinik Sehat Mandiri', detail: 'Jarak: 2.8 km • Layanan: Rawat jalan & evaluasi awal', persen: 30, tone: 'bg-emerald-500', text: 'text-emerald-600' },
];

export const REFERRAL_HISTORY = [
  { nama: 'Subagyo Handoko', detail: 'RS Haji Medan • 23 Mei 2026', status: 'Diterima', tone: 'success' },
  { nama: 'Anisa Rahmawati', detail: 'RSUD Dr. Pirngadi • 23 Mei 2026', status: 'Menunggu konfirmasi', tone: 'warning' },
  { nama: 'Heru Prasetyo', detail: 'Klinik Sehat Mandiri • 22 Mei 2026', status: 'Serah terima selesai', tone: 'success' },
];

// ---------- Laporan analitik ----------
export const ANALYTICS_STATS = [
  { label: 'Total Pasien Dilayani', value: '1.247', note: 'Data simulasi • Belum tervalidasi klinis' },
  { label: 'Rerata Waktu Tunggu', value: '18 Menit', note: 'Data simulasi • Belum tervalidasi klinis', noteClass: 'text-brand-700 font-medium' },
  { label: 'Evaluasi AI', value: 'Belum tervalidasi', small: true, note: 'Evaluasi AI belum tervalidasi • Under-triage/over-triage: Belum tersedia' },
  { label: 'Serah terima selesai', value: '89%', note: 'Data simulasi • Belum tervalidasi klinis' },
];

export const DAILY_TREND = [
  { tgl: 1, nilai: 12 }, { tgl: 3, nilai: 26 }, { tgl: 5, nilai: 20 }, { tgl: 8, nilai: 34 },
  { tgl: 10, nilai: 52 }, { tgl: 12, nilai: 44 }, { tgl: 15, nilai: 48 }, { tgl: 18, nilai: 70 },
  { tgl: 20, nilai: 66 }, { tgl: 22, nilai: 82 }, { tgl: 25, nilai: 90 },
];

export const WEEKLY_URGENCY = [
  { minggu: 'Minggu 1', merah: 8, kuning: 24, hijau: 30 },
  { minggu: 'Minggu 2', merah: 6, kuning: 14, hijau: 52 },
  { minggu: 'Minggu 3', merah: 10, kuning: 20, hijau: 30 },
  { minggu: 'Minggu 4', merah: 5, kuning: 28, hijau: 38 },
];

export const DOCTOR_VOLUME = [
  { nama: 'dr. Rina Sari (Dokter Umum)', jumlah: 342 },
  { nama: 'dr. Hendra Wijaya (Umum)', jumlah: 289 },
  { nama: 'dr. Ayu Lestari (Anak)', jumlah: 245 },
  { nama: 'dr. Faisal Rahman (Triase)', jumlah: 198 },
  { nama: 'dr. Siska Amelia (Gigi)', jumlah: 173 },
];

export const SERVICE_TIMES = [
  { priority: 'merah', measure: 'Ukuran: waktu hingga tindakan pertama', value: 'Belum tersedia' },
  { priority: 'kuning', measure: 'Target mengikuti SOP fasilitas', value: 'Simulasi: 18 menit' },
  { priority: 'hijau', measure: 'Target mengikuti SOP fasilitas', value: 'Simulasi: 32 menit' },
];

export const REPORT_DOWNLOADS = [
  { judul: 'Laporan Triase & Kunjungan Harian', format: 'PDF', aksi: 'Unduh PDF', tone: 'pdf' },
  { judul: 'Rekapitulasi Kunjungan Bulanan', format: 'XLSX', aksi: 'Unduh XLSX', tone: 'xlsx' },
  { judul: 'Laporan Rujukan Keluar & SLA RS', format: 'PDF', aksi: 'Unduh PDF', tone: 'pdf-alt' },
];

// ---------- Antrean pasien (tampilan pasien) ----------
export const PATIENT_TICKET = {
  nomorTiket: 'A-023',
  priority: 'hijau',
  mulaiMenunggu: '10:00 WIB',
  sudahMenunggu: '10 menit',
  batasEstimasi: '10:40 WIB',
  perkiraanDipanggil: '10:25–10:40 WIB',
  sisaWaktu: '00:30:00',
  diperbarui: '10:10 WIB',
  layanan: 'Pemeriksaan umum',
  tempatMenunggu: 'Ruang tunggu umum',
  ruang: 'Ruang Periksa 2',
};
