import sequelize from '../config/database.js';
import User from './User.js';

// Setup relasi/asosiasi antar model di sini nantinya
// Contoh: User.hasMany(TriageRecord, { foreignKey: 'userId' });

export {
  sequelize,
  User,
};

export default {
  sequelize,
  User,
};
