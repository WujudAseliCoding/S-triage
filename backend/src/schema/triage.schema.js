import { z } from 'zod';

/**
 * Input contract for patient triage registration.
 *
 * NOTE: `prioritas_triage` is now OPTIONAL. It is a *staff override*, not a
 * required input: the classification is produced by the deterministic rule
 * engine from the complaint/vitals. Sending it still works (backward
 * compatible) and is recorded as a staff override.
 */
export const triageInputSchema = z.object({
  nama_pasien: z.string().min(2, 'Nama pasien minimal 2 karakter'),
  umur: z.number().int().positive('Umur harus angka positif'),
  satuan_umur: z.enum(['Tahun', 'Bulan', 'Hari']).optional(),
  jenis_kelamin: z.enum(['L', 'P']),
  keluhan_utama: z.string().min(3, 'Keluhan utama wajib diisi'),
  tanda_vital: z.object({
    sistole: z.number().optional(),
    diastole: z.number().optional(),
    nadi: z.number().optional(),
    pernapasan: z.number().optional(),
    suhu: z.number().optional(),
    spo2: z.number().optional(),
  }).optional(),
  skala_nyeri: z.number().int().min(0).max(10).optional(),
  // Staff override (optional). Recorded separately from the AI recommendation.
  prioritas_triage: z.enum(['P1', 'P2', 'P3', 'P0']).optional(),
});

export const triageVerifySchema = z.object({
  final_prioritas: z.enum(['P1', 'P2', 'P3', 'P0']),
  override_reason: z.string().min(3, 'Alasan perubahan wajib diisi bila mengubah rekomendasi.').optional(),
  reviewer_id: z.string().uuid().optional(),
});

export default triageInputSchema;
