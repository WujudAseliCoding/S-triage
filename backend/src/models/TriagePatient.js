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
  satuan_umur: {
    type: DataTypes.ENUM('Tahun', 'Bulan', 'Hari'),
    allowNull: true,
    defaultValue: 'Tahun',
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
  skala_nyeri: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Operative/queue category (may be provisional when review_required).
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
  // AI factual summary (not a decision reason).
  analisis_ai: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // --- Audit / accountability fields ---
  ai_recommended_category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  classification_status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  review_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  rule_version: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  extraction_mode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  alasan_esi: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ai_recommendation: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  // --- Human verification (separate from the AI recommendation) ---
  final_prioritas: {
    type: DataTypes.ENUM('P1', 'P2', 'P3', 'P0'),
    allowNull: true,
  },
  reviewed_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  override_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'triage_patients',
});

export default TriagePatient;
