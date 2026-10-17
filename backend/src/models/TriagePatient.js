import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const TriagePatient = sequelize.define('TriagePatient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nama_pasien: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  umur: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  jenis_kelamin: {
    type: DataTypes.ENUM('L', 'P'),
    allowNull: false,
  },
  keluhan_utama: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tanda_vital: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  prioritas_triage: {
    type: DataTypes.ENUM('P1', 'P2', 'P3', 'P0'),
    allowNull: false,
    defaultValue: 'P3',
  },
  skor_urgensi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  analisis_ai: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'triage_patients',
});

export default TriagePatient;