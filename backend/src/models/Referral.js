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
  faskes_tujuan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  alasan_rujukan: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status_rujukan: {
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
    defaultValue: 'PENDING',
    allowNull: false,
  },
  catatan_medis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'referrals',
});

export default Referral;