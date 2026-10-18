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
  nik: {
    type: DataTypes.STRING(16),
    allowNull: true,
  },
  tanggal_lahir: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  umur: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  satuan_umur: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'tahun',
  },
  jenis_kelamin: {
    type: DataTypes.ENUM('L', 'P'),
    allowNull: false,
    defaultValue: 'L',
  },
  keluhan_utama: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  waktu_mulai_keluhan: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  alergi_obat: {
    type: DataTypes.STRING,
    allowNull: true,
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
  // Rekomendasi prioritas asli dari AI (prioritas_triage = prioritas final yang ditetapkan petugas)
  prioritas_ai: {
    type: DataTypes.STRING(2),
    allowNull: true,
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
  // Asesmen petugas: nyeri, faktor relevan, tanda bahaya, riwayat penyakit
  asesmen: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
  },
  catatan_petugas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  alasan_override: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status_verifikasi: {
    type: DataTypes.ENUM('BELUM_DIVERIFIKASI', 'DIVERIFIKASI', 'OVERRIDDEN'),
    allowNull: false,
    defaultValue: 'BELUM_DIVERIFIKASI',
  },
  petugas_verifikator_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  nama_verifikator: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  waktu_verifikasi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'triage_patients',
});

export default TriagePatient;