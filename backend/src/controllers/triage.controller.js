import { Op } from 'sequelize';
import { TriagePatient, Queue, Referral, User } from '../models/index.js';
import { triageInputSchema, triageVerifySchema } from '../schema/triage.schema.js';
import { renumberQueuesForDay } from '../utils/queueNumber.js';
import { analyzeTriageWithAI } from '../config/ai.js';
import sequelize from '../config/database.js';

const zodErrorResponse = (res, error) =>
  res.status(400).json({
    status: 'error',
    message: error.issues?.[0]?.message || 'Validasi data gagal.',
    errors: (error.issues || []).map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  });

/**
 * Mendaftarkan pasien triase baru dan meng-generate antrean secara otomatis
 */
export const registerTriagePatient = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    // 1. Validasi input menggunakan schema Zod
    const validatedData = triageInputSchema.parse(req.body);
    
    // 2. Hubungi AI Gateway untuk menganalisis keluhan utama & menentukan urgensi
    const aiResult = await analyzeTriageWithAI(validatedData.keluhan_utama, validatedData.tanda_vital);

    // Catatan: Jika prioritas_triage dikirim manual dan sengaja dioverride oleh petugas,
    // kita bisa memilih untuk memprioritaskan opsi manual tersebut atau opsi AI.
    // Di sini kita berikan prioritas ke manual jika ada, jika tidak, kita gunakan rekomendasi AI.
    const finalPrioritas = validatedData.prioritas_triage || aiResult.prioritas_triage;
    const finalSkorUrgensi = aiResult.skor_urgensi;
    const finalAnalisisAI = aiResult.analisis_ai;

    // 3. Simpan data pasien triase (status awal: BELUM_DIVERIFIKASI, menunggu verifikasi perawat)
    const patient = await TriagePatient.create({
      nama_pasien: validatedData.nama_pasien,
      nik: validatedData.nik || null,
      tanggal_lahir: validatedData.tanggal_lahir || null,
      umur: validatedData.umur,
      satuan_umur: validatedData.satuan_umur || 'tahun',
      jenis_kelamin: validatedData.jenis_kelamin,
      keluhan_utama: validatedData.keluhan_utama,
      waktu_mulai_keluhan: validatedData.waktu_mulai_keluhan || null,
      alergi_obat: validatedData.alergi_obat || null,
      tanda_vital: validatedData.tanda_vital || {},
      prioritas_triage: finalPrioritas,
      prioritas_ai: aiResult.prioritas_triage,
      skor_urgensi: finalSkorUrgensi,
      analisis_ai: finalAnalisisAI,
      status_verifikasi: 'BELUM_DIVERIFIKASI',
    }, { transaction });

    // 4. Buat entri antrean (Queue) baru.
    // Nomor antrean final ditentukan setelah ini oleh renumberQueuesForDay():
    // seluruh antrean hari itu diurutkan dari tingkat risiko paling tinggi
    // dalam satu deret harian yang digabung (tanpa prefix A/B/C/D).
    const queue = await Queue.create({
      nomor_antrean: '00',
      status: 'WAITING',
      triage_patient_id: patient.id,
    }, { transaction });

    await renumberQueuesForDay(queue.createdAt, transaction);
    await queue.reload({ transaction });

    await transaction.commit();

    return res.status(201).json({
      status: 'success',
      message: 'Pasien berhasil didaftarkan dan antrean telah digenerate.',
      data: {
        patient: {
          id: patient.id,
          nama_pasien: patient.nama_pasien,
          prioritas_triage: patient.prioritas_triage,
          skor_urgensi: patient.skor_urgensi,
          analisis_ai: patient.analisis_ai,
        },
        queue: {
          id: queue.id,
          nomor_antrean: queue.nomor_antrean,
          status: queue.status,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'ZodError') {
      return zodErrorResponse(res, error);
    }
    next(error);
  }
};

/**
 * Mengambil daftar seluruh pasien triase
 * Query `verifikasi`: pending (menunggu verifikasi) | done (sudah diverifikasi) | all (default)
 * Pasien yang menunggu verifikasi diurutkan berdasarkan prioritas klinis, lalu waktu masuk terlama.
 */
export const getTriagePatients = async (req, res, next) => {
  try {
    const { verifikasi = 'all' } = req.query;

    const where = {};
    if (verifikasi === 'pending') {
      where.status_verifikasi = 'BELUM_DIVERIFIKASI';
    } else if (verifikasi === 'done') {
      where.status_verifikasi = { [Op.in]: ['DIVERIFIKASI', 'OVERRIDDEN'] };
    }

    const order = verifikasi === 'pending'
      ? [
          [sequelize.literal(`
            CASE
              WHEN "TriagePatient"."prioritas_triage" = 'P1' THEN 1
              WHEN "TriagePatient"."prioritas_triage" = 'P2' THEN 2
              WHEN "TriagePatient"."prioritas_triage" = 'P3' THEN 3
              WHEN "TriagePatient"."prioritas_triage" = 'P0' THEN 4
              ELSE 5
            END
          `), 'ASC'],
          ['createdAt', 'ASC'],
        ]
      : [['createdAt', 'DESC']];

    const [patients, pending, done] = await Promise.all([
      TriagePatient.findAll({
        where,
        include: [
          { model: Queue, as: 'queue' }
        ],
        order,
        limit: 200,
      }),
      TriagePatient.count({ where: { status_verifikasi: 'BELUM_DIVERIFIKASI' } }),
      TriagePatient.count({ where: { status_verifikasi: { [Op.in]: ['DIVERIFIKASI', 'OVERRIDDEN'] } } }),
    ]);

    return res.json({
      status: 'success',
      data: patients,
      meta: { pending, done },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengambil detail satu pasien triase berdasarkan ID
 */
export const getTriagePatientById = async (req, res, next) => {
  try {
    const patient = await TriagePatient.findByPk(req.params.id, {
      include: [
        { model: Queue, as: 'queue' }
      ],
    });
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Pasien tidak ditemukan.',
      });
    }
    return res.json({
      status: 'success',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengedit data pasien oleh perawat. Dengan `verifikasi: true`, data ditandai terverifikasi
 * beserta identitas verifikator & waktunya. Mengubah prioritas dari rekomendasi AI wajib
 * disertai alasan (status menjadi OVERRIDDEN).
 */
export const updateTriagePatient = async (req, res, next) => {
  try {
    const data = triageVerifySchema.parse(req.body);

    const patient = await TriagePatient.findByPk(req.params.id, {
      include: [
        { model: Queue, as: 'queue' }
      ],
    });
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Pasien tidak ditemukan.',
      });
    }

    // Data lama (sebelum fitur verifikasi) belum punya prioritas_ai: gunakan prioritas saat ini sebagai acuan.
    if (!patient.prioritas_ai) {
      patient.prioritas_ai = patient.prioritas_triage;
    }

    const previousPriority = patient.prioritas_triage;
    const isOverride = data.prioritas_triage !== patient.prioritas_ai;
    if (data.verifikasi && isOverride && !data.alasan_override) {
      return res.status(400).json({
        status: 'error',
        message: 'Alasan perubahan prioritas wajib diisi bila prioritas berbeda dari rekomendasi AI.',
      });
    }

    patient.set({
      nama_pasien: data.nama_pasien,
      umur: data.umur,
      satuan_umur: data.satuan_umur,
      jenis_kelamin: data.jenis_kelamin,
      nik: data.nik || null,
      tanggal_lahir: data.tanggal_lahir || null,
      keluhan_utama: data.keluhan_utama,
      waktu_mulai_keluhan: data.waktu_mulai_keluhan || null,
      alergi_obat: data.alergi_obat || null,
      tanda_vital: data.tanda_vital || {},
      asesmen: data.asesmen || {},
      catatan_petugas: data.catatan_petugas || null,
      prioritas_triage: data.prioritas_triage,
      alasan_override: isOverride ? (data.alasan_override || null) : null,
    });

    if (data.verifikasi) {
      const verifikator = req.user?.id ? await User.findByPk(req.user.id) : null;
      patient.status_verifikasi = isOverride ? 'OVERRIDDEN' : 'DIVERIFIKASI';
      patient.petugas_verifikator_id = verifikator?.id || null;
      patient.nama_verifikator = verifikator?.nama || null;
      patient.waktu_verifikasi = new Date();
    }

    await patient.save();

    // Bila prioritas berubah, urutkan ulang nomor antrean hari itu
    // (dari tingkat risiko paling tinggi) lalu muat ulang nomornya.
    if (data.prioritas_triage !== previousPriority) {
      const queue = await Queue.findOne({ where: { triage_patient_id: patient.id } });
      if (queue) {
        await renumberQueuesForDay(queue.createdAt);
        await queue.reload();
      }
    }

    return res.json({
      status: 'success',
      message: data.verifikasi
        ? 'Data pasien berhasil diverifikasi.'
        : 'Perubahan data pasien berhasil disimpan.',
      data: patient,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return zodErrorResponse(res, error);
    }
    next(error);
  }
};

/**
 * Menghapus data registrasi pasien triase beserta antreannya
 */
export const deleteTriagePatient = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const patient = await TriagePatient.findByPk(req.params.id, { transaction });
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Pasien tidak ditemukan.',
      });
    }

    const queue = await Queue.findOne({
      where: { triage_patient_id: patient.id },
      transaction,
    });
    const dayRef = queue?.createdAt || patient.createdAt;

    await Queue.destroy({ where: { triage_patient_id: patient.id }, transaction });
    await Referral.destroy({ where: { triage_patient_id: patient.id }, transaction });
    await patient.destroy({ transaction });

    // Rapikan kembali nomor antrean hari itu agar tetap berurutan
    await renumberQueuesForDay(dayRef, transaction);

    await transaction.commit();

    return res.json({
      status: 'success',
      message: 'Data registrasi pasien berhasil dihapus.',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};