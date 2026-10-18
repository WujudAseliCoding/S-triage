import { z } from 'zod';

export const PATIENT_FORM_INITIAL = {
  untuk: 'sendiri',
  nama: '',
  jenisKelamin: '',
  umur: '',
  satuanUmur: 'Tahun',
  pakaiTanggalLahir: false,
  tanggalLahir: '',
  nik: '',
  tanpaNik: false,
  keluhan: '',
  waktuMulai: '',
  alergi: '',
  alergiTidakTahu: false,
};

// Ringkasan singkat untuk kotak "Periksa n isian berikut" (pesan inline ada di schema).
export const PATIENT_FORM_SUMMARY = {
  nama: 'Nama lengkap belum diisi.',
  jenisKelamin: 'Jenis kelamin belum dipilih.',
  umur: 'Umur belum diisi dengan benar.',
  tanggalLahir: 'Tanggal lahir belum diisi dengan benar.',
  nik: 'NIK belum 16 digit.',
  keluhan: 'Keluhan utama belum diisi.',
};

export const patientFormSchema = z
  .object({
    untuk: z.enum(['sendiri', 'keluarga']),
    nama: z.string().trim().min(1, 'Isi nama lengkap pasien.'),
    jenisKelamin: z.enum(['L', 'P'], { message: 'Pilih jenis kelamin pasien.' }),
    umur: z.string().trim(),
    satuanUmur: z.enum(['Tahun', 'Bulan', 'Hari']),
    pakaiTanggalLahir: z.boolean(),
    tanggalLahir: z.string(),
    nik: z.string().trim(),
    tanpaNik: z.boolean(),
    keluhan: z.string().trim().min(1, 'Ceritakan keluhan utama pasien.'),
    waktuMulai: z.string().trim(),
    alergi: z.string().trim(),
    alergiTidakTahu: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.pakaiTanggalLahir) {
      if (!value.tanggalLahir || new Date(value.tanggalLahir) > new Date()) {
        ctx.addIssue({
          code: 'custom',
          path: ['tanggalLahir'],
          message: 'Isi tanggal lahir yang valid (tidak boleh di masa depan).',
        });
      }
    } else {
      const age = Number(value.umur);
      if (!value.umur || !Number.isInteger(age) || age <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['umur'],
          message: 'Isi umur pasien dengan angka lebih dari 0.',
        });
      }
    }

    if (!value.tanpaNik && !/^\d{16}$/.test(value.nik)) {
      ctx.addIssue({
        code: 'custom',
        path: ['nik'],
        message: 'NIK harus 16 digit. Periksa kembali isian Anda.',
      });
    }
  });
