import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const Facility = sequelize.define('Facility', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  jarak_km: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1.0,
  },
  layanan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  detail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  kapasitas_persen: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
  },
  tone: {
    type: DataTypes.STRING,
    defaultValue: 'bg-emerald-500',
  },
  text_class: {
    type: DataTypes.STRING,
    defaultValue: 'text-emerald-600',
  },
}, {
  timestamps: true,
  tableName: 'facilities',
});

export default Facility;
