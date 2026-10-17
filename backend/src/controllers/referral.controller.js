import { Referral, TriagePatient, Queue } from '../models/index.js';
import sequelize from '../config/database.js';

/**
 * Membuat rujukan eksternal baru untuk pasien triase
 */
export const createReferral = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      triage_patient_id,
      faskes_tujuan,
      alasan_rujukan,
      catatan_medis,
    } = req.body;

    // 1. Validasi apakah pasien triase ada
    const patient = await TriagePatient.findByPk(triage_patient_id);
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Pasien triase tidak ditemukan.',
      });
    }

    // 2. Buat record rujukan eksternal
    const referral = await Referral.create({
      triage_patient_id,
      faskes_tujuan,
      alasan_rujukan,
      catatan_medis,
      status_rujukan: 'PENDING',
    }, { transaction });

    // 3. Update status antrean terkait menjadi REFER_OUT jika antreannya masih aktif
    const queue = await Queue.findOne({
      where: { triage_patient_id },
    });
    if (queue) {
      queue.status = 'REFER_OUT';
      await queue.save({ transaction });
    }

    await transaction.commit();

    return res.status(201).json({
      status: 'success',
      message: 'Rujukan eksternal berhasil dicatat.',
      data: referral,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Mengambil daftar seluruh rujukan eksternal
 */
export const getReferrals = async (req, res, next) => {
  try {
    const referrals = await Referral.findAll({
      include: [
        {
          model: TriagePatient,
          as: 'patient',
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json({
      status: 'success',
      data: referrals,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengambil satu rujukan berdasarkan ID
 */
export const getReferralById = async (req, res, next) => {
  try {
    const referral = await Referral.findByPk(req.params.id, {
      include: [
        {
          model: TriagePatient,
          as: 'patient',
        },
      ],
    });
    if (!referral) {
      return res.status(404).json({
        status: 'error',
        message: 'Data rujukan tidak ditemukan.',
      });
    }
    return res.json({
      status: 'success',
      data: referral,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Memperbarui status rujukan (ACCEPT/REJECT)
 */
export const updateReferralStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status_rujukan, catatan_medis } = req.body;

    // Semua nilai status yang valid sesuai model Referral
    const VALID_STATUSES = [
      'Draf',
      'Menunggu konfirmasi',
      'Diterima',
      'Dalam perjalanan',
      'Serah terima selesai',
      'Ditolak',
      'PENDING',
      'ACCEPTED',
      'REJECTED',
    ];
    if (!VALID_STATUSES.includes(status_rujukan)) {
      return res.status(400).json({
        status: 'error',
        message: `Status rujukan tidak valid. Nilai yang diizinkan: ${VALID_STATUSES.join(', ')}.`,
      });
    }

    const referral = await Referral.findByPk(id);
    if (!referral) {
      return res.status(404).json({
        status: 'error',
        message: 'Data rujukan tidak ditemukan.',
      });
    }

    referral.status_rujukan = status_rujukan;
    if (catatan_medis) referral.catatan_medis = catatan_medis;
    await referral.save();

    return res.json({
      status: 'success',
      message: `Status rujukan berhasil diperbarui menjadi ${status_rujukan}.`,
      data: referral,
    });
  } catch (error) {
    next(error);
  }
};