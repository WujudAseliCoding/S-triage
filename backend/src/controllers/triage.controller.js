import { TriagePatient, Queue, Referral } from '../models/index.js';
import { triageInputSchema, triageUpdateSchema } from '../schema/triage.schema.js';
import { analyzeTriageWithAI } from '../config/ai.js';
import sequelize from '../config/database.js';

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

    // 3. Simpan data pasien triase
    const patient = await TriagePatient.create({
      nama_pasien: validatedData.nama_pasien,
      umur: validatedData.umur,
      jenis_kelamin: validatedData.jenis_kelamin,
      keluhan_utama: validatedData.keluhan_utama,
      tanda_vital: validatedData.tanda_vital || {},
      prioritas_triage: finalPrioritas,
      skor_urgensi: finalSkorUrgensi,
      analisis_ai: finalAnalisisAI,
    }, { transaction });

    // 4. Generate Nomor Antrean
    // Nomor antrean digabung menjadi satu urutan harian (tanpa prefix A/B/C/D),
    // sehingga seluruh pasien memakai satu deret nomor yang berurutan.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayQueues = await Queue.findAll({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.between]: [todayStart, todayEnd],
        },
      },
      attributes: ['nomor_antrean'],
      transaction,
    });

    // Ambil nomor terbesar hari ini agar tidak terjadi duplikasi
    // (mis. setelah ada antrean yang dihapus).
    const lastNumber = todayQueues.reduce((max, q) => {
      const match = String(q.nomor_antrean || '').match(/(\d+)\s*$/);
      const value = match ? parseInt(match[1], 10) : 0;
      return Number.isNaN(value) ? max : Math.max(max, value);
    }, 0);

    const nomorAntrean = String(lastNumber + 1).padStart(2, '0');

    // 5. Buat entri antrean (Queue) baru
    const queue = await Queue.create({
      nomor_antrean: nomorAntrean,
      status: 'WAITING',
      triage_patient_id: patient.id,
    }, { transaction });

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
      return res.status(400).json({
        status: 'error',
        message: 'Validasi data gagal.',
        errors: error.errors,
      });
    }
    next(error);
  }
};

/**
 * Mengambil daftar seluruh pasien triase
 */
export const getTriagePatients = async (req, res, next) => {
  try {
    const patients = await TriagePatient.findAll({
      include: [
        { model: Queue, as: 'queue' }
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json({
      status: 'success',
      data: patients,
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

// Pemetaan prioritas ke prefix nomor antrean tidak lagi digunakan karena
// nomor antrean memakai satu urutan harian yang digabung (tanpa A/B/C/D).

/**
 * Memperbarui data registrasi pasien triase (mode edit dari halaman antrean)
 */
export const updateTriagePatient = async (req, res, next) => {
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

    const data = triageUpdateSchema.parse(req.body);
    const priorityChanged =
      data.prioritas_triage !== undefined && data.prioritas_triage !== patient.prioritas_triage;

    const updates = {};
    if (data.nama_pasien !== undefined) updates.nama_pasien = data.nama_pasien;
    if (data.umur !== undefined) updates.umur = data.umur;
    if (data.jenis_kelamin !== undefined) updates.jenis_kelamin = data.jenis_kelamin;
    if (data.keluhan_utama !== undefined) updates.keluhan_utama = data.keluhan_utama;
    if (data.tanda_vital !== undefined) updates.tanda_vital = data.tanda_vital;
    if (data.prioritas_triage !== undefined) updates.prioritas_triage = data.prioritas_triage;
    if (data.catatan_petugas !== undefined) updates.catatan_petugas = data.catatan_petugas;

    if (priorityChanged) {
      updates.status_verifikasi = 'OVERRIDDEN';
      if (data.alasan_perubahan) {
        updates.catatan_petugas = [patient.catatan_petugas, `Perubahan prioritas: ${data.alasan_perubahan}`]
          .filter(Boolean)
          .join('\n');
      }
    }

    await patient.update(updates, { transaction });

    // Ambil antrean terkait untuk dikembalikan pada respons. Nomor antrean kini
    // memakai satu urutan harian, jadi tidak perlu diubah saat prioritas berubah.
    const queue = await Queue.findOne({
      where: { triage_patient_id: patient.id },
      transaction,
    });

    await transaction.commit();

    return res.json({
      status: 'success',
      message: 'Data registrasi pasien berhasil diperbarui.',
      data: {
        patient: {
          id: patient.id,
          nama_pasien: patient.nama_pasien,
          umur: patient.umur,
          jenis_kelamin: patient.jenis_kelamin,
          keluhan_utama: patient.keluhan_utama,
          tanda_vital: patient.tanda_vital,
          catatan_petugas: patient.catatan_petugas,
          prioritas_triage: patient.prioritas_triage,
          skor_urgensi: patient.skor_urgensi,
          analisis_ai: patient.analisis_ai,
        },
        queue: queue
          ? { id: queue.id, nomor_antrean: queue.nomor_antrean, status: queue.status }
          : null,
      },
    });
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validasi data gagal.',
        errors: error.issues || error.errors,
      });
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

    await Queue.destroy({ where: { triage_patient_id: patient.id }, transaction });
    await Referral.destroy({ where: { triage_patient_id: patient.id }, transaction });
    await patient.destroy({ transaction });
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