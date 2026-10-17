import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'DOKTER', 'PERAWAT'),
    defaultValue: 'PERAWAT',
  },
  spesialisasi: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Dokter Umum',
  },
  layanan: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Layanan FKTP & Triase',
  },
  kompetensi: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'FKTP & Triase',
  },
  status: {
    type: DataTypes.ENUM('Tersedia', 'Istirahat', 'Sibuk', 'OFF'),
    defaultValue: 'Tersedia',
  },
  jadwal: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '08:00–14:00',
  },
  hari: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Senin–Jumat',
  },
  jalur: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Umum',
  },
}, {
  timestamps: true,
  tableName: 'users',
});

export default User;
