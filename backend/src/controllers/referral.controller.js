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
      facility_id,
      faskes_tujuan,
      alasan_rujukan,
      ringkasan_kondisi,
      tanda_vital_terakhir,
      tindakan_stabilisasi,
      kebutuhan_layanan,
      kesiapan_menerima,
      transportasi = 'Ambulans Faskes',
      petugas_pengirim = 'dr. Faisal Rahman',
      status_rujukan = 'Menunggu konfirmasi',
      catatan_medis,
      catatan_serah_terima,
    } = req.body;

    // 1. Validasi input wajib
    if (!triage_patient_id || !faskes_tujuan) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Pasien triase dan faskes tujuan wajib dipilih.',
      });
    }

    // 2. Validasi apakah pasien triase ada
    const patient = await TriagePatient.findByPk(triage_patient_id);
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Pasien triase tidak ditemukan.',
      });
    }

    // 3. Buat record rujukan eksternal lengkap
    const referral = await Referral.create({
      triage_patient_id,
      facility_id: facility_id || null,
      faskes_tujuan,
      alasan_rujukan: alasan_rujukan || 'Rujukan pemeriksaan dan penanganan spesialis lanjutan.',
      ringkasan_kondisi: ringkasan_kondisi || null,
      tanda_vital_terakhir: tanda_vital_terakhir || patient.tanda_vital || null,
      tindakan_stabilisasi: tindakan_stabilisasi || null,
      kebutuhan_layanan: kebutuhan_layanan || null,
      kesiapan_menerima: kesiapan_menerima || null,
      transportasi,
      petugas_pengirim,
      status_rujukan,
      catatan_medis: catatan_medis || null,
      catatan_serah_terima: catatan_serah_terima || null,
    }, { transaction });

    // 4. Update status antrean terkait menjadi REFER_OUT jika antreannya masih aktif dan bukan sekadar draf
    if (status_rujukan !== 'Draf') {
      const queue = await Queue.findOne({
        where: { triage_patient_id },
      });
      if (queue) {
        queue.status = 'REFER_OUT';
        await queue.save({ transaction });
      }
    }

    await transaction.commit();

    const createdReferral = await Referral.findByPk(referral.id, {
      include: [{ model: TriagePatient, as: 'patient' }],
    });

    return res.status(201).json({
      status: 'success',
      message: 'Rujukan eksternal berhasil dicatat.',
      data: createdReferral,
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

    if (status_rujukan !== 'Draf') {
      const queue = await Queue.findOne({
        where: { triage_patient_id: referral.triage_patient_id },
      });
      if (queue && queue.status !== 'REFER_OUT') {
        queue.status = 'REFER_OUT';
        await queue.save();
      }
    }

    const updated = await Referral.findByPk(id, {
      include: [{ model: TriagePatient, as: 'patient' }],
    });

    return res.json({
      status: 'success',
      message: `Status rujukan berhasil diperbarui menjadi ${status_rujukan}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Memperbarui data detail rujukan secara menyeluruh
 */
export const updateReferral = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const referral = await Referral.findByPk(id, { transaction });
    if (!referral) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Data rujukan tidak ditemukan.',
      });
    }

    const {
      faskes_tujuan,
      facility_id,
      alasan_rujukan,
      ringkasan_kondisi,
      tanda_vital_terakhir,
      tindakan_stabilisasi,
      kebutuhan_layanan,
      kesiapan_menerima,
      transportasi,
      petugas_pengirim,
      status_rujukan,
      catatan_medis,
      catatan_serah_terima,
    } = req.body;

    if (faskes_tujuan !== undefined) referral.faskes_tujuan = faskes_tujuan;
    if (facility_id !== undefined) referral.facility_id = facility_id;
    if (alasan_rujukan !== undefined) referral.alasan_rujukan = alasan_rujukan;
    if (ringkasan_kondisi !== undefined) referral.ringkasan_kondisi = ringkasan_kondisi;
    if (tanda_vital_terakhir !== undefined) referral.tanda_vital_terakhir = tanda_vital_terakhir;
    if (tindakan_stabilisasi !== undefined) referral.tindakan_stabilisasi = tindakan_stabilisasi;
    if (kebutuhan_layanan !== undefined) referral.kebutuhan_layanan = kebutuhan_layanan;
    if (kesiapan_menerima !== undefined) referral.kesiapan_menerima = kesiapan_menerima;
    if (transportasi !== undefined) referral.transportasi = transportasi;
    if (petugas_pengirim !== undefined) referral.petugas_pengirim = petugas_pengirim;
    if (catatan_medis !== undefined) referral.catatan_medis = catatan_medis;
    if (catatan_serah_terima !== undefined) referral.catatan_serah_terima = catatan_serah_terima;

    if (status_rujukan !== undefined) {
      referral.status_rujukan = status_rujukan;
      if (status_rujukan !== 'Draf') {
        const queue = await Queue.findOne({
          where: { triage_patient_id: referral.triage_patient_id },
          transaction,
        });
        if (queue && queue.status !== 'REFER_OUT') {
          queue.status = 'REFER_OUT';
          await queue.save({ transaction });
        }
      }
    }

    await referral.save({ transaction });
    await transaction.commit();

    const updated = await Referral.findByPk(id, {
      include: [{ model: TriagePatient, as: 'patient' }],
    });

    return res.json({
      status: 'success',
      message: 'Data rujukan berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};