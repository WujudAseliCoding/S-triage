import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const Queue = sequelize.define('Queue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nomor_antrean: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('WAITING', 'CALLING', 'SERVING', 'FINISHED', 'REFER_OUT', 'CANCELLED'),
    defaultValue: 'WAITING',
    allowNull: false,
  },
  triage_patient_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  dokter_id: {
    type: DataTypes.UUID,
    allowNull: true, // Bisa kosong saat pendaftaran awal sebelum di-assign atau dipanggil oleh dokter tertentu
  },
  waktu_panggil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  waktu_selesai: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'queues',
});

export default Queue;