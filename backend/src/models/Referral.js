import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const Referral = sequelize.define('Referral', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  triage_patient_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  facility_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  faskes_tujuan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  alasan_rujukan: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  ringkasan_kondisi: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tanda_vital_terakhir: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  tindakan_stabilisasi: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  kebutuhan_layanan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  kesiapan_menerima: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  transportasi: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Ambulans Faskes',
  },
  petugas_pengirim: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status_rujukan: {
    type: DataTypes.ENUM(
      'Draf',
      'Menunggu konfirmasi',
      'Diterima',
      'Dalam perjalanan',
      'Serah terima selesai',
      'Ditolak',
      'PENDING',
      'ACCEPTED',
      'REJECTED'
    ),
    defaultValue: 'Draf',
    allowNull: false,
  },
  catatan_medis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  catatan_serah_terima: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'referrals',
});

export default Referral;