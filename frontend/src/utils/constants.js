// Konstanta tingkat kegawatdaruratan Triage
// Mengikuti mockup: Merah (penanganan segera), Kuning (mendesak), Hijau (dapat menunggu).
// Class Tailwind ditulis lengkap agar terdeteksi saat build.
export const TRIAGE_PRIORITY = {
  merah: {
    key: 'merah',
    label: 'Merah',
    description: 'Penanganan segera',
    textClass: 'text-red-700',
    badgeClass: 'bg-red-50 text-red-700',
    dotClass: 'bg-red-500',
    barClass: 'bg-red-500',
    panelClass: 'border-red-200 bg-red-50/70',
    cardClass: 'border-red-200',
    countClass: 'bg-red-500',
  },
  kuning: {
    key: 'kuning',
    label: 'Kuning',
    description: 'Mendesak',
    textClass: 'text-amber-700',
    badgeClass: 'bg-amber-100 text-amber-800',
    dotClass: 'bg-amber-500',
    barClass: 'bg-amber-500',
    panelClass: 'border-amber-200 bg-amber-50/70',
    cardClass: 'border-amber-200',
    countClass: 'bg-amber-500',
  },
  hijau: {
    key: 'hijau',
    label: 'Hijau',
    description: 'Dapat menunggu',
    textClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    dotClass: 'bg-emerald-500',
    barClass: 'bg-emerald-500',
    panelClass: 'border-emerald-200 bg-emerald-50/70',
    cardClass: 'border-emerald-200',
    countClass: 'bg-emerald-500',
  },
};

// Satu sumber pemetaan kode kategori operasional (backend) -> token warna UI.
// Dipakai bersama halaman pasien dan halaman petugas agar warna indikator
// urgensi selalu identik (tidak bisa lagi berbeda antar halaman).
export const PRIORITY_CODE_TO_KEY = { P1: 'merah', P2: 'kuning', P3: 'hijau' };

export const priorityKeyFromCode = (code) => {
  if (code === 'merah' || code === 'kuning' || code === 'hijau') return code;
  return PRIORITY_CODE_TO_KEY[code] || 'hijau';
};

export const AGE_UNITS = ['Tahun', 'Bulan', 'Hari'];
