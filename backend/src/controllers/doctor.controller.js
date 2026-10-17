import { User } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Mengambil daftar dokter dan jadwal praktiknya
 */
export const getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.findAll({
      where: {
        role: {
          [Op.in]: ['DOKTER', 'ADMIN'],
        },
      },
      attributes: [
        'id',
        'nama',
        'email',
        'role',
        'spesialisasi',
        'layanan',
        'kompetensi',
        'status',
        'jadwal',
        'hari',
        'jalur',
      ],
      order: [['nama', 'ASC']],
    });

    return res.json({
      status: 'success',
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Memperbarui status ketersediaan dokter (Tersedia, Istirahat, Sibuk, OFF)
 */
export const updateDoctorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const doctor = await User.findByPk(id);
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Petugas / dokter tidak ditemukan.',
      });
    }

    doctor.status = status;
    await doctor.save();

    return res.json({
      status: 'success',
      message: 'Status dokter berhasil diperbarui.',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};
