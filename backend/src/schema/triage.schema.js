import { z } from 'zod';

// String kosong dianggap "tidak diisi" (null) agar form boleh mengosongkan field opsional.
const emptyToNull = (value) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

const optionalText = (max = 500) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());

const nikSchema = z.preprocess(
  emptyToNull,
  z.string().trim().regex(/^\d{16}$/, 'NIK harus 16 digit angka.').nullable().optional(),
);

const birthDateSchema = z.preprocess(
  emptyToNull,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal lahir tidak valid.').nullable().optional(),
);

// Satuan umur disimpan huruf kecil: 'tahun' | 'bulan' | 'hari'.
const ageUnitSchema = z.enum(['tahun', 'bulan', 'hari']);

/**
 * Input contract for patient triage registration (public QR form AND staff).
 *
 * NOTE: `prioritas_triage` is now OPTIONAL. It is a *staff override*, not a
 * required input: the operational category is produced by the deterministic
 * rule engine from the complaint/vitals. Sending it still works (backward
 * compatible) and is recorded as a staff override.
 */
export const triageInputSchema = z.object({
  nama_pasien: z.string().trim().min(2, 'Nama pasien minimal 2 karakter'),
  umur: z.number().int().positive('Umur harus angka positif'),
  satuan_umur: ageUnitSchema.optional(),
  jenis_kelamin: z.enum(['L', 'P']),
  nik: nikSchema,
  tanggal_lahir: birthDateSchema,
  keluhan_utama: z.string().trim().min(3, 'Keluhan utama wajib diisi'),
  waktu_mulai_keluhan: optionalText(255),
  alergi_obat: optionalText(255),
  tanda_vital: z.object({
    sistole: z.number().optional(),
    diastole: z.number().optional(),
    nadi: z.number().optional(),
    pernapasan: z.number().optional(),
    suhu: z.number().optional(),
    spo2: z.number().optional(),
  }).optional(),
  skala_nyeri: z.number().int().min(0).max(10).optional(),
  // Opsional: jika dikirim, override rekomendasi AI. Jika tidak, rekomendasi
  // engine yang dipakai. Selalu disimpan terpisah dari rekomendasi AI.
  prioritas_triage: z.enum(['P1', 'P2', 'P3', 'P0']).optional(),
});

const vitalValue = z.union([z.string().trim().max(50), z.number()]).nullish();

// Edit & verifikasi data pasien oleh perawat/petugas triase.
export const triageVerifySchema = z.object({
  nama_pasien: z.string().trim().min(2, 'Nama pasien minimal 2 karakter'),
  umur: z.coerce.number().int('Umur harus bilangan bulat').positive('Umur harus angka positif'),
  satuan_umur: ageUnitSchema,
  jenis_kelamin: z.enum(['L', 'P']),
  nik: nikSchema,
  tanggal_lahir: birthDateSchema,
  keluhan_utama: z.string().trim().min(3, 'Keluhan utama wajib diisi'),
  waktu_mulai_keluhan: optionalText(255),
  alergi_obat: optionalText(255),
  tanda_vital: z.record(z.string(), vitalValue).optional(),
  asesmen: z.record(z.string(), z.string().trim().max(500).nullish()).optional(),
  catatan_petugas: optionalText(2000),
  prioritas_triage: z.enum(['P1', 'P2', 'P3', 'P0']),
  alasan_override: optionalText(1000),
  // true = verifikasi & tetapkan prioritas, false = simpan perubahan saja
  verifikasi: z.boolean().default(false),
});

// Skema untuk memperbarui data registrasi pasien (mode edit dari halaman antrean).
// Semua field opsional karena petugas dapat mengubah sebagian data saja.
export const triageUpdateSchema = z.object({
  nama_pasien: z.string().min(2, 'Nama pasien minimal 2 karakter').optional(),
  umur: z.number().int().positive('Umur harus angka positif').optional(),
  jenis_kelamin: z.enum(['L', 'P']).optional(),
  keluhan_utama: z.string().min(3, 'Keluhan utama wajib diisi').optional(),
  tanda_vital: z.record(z.string(), z.any()).optional(),
  prioritas_triage: z.enum(['P1', 'P2', 'P3', 'P0']).optional(),
  catatan_petugas: z.string().optional(),
  alasan_perubahan: z.string().optional(),
});

export default triageInputSchema;
