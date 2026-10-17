import { Queue, TriagePatient, User } from '../models/index.js';
import sequelize from '../config/database.js';

/**
 * Mengambil antrean aktif (live queue) hari ini
 * Diurutkan berdasarkan prioritas klinis (P1 -> P2 -> P3 -> P0) dan waktu pendaftaran
 */
export const getLiveQueue = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const queues = await Queue.findAll({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.between]: [todayStart, todayEnd],
        },
        // Menampilkan antrean yang belum selesai atau dibatalkan
        status: {
          [sequelize.Sequelize.Op.in]: ['WAITING', 'CALLING', 'SERVING'],
        },
      },
      include: [
        {
          model: TriagePatient,
          as: 'patient',
        },
        {
          model: User,
          as: 'dokter',
          attributes: ['id', 'nama', 'email', 'role'],
        },
      ],
      // Urutkan berdasarkan prioritas klinis (P1 paling mendesak) lalu waktu pendaftaran
      order: [
        [sequelize.literal(`
          CASE 
            WHEN "patient"."prioritas_triage" = 'P1' THEN 1
            WHEN "patient"."prioritas_triage" = 'P2' THEN 2
            WHEN "patient"."prioritas_triage" = 'P3' THEN 3
            WHEN "patient"."prioritas_triage" = 'P0' THEN 4
            ELSE 5
          END
        `), 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });

    return res.json({
      status: 'success',
      data: queues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Memanggil nomor antrean pasien (status CALLING)
 */
export const callPatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dokter_id } = req.body; // Dokter yang memanggil dari dashboard staf

    const queue = await Queue.findByPk(id);
    if (!queue) {
      return res.status(404).json({
        status: 'error',
        message: 'Antrean tidak ditemukan.',
      });
    }

    queue.status = 'CALLING';
    queue.dokter_id = dokter_id || queue.dokter_id;
    queue.waktu_panggil = new Date();
    await queue.save();

    return res.json({
      status: 'success',
      message: 'Pasien sedang dipanggil.',
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Memulai pelayanan medis ke pasien (status SERVING)
 */
export const startServing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queue = await Queue.findByPk(id);
    if (!queue) {
      return res.status(404).json({
        status: 'error',
        message: 'Antrean tidak ditemukan.',
      });
    }

    queue.status = 'SERVING';
    await queue.save();

    return res.json({
      status: 'success',
      message: 'Pelayanan medis dimulai.',
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Menyelesaikan pelayanan medis pasien (status FINISHED)
 */
export const finishServing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queue = await Queue.findByPk(id);
    if (!queue) {
      return res.status(404).json({
        status: 'error',
        message: 'Antrean tidak ditemukan.',
      });
    }

    queue.status = 'FINISHED';
    queue.waktu_selesai = new Date();
    await queue.save();

    return res.json({
      status: 'success',
      message: 'Pelayanan medis selesai.',
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Membatalkan antrean pasien (status CANCELLED)
 */
export const cancelQueue = async (req, res, next) => {
  try {
    const { id } = req.params;

    const queue = await Queue.findByPk(id);
    if (!queue) {
      return res.status(404).json({
        status: 'error',
        message: 'Antrean tidak ditemukan.',
      });
    }

    queue.status = 'CANCELLED';
    await queue.save();

    return res.json({
      status: 'success',
      message: 'Antrean berhasil dibatalkan.',
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};