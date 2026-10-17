import { z } from 'zod';

export const triageInputSchema = z.object({
  nama_pasien: z.string().min(2, 'Nama pasien minimal 2 karakter'),
  umur: z.number().int().positive('Umur harus angka positif'),
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
  prioritas_triage: z.enum(['P1', 'P2', 'P3', 'P0']),
});
