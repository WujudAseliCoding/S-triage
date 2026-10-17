import { TriagePatient, Queue } from '../models/index.js';
import { triageInputSchema } from '../schema/triage.schema.js';
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
    // Kita tentukan prefix berdasarkan prioritas:
    // P1 -> A (Merah), P2 -> B (Kuning), P3 -> C (Hijau), P0 -> D (Hitam)
    let prefix = 'C';
    if (finalPrioritas === 'P1') prefix = 'A';
    else if (finalPrioritas === 'P2') prefix = 'B';
    else if (finalPrioritas === 'P0') prefix = 'D';

    // Hitung jumlah antrean hari ini dengan prefix yang sama untuk menentukan nomor urut
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const queueCount = await Queue.count({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.between]: [todayStart, todayEnd],
        },
        nomor_antrean: {
          [sequelize.Sequelize.Op.like]: `${prefix}%`,
        },
      },
    });

    const nextNumber = String(queueCount + 1).padStart(2, '0');
    const nomorAntrean = `${prefix}-${nextNumber}`;

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