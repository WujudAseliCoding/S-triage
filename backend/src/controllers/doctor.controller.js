import { User, Queue } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

/**
 * Mengambil daftar dokter beserta jadwal praktik dan jumlah antrean aktifnya
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
      include: [
        {
          model: Queue,
          as: 'queues',
          attributes: ['id', 'nomor_antrean', 'status'],
          where: {
            status: {
              [Op.in]: ['WAITING', 'CALLING', 'SERVING'],
            },
          },
          required: false,
        },
      ],
      order: [['nama', 'ASC']],
    });

    const doctorsWithCounts = doctors.map((doc) => {
      const queues = doc.queues || [];
      const serving = queues.filter((q) => q.status === 'SERVING').length;
      const waiting = queues.filter((q) => q.status === 'WAITING' || q.status === 'CALLING').length;
      return {
        ...doc.toJSON(),
        active_patient_count: queues.length,
        serving_count: serving,
        waiting_count: waiting,
      };
    });

    return res.json({
      status: 'success',
      data: doctorsWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mengambil daftar perawat triase dari database
 */
export const getNurses = async (req, res, next) => {
  try {
    const nurses = await User.findAll({
      where: {
        role: 'PERAWAT',
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
        'createdAt',
      ],
      order: [['nama', 'ASC']],
    });

    return res.json({
      status: 'success',
      data: nurses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Menambahkan dokter atau perawat baru
 */
export const createDoctor = async (req, res, next) => {
  try {
    const {
      nama,
      email,
      password,
      role = 'DOKTER',
      spesialisasi = 'Dokter Umum',
      layanan = 'Layanan FKTP & Triase',
      kompetensi = 'FKTP & Triase',
      status = 'Tersedia',
      jadwal = '08:00–14:00',
      hari = 'Senin–Jumat',
      jalur = 'Umum',
    } = req.body;

    if (!nama || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama lengkap dan email wajib diisi.',
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: `Email ${email} sudah terdaftar di sistem.`,
      });
    }

    const rawPassword = password || 'Petugas123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newUser = await User.create({
      nama,
      email,
      password: hashedPassword,
      role,
      spesialisasi,
      layanan,
      kompetensi,
      status,
      jadwal,
      hari,
      jalur,
    });

    const userSafe = {
      id: newUser.id,
      nama: newUser.nama,
      email: newUser.email,
      role: newUser.role,
      spesialisasi: newUser.spesialisasi,
      layanan: newUser.layanan,
      kompetensi: newUser.kompetensi,
      status: newUser.status,
      jadwal: newUser.jadwal,
      hari: newUser.hari,
      jalur: newUser.jalur,
    };

    return res.status(201).json({
      status: 'success',
      message: `${role === 'PERAWAT' ? 'Perawat' : 'Dokter'} ${nama} berhasil ditambahkan.`,
      data: userSafe,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Memperbarui data profil dan jadwal dokter/petugas
 */
export const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await User.findByPk(id);
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Petugas / dokter tidak ditemukan.',
      });
    }

    const {
      nama,
      email,
      spesialisasi,
      layanan,
      kompetensi,
      status,
      jadwal,
      hari,
      jalur,
    } = req.body;

    if (nama !== undefined) doctor.nama = nama;
    if (email !== undefined) doctor.email = email;
    if (spesialisasi !== undefined) doctor.spesialisasi = spesialisasi;
    if (layanan !== undefined) doctor.layanan = layanan;
    if (kompetensi !== undefined) doctor.kompetensi = kompetensi;
    if (status !== undefined) doctor.status = status;
    if (jadwal !== undefined) doctor.jadwal = jadwal;
    if (hari !== undefined) doctor.hari = hari;
    if (jalur !== undefined) doctor.jalur = jalur;

    await doctor.save();

    const doctorSafe = {
      id: doctor.id,
      nama: doctor.nama,
      email: doctor.email,
      role: doctor.role,
      spesialisasi: doctor.spesialisasi,
      layanan: doctor.layanan,
      kompetensi: doctor.kompetensi,
      status: doctor.status,
      jadwal: doctor.jadwal,
      hari: doctor.hari,
      jalur: doctor.jalur,
    };

    return res.json({
      status: 'success',
      message: 'Jadwal dan data petugas berhasil diperbarui.',
      data: doctorSafe,
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

    const doctorSafe = {
      id: doctor.id,
      nama: doctor.nama,
      email: doctor.email,
      role: doctor.role,
      status: doctor.status,
    };

    return res.json({
      status: 'success',
      message: 'Status dokter berhasil diperbarui.',
      data: doctorSafe,
    });
  } catch (error) {
    next(error);
  }
};
